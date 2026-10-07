"""API портала СтарЛюкс: вход, каталог, заказы, клиенты и обмен с 1С."""
import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from decimal import Decimal

import psycopg2
import psycopg2.extras

import nomenclature

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p16770056_starlux_website')
STATUSES = ['Новый', 'Передан в 1С', 'Собирается', 'Отгружен', 'Доставлен', 'Отменён']
STAFF = ('manager', 'admin')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Api-Key',
    'Access-Control-Max-Age': '86400',
}


def resp(code, data):
    def conv(o):
        if isinstance(o, Decimal):
            return float(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return str(o)
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps(data, ensure_ascii=False, default=conv)}


def hash_pw(pw, salt=None):
    salt = salt or secrets.token_hex(8)
    return salt + '$' + hashlib.pbkdf2_hmac('sha256', pw.encode(), salt.encode(), 100000).hex()


def check_pw(pw, stored):
    salt = stored.split('$', 1)[0]
    return secrets.compare_digest(hash_pw(pw, salt), stored)


def db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn


def q(cur, sql, args=None):
    cur.execute(sql.replace('{S}', SCHEMA), args)


def current_user(cur, headers):
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not token:
        return None
    q(cur, "SELECT u.* FROM {S}.sessions s JOIN {S}.users u ON u.id = s.user_id "
           "WHERE s.token = %s AND s.expires_at > NOW()", (token,))
    u = cur.fetchone()
    if not u or u['blocked']:
        return None
    return u


def public_user(u):
    return {'id': u['id'], 'role': u['role'], 'login': u['login'], 'company': u['company'],
            'inn': u['inn'], 'contact': u['contact'], 'phone': u['phone'], 'blocked': u['blocked'],
            'createdAt': u['created_at'], 'priceTypeId': u.get('price_type_id')}


def client_price_type(cur, user):
    """Активный тип цены клиента; если не назначен или отключён — основной."""
    if user and user.get('role') == 'client' and user.get('price_type_id'):
        q(cur, "SELECT id FROM {S}.price_types WHERE id = %s AND active", (user['price_type_id'],))
        r = cur.fetchone()
        if r:
            return r['id']
    return None


def last_sync(cur):
    q(cur, "SELECT value FROM {S}.settings WHERE key = 'last_sync'")
    r = cur.fetchone()
    return r['value'] if r else None


def touch_sync(cur):
    q(cur, "UPDATE {S}.settings SET value = to_char(NOW(), 'YYYY-MM-DD\"T\"HH24:MI:SS') WHERE key = 'last_sync'")


def products(cur, price_type_id=None):
    q(cur, "SELECT p.id, p.name, p.category, p.pack, p.pack_kg AS \"packKg\", COALESCE(pp.price, p.price) AS price, "
           "p.stock, p.unit, p.article, p.manufacturer, p.full_name AS \"fullName\", p.description, p.dimensions, "
           "p.barcode FROM {S}.products p LEFT JOIN {S}.product_prices pp ON pp.product_id = p.id AND pp.price_type_id = %s "
           "WHERE p.active ORDER BY p.sort, p.name", (price_type_id or 0,))
    rows = cur.fetchall()
    q(cur, "SELECT i.product_id, i.url FROM {S}.product_images i JOIN {S}.products p ON p.id = i.product_id "
           "WHERE p.active ORDER BY i.is_main DESC, i.sort, i.id")
    imgs = {}
    for i in cur.fetchall():
        imgs.setdefault(i['product_id'], []).append(i['url'])
    for r in rows:
        r['images'] = imgs.get(r['id'], [])
    return rows


def load_orders(cur, client_id=None, only_new=False):
    where, args = [], []
    if client_id:
        where.append('o.client_id = %s')
        args.append(client_id)
    if only_new:
        where.append('NOT o.exported_1c')
    w = ('WHERE ' + ' AND '.join(where)) if where else ''
    q(cur, "SELECT o.id, o.number, o.client_id AS \"clientId\", u.company AS \"clientName\", u.inn AS \"clientInn\", "
           "u.ext_id AS \"clientExtId\", o.status, o.total, o.comment, o.cancel_reason AS \"cancelReason\", o.exported_1c AS \"exported\", "
           "o.address_name AS \"address\", a.code_1c AS \"addressCode1c\", "
           "o.price_type_name AS \"priceTypeName\", COALESCE(t.code_1c, '') AS \"priceTypeCode1c\", "
           "o.created_at AS date FROM {S}.orders o JOIN {S}.users u ON u.id = o.client_id "
           "LEFT JOIN {S}.delivery_addresses a ON a.id = o.address_id "
           "LEFT JOIN {S}.price_types t ON t.id = o.price_type_id "
           + w + " ORDER BY o.created_at DESC LIMIT 500", tuple(args))
    orders = cur.fetchall()
    if not orders:
        return []
    ids = tuple(o['id'] for o in orders)
    q(cur, "SELECT i.order_id, i.product_id AS \"productId\", i.name, i.qty, i.box_price AS \"boxPrice\", i.sum, "
           "COALESCE(p.article, '') AS article, COALESCE(p.manufacturer, '') AS manufacturer, "
           "COALESCE(p.code_1c, '') AS \"code1c\", COALESCE(p.unit, '') AS unit, COALESCE(p.pack_kg, 0) AS weight "
           "FROM {S}.order_items i LEFT JOIN {S}.products p ON p.id = i.product_id "
           "WHERE i.order_id IN %s ORDER BY i.id", (ids,))
    items = {}
    for it in cur.fetchall():
        items.setdefault(it.pop('order_id'), []).append(it)
    for o in orders:
        o['items'] = items.get(o['id'], [])
    return orders


def change_status(cur, order_id, new_status):
    """Меняет статус заказа; при отмене возвращает товар на остаток, при восстановлении — списывает снова."""
    q(cur, "SELECT status FROM {S}.orders WHERE id = %s", (order_id,))
    row = cur.fetchone()
    if not row:
        return 'Заказ не найден'
    old = row['status']
    if old == new_status:
        return None
    q(cur, "UPDATE {S}.orders SET status = %s WHERE id = %s AND status = %s RETURNING id", (new_status, order_id, old))
    if not cur.fetchone():
        return 'Статус заказа уже изменён, обновите страницу'
    if new_status == 'Отменён':
        q(cur, "UPDATE {S}.products p SET stock = p.stock + i.qty FROM {S}.order_items i "
               "WHERE i.order_id = %s AND i.product_id = p.id", (order_id,))
    elif old == 'Отменён':
        q(cur, "SELECT p.name, p.stock, p.unit, i.qty FROM {S}.order_items i JOIN {S}.products p ON p.id = i.product_id "
               "WHERE i.order_id = %s AND i.qty > p.stock", (order_id,))
        short = cur.fetchall()
        if short:
            q(cur, "UPDATE {S}.orders SET status = 'Отменён' WHERE id = %s", (order_id,))
            return 'Недостаточно остатка для восстановления: ' + '; '.join(
                f"{x['name']} — нужно {x['qty']}, доступно {x['stock']} {x['unit']}" for x in short)
        q(cur, "UPDATE {S}.products p SET stock = p.stock - i.qty FROM {S}.order_items i "
               "WHERE i.order_id = %s AND i.product_id = p.id", (order_id,))
    return None


def sync_client_extra(cur, client_id, c):
    """Тип цены и адреса доставки клиента из 1С (по кодам 1С)."""
    if c.get('priceTypeCode'):
        q(cur, "UPDATE {S}.users SET price_type_id = (SELECT id FROM {S}.price_types WHERE code_1c = %s LIMIT 1) WHERE id = %s",
          (str(c['priceTypeCode']), client_id))
    for a in c.get('addresses') or []:
        code = str(a.get('code1c') or '').strip()
        if not code or not a.get('name'):
            continue
        q(cur, "UPDATE {S}.delivery_addresses SET name=%s, active=%s WHERE client_id=%s AND code_1c=%s RETURNING id",
          (a['name'], a.get('active', True), client_id, code))
        if not cur.fetchone():
            q(cur, "INSERT INTO {S}.delivery_addresses (client_id, name, code_1c, active) VALUES (%s,%s,%s,%s)",
              (client_id, a['name'], code, a.get('active', True)))


def handle_1c(cur, action, body, headers, all_orders=False):
    key = os.environ.get('ONEC_API_KEY')
    given = headers.get('X-Api-Key') or headers.get('x-api-key')
    if not key or given != key:
        return resp(401, {'error': 'Неверный ключ 1С'})

    if action == '1c_products':
        rows = body.get('products', [])
        for i, p in enumerate(rows):
            q(cur, "INSERT INTO {S}.products (id, name, category, pack, pack_kg, price, stock, sort, active, unit, updated_at) "
                   "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW()) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, unit=EXCLUDED.unit, "
                   "category=EXCLUDED.category, pack=EXCLUDED.pack, pack_kg=EXCLUDED.pack_kg, price=EXCLUDED.price, "
                   "stock=EXCLUDED.stock, sort=EXCLUDED.sort, active=EXCLUDED.active, updated_at=NOW()",
              (str(p['id']), p['name'], p.get('category', 'Прочее'), p.get('pack', ''), p.get('packKg', 1),
               p.get('price', 0), p.get('stock', 0), p.get('sort', i), p.get('active', True), p.get('unit', 'кор.')))
        q(cur, "INSERT INTO {S}.product_groups (name, sort) SELECT DISTINCT p.category, 999 FROM {S}.products p "
               "WHERE p.group_id IS NULL AND NOT EXISTS (SELECT 1 FROM {S}.product_groups g WHERE g.name = p.category)")
        q(cur, "UPDATE {S}.products p SET group_id = g.id FROM {S}.product_groups g WHERE p.group_id IS NULL AND g.name = p.category")
        q(cur, "INSERT INTO {S}.product_prices (product_id, price_type_id, price) "
               "SELECT p.id, t.id, p.price FROM {S}.products p, {S}.price_types t WHERE t.is_main AND p.id IN %s "
               "ON CONFLICT (product_id, price_type_id) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW()",
          (tuple(str(p['id']) for p in rows) or ('',),))
        if body.get('full'):
            ids = tuple(str(p['id']) for p in rows) or ('',)
            q(cur, "UPDATE {S}.products SET active = FALSE WHERE id NOT IN %s", (ids,))
        touch_sync(cur)
        return resp(200, {'ok': True, 'count': len(rows)})

    if action == '1c_clients':
        rows = body.get('clients', [])
        created = []
        for c in rows:
            ext = str(c.get('extId') or c.get('inn'))
            q(cur, "SELECT id FROM {S}.users WHERE ext_id = %s OR (inn = %s AND role = 'client')", (ext, c.get('inn', '')))
            ex = cur.fetchone()
            if ex:
                q(cur, "UPDATE {S}.users SET company=%s, inn=%s, contact=%s, phone=%s, blocked=%s, ext_id=%s WHERE id=%s",
                  (c['company'], c.get('inn', ''), c.get('contact', ''), c.get('phone', ''), c.get('blocked', False), ext, ex['id']))
                sync_client_extra(cur, ex['id'], c)
            elif c.get('login') and c.get('password'):
                q(cur, "INSERT INTO {S}.users (role, login, password_hash, company, inn, contact, phone, ext_id, blocked) "
                       "VALUES ('client',%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (login) DO NOTHING",
                  (c['login'], hash_pw(c['password']), c['company'], c.get('inn', ''), c.get('contact', ''),
                   c.get('phone', ''), ext, c.get('blocked', False)))
                created.append(c['login'])
                q(cur, "SELECT id FROM {S}.users WHERE login = %s", (c['login'],))
                nu = cur.fetchone()
                if nu:
                    sync_client_extra(cur, nu['id'], c)
        touch_sync(cur)
        return resp(200, {'ok': True, 'count': len(rows), 'created': created})

    if action == '1c_orders':
        return resp(200, {'orders': load_orders(cur, only_new=not all_orders)})

    if action == '1c_orders_ack':
        for o in body.get('orders', []):
            st = o.get('status')
            if st and st not in STATUSES:
                st = None
            q(cur, "UPDATE {S}.orders SET exported_1c = TRUE, exported_at = COALESCE(exported_at, NOW()), "
                   "status = CASE WHEN status = 'Новый' THEN 'Передан в 1С' ELSE status END WHERE number = %s RETURNING id",
              (o['number'],))
            row = cur.fetchone()
            if row and st:
                change_status(cur, row['id'], st)
        touch_sync(cur)
        return resp(200, {'ok': True})

    return resp(404, {'error': 'Неизвестное действие'})


LEAD_STATUSES = ('new', 'work', 'done', 'rejected')


def create_lead(cur, body, event):
    def f(k, n):
        return str(body.get(k) or '').strip()[:n]
    company, contact, phone, email = f('company', 255), f('contact', 255), f('phone', 64), f('email', 255)
    if body.get('website'):
        return resp(200, {'ok': True})
    if not contact or len(''.join(ch for ch in phone if ch.isdigit())) < 10:
        return resp(400, {'error': 'Укажите имя и корректный телефон'})
    ip = ((event.get('requestContext') or {}).get('identity') or {}).get('sourceIp', '')[:64]
    q(cur, "SELECT COUNT(*) AS c FROM {S}.leads WHERE ip = %s AND created_at > NOW() - INTERVAL '1 hour'", (ip,))
    if ip and cur.fetchone()['c'] >= 5:
        return resp(429, {'error': 'Слишком много заявок, попробуйте позже'})
    q(cur, "INSERT INTO {S}.leads (company, contact, phone, email, business, message, ip) "
           "VALUES (%s,%s,%s,%s,%s,%s,%s)",
      (company, contact, phone, email, f('business', 64), f('message', 2000), ip))
    return resp(200, {'ok': True})


def handler(event: dict, context) -> dict:
    """Единый API портала оптовых заказов СтарЛюкс."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    headers = event.get('headers') or {}
    body = json.loads(event.get('body') or '{}') if method in ('POST', 'PUT') else {}

    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        if action.startswith('1c_'):
            return handle_1c(cur, action, body, headers, params.get('all') == '1')

        if action == 'login':
            login = (body.get('login') or '').strip()
            q(cur, "SELECT * FROM {S}.users WHERE lower(login) = lower(%s)", (login,))
            u = cur.fetchone()
            if not u or not check_pw(body.get('password') or '', u['password_hash']):
                return resp(401, {'error': 'Неверный логин или пароль'})
            if u['blocked']:
                return resp(403, {'error': 'Учётная запись заблокирована. Свяжитесь с менеджером'})
            token = secrets.token_hex(24)
            q(cur, "INSERT INTO {S}.sessions (token, user_id, expires_at) VALUES (%s, %s, %s)",
              (token, u['id'], datetime.utcnow() + (timedelta(days=30) if body.get('remember', True) else timedelta(hours=12))))
            return resp(200, {'token': token, 'user': public_user(u)})

        if action == 'lead':
            return create_lead(cur, body, event)

        user = current_user(cur, headers)
        if not user:
            return resp(401, {'error': 'Требуется вход'})
        staff = user['role'] in STAFF

        if action == 'catalog':
            return resp(200, {'products': products(cur, client_price_type(cur, user)), 'lastSync': last_sync(cur)})

        if action == 'price_list':
            from pricelist import build_price_list
            stamp = datetime.now().strftime('%d.%m.%Y')
            main = params.get('main') == '1'
            return resp(200, {'file': build_price_list(cur, None if main else client_price_type(cur, user),
                                                       None if main else user.get('company')),
                              'name': f'Прайс_СтарЛюкс_{stamp}.xlsx'})

        if action == 'my_addresses':
            q(cur, "SELECT id, name FROM {S}.delivery_addresses WHERE client_id = %s AND active ORDER BY name", (user['id'],))
            return resp(200, {'addresses': cur.fetchall()})

        if action in ('leads', 'lead_status'):
            if not staff:
                return resp(403, {'error': 'Нет доступа'})
            if action == 'lead_status':
                st = body.get('status')
                if st not in LEAD_STATUSES:
                    return resp(400, {'error': 'Неверный статус'})
                q(cur, "UPDATE {S}.leads SET status = %s WHERE id = %s", (st, int(body.get('id') or 0)))
                return resp(200, {'ok': True})
            q(cur, "SELECT id, company, contact, phone, email, business, message, status, "
                   "created_at AS \"createdAt\" FROM {S}.leads ORDER BY created_at DESC LIMIT 500")
            return resp(200, {'leads': cur.fetchall()})

        if action == 'me':
            return resp(200, {'user': public_user(user)})

        if action == 'logout':
            q(cur, "UPDATE {S}.sessions SET expires_at = NOW() WHERE token = %s",
              (headers.get('X-Auth-Token') or headers.get('x-auth-token'),))
            return resp(200, {'ok': True})

        if action == 'orders':
            return resp(200, {'orders': load_orders(cur, None if staff else user['id'])})

        if action == 'create_order':
            if user['role'] != 'client':
                return resp(403, {'error': 'Заказ оформляет клиент'})
            wanted = {str(i['productId']): int(i['qty']) for i in body.get('items', []) if int(i.get('qty', 0)) > 0}
            if not wanted:
                return resp(400, {'error': 'Заказ пуст'})
            q(cur, "SELECT id, name FROM {S}.delivery_addresses WHERE client_id = %s AND active", (user['id'],))
            addrs = {a['id']: a['name'] for a in cur.fetchall()}
            addr_id = body.get('addressId')
            if addrs and (not addr_id or int(addr_id) not in addrs):
                return resp(400, {'error': 'Выберите адрес доставки'})
            addr_id = int(addr_id) if addrs else None
            q(cur, "SELECT p.id, p.name, p.pack_kg, COALESCE(pp.price, p.price) AS price, p.stock, p.unit FROM {S}.products p "
                   "LEFT JOIN {S}.product_prices pp ON pp.product_id = p.id AND pp.price_type_id = %s "
                   "WHERE p.active AND p.id IN %s", (client_price_type(cur, user) or 0, tuple(wanted)))
            rows = cur.fetchall()
            q(cur, "SELECT id, name FROM {S}.price_types WHERE id = %s OR is_main ORDER BY (id = %s) DESC LIMIT 1",
              (client_price_type(cur, user) or 0, client_price_type(cur, user) or 0))
            pt = cur.fetchone() or {'id': None, 'name': None}
            if not rows:
                return resp(400, {'error': 'Товары не найдены'})
            over = [f"{p['name']} — доступно {p['stock']} {p['unit']}" for p in rows if wanted[p['id']] > p['stock']]
            if over:
                return resp(409, {'error': 'Недостаточно остатка: ' + '; '.join(over)})
            lines = []
            for p in rows:
                bp = round(Decimal(p['price']) * Decimal(p['pack_kg']))
                lines.append((p['id'], p['name'], wanted[p['id']], bp, bp * wanted[p['id']]))
            total = sum(l[4] for l in lines)
            comment = (body.get('comment') or '').strip()[:1000] or None
            q(cur, "INSERT INTO {S}.orders (number, client_id, total, comment, address_id, address_name, price_type_id, price_type_name) "
                   "VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
              ('tmp-' + secrets.token_hex(6), user['id'], total, comment, addr_id, addrs.get(addr_id), pt['id'], pt['name']))
            oid = cur.fetchone()['id']
            number = 'СЛ-' + str(2000 + oid)
            q(cur, "UPDATE {S}.orders SET number = %s WHERE id = %s", (number, oid))
            for l in lines:
                q(cur, "UPDATE {S}.products SET stock = stock - %s WHERE id = %s", (l[2], l[0]))
                q(cur, "INSERT INTO {S}.order_items (order_id, product_id, name, qty, box_price, sum) VALUES (%s,%s,%s,%s,%s,%s)",
                  (oid, *l))
            return resp(200, {'id': oid, 'number': number, 'total': total})

        if action == 'cancel_order':
            oid = int(body.get('orderId', 0))
            q(cur, "SELECT status, client_id FROM {S}.orders WHERE id = %s", (oid,))
            o = cur.fetchone()
            if not o or (not staff and o['client_id'] != user['id']):
                return resp(404, {'error': 'Заказ не найден'})
            if o['status'] == 'Отменён':
                return resp(409, {'error': 'Заказ уже отменён'})
            if o['status'] not in ('Новый', 'Передан в 1С'):
                return resp(409, {'error': 'Заказ уже собирается — для отмены свяжитесь с менеджером'})
            reason = (body.get('reason') or '').strip()[:1000]
            if not reason:
                return resp(400, {'error': 'Укажите причину отмены'})
            err = change_status(cur, oid, 'Отменён')
            if err:
                return resp(409, {'error': err})
            q(cur, "UPDATE {S}.orders SET cancel_reason = %s WHERE id = %s", (reason, oid))
            return resp(200, {'ok': True})

        if not staff:
            return resp(403, {'error': 'Недостаточно прав'})

        res = nomenclature.handle(cur, action, body)
        if res:
            return resp(*res)

        if action == 'set_status':
            if body.get('status') not in STATUSES:
                return resp(400, {'error': 'Неизвестный статус'})
            err = change_status(cur, int(body['orderId']), body['status'])
            if err:
                return resp(409, {'error': err})
            return resp(200, {'ok': True})

        if action == 'clients':
            q(cur, "SELECT u.*, (SELECT COUNT(*) FROM {S}.orders o WHERE o.client_id = u.id) AS orders_count, "
                   "(SELECT COUNT(*) FROM {S}.delivery_addresses a WHERE a.client_id = u.id AND a.active) AS addr_count, "
                   "t.name AS price_type_name FROM {S}.users u LEFT JOIN {S}.price_types t ON t.id = u.price_type_id "
                   "WHERE u.role = 'client' ORDER BY u.created_at DESC")
            return resp(200, {'clients': [{**public_user(c), 'ordersCount': c['orders_count'], 'addressesCount': c['addr_count'],
                                           'priceTypeName': c['price_type_name']} for c in cur.fetchall()]})

        if action == 'client_update':
            cid = int(body.get('id', 0))
            q(cur, "SELECT * FROM {S}.users WHERE id = %s AND role = 'client'", (cid,))
            if not cur.fetchone():
                return resp(404, {'error': 'Клиент не найден'})
            login = (body.get('login') or '').strip()
            if not (body.get('company') or '').strip() or not login:
                return resp(400, {'error': 'Заполните организацию и логин'})
            q(cur, "SELECT 1 FROM {S}.users WHERE lower(login) = lower(%s) AND id <> %s", (login, cid))
            if cur.fetchone():
                return resp(409, {'error': 'Такой логин уже занят'})
            pt = body.get('priceTypeId') or None
            q(cur, "UPDATE {S}.users SET company=%s, inn=%s, contact=%s, phone=%s, login=%s, price_type_id=%s WHERE id=%s",
              (body['company'].strip(), (body.get('inn') or '').strip(), (body.get('contact') or '').strip(),
               (body.get('phone') or '').strip(), login, int(pt) if pt else None, cid))
            pw = body.get('password') or ''
            if pw:
                if len(pw) < 4:
                    return resp(400, {'error': 'Пароль — минимум 4 символа'})
                q(cur, "UPDATE {S}.users SET password_hash = %s WHERE id = %s", (hash_pw(pw), cid))
                q(cur, "UPDATE {S}.sessions SET expires_at = NOW() WHERE user_id = %s", (cid,))
            return resp(200, {'ok': True})

        if action == 'client_addresses':
            q(cur, "SELECT id, name, code_1c AS \"code1c\", active, "
                   "(SELECT COUNT(*) FROM {S}.orders o WHERE o.address_id = a.id) AS \"ordersCount\" "
                   "FROM {S}.delivery_addresses a WHERE client_id = %s ORDER BY active DESC, name", (int(body.get('clientId', 0)),))
            return resp(200, {'addresses': cur.fetchall()})

        if action == 'address_save':
            name = (body.get('name') or '').strip()
            if not name:
                return resp(400, {'error': 'Укажите наименование адреса'})
            code = (body.get('code1c') or '').strip()
            active = bool(body.get('active', True))
            if body.get('id'):
                q(cur, "UPDATE {S}.delivery_addresses SET name=%s, code_1c=%s, active=%s WHERE id=%s RETURNING id",
                  (name, code, active, int(body['id'])))
            else:
                q(cur, "INSERT INTO {S}.delivery_addresses (client_id, name, code_1c, active) VALUES (%s,%s,%s,%s) RETURNING id",
                  (int(body['clientId']), name, code, active))
            r = cur.fetchone()
            if not r:
                return resp(404, {'error': 'Адрес не найден'})
            return resp(200, {'ok': True, 'id': r['id']})

        if action == 'create_client':
            login = (body.get('login') or '').strip()
            pw = body.get('password') or ''
            if not body.get('company') or not login or len(pw) < 4:
                return resp(400, {'error': 'Заполните организацию, логин и пароль (от 4 символов)'})
            q(cur, "SELECT 1 FROM {S}.users WHERE lower(login) = lower(%s)", (login,))
            if cur.fetchone():
                return resp(409, {'error': 'Такой логин уже занят'})
            q(cur, "INSERT INTO {S}.users (role, login, password_hash, company, inn, contact, phone) "
                   "VALUES ('client', %s, %s, %s, %s, %s, %s) RETURNING *",
              (login, hash_pw(pw), body['company'].strip(), body.get('inn', ''), body.get('contact', ''), body.get('phone', '')))
            return resp(200, {'client': public_user(cur.fetchone())})

        if action == 'toggle_block':
            q(cur, "UPDATE {S}.users SET blocked = NOT blocked WHERE id = %s AND role = 'client' RETURNING blocked",
              (int(body['id']),))
            r = cur.fetchone()
            if not r:
                return resp(404, {'error': 'Клиент не найден'})
            if r['blocked']:
                q(cur, "UPDATE {S}.sessions SET expires_at = NOW() WHERE user_id = %s", (int(body['id']),))
            return resp(200, {'blocked': r['blocked']})

        return resp(404, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()