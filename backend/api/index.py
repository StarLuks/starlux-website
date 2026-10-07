"""API портала СтарЛюкс: вход, каталог, заказы, клиенты и обмен с 1С."""
import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from decimal import Decimal

import psycopg2
import psycopg2.extras

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
            'createdAt': u['created_at']}


def last_sync(cur):
    q(cur, "SELECT value FROM {S}.settings WHERE key = 'last_sync'")
    r = cur.fetchone()
    return r['value'] if r else None


def touch_sync(cur):
    q(cur, "UPDATE {S}.settings SET value = to_char(NOW(), 'YYYY-MM-DD\"T\"HH24:MI:SS') WHERE key = 'last_sync'")


def products(cur):
    q(cur, "SELECT id, name, category, pack, pack_kg AS \"packKg\", price, stock, unit FROM {S}.products "
           "WHERE active ORDER BY sort, name")
    return cur.fetchall()


def load_orders(cur, client_id=None, only_new=False):
    where, args = [], []
    if client_id:
        where.append('o.client_id = %s')
        args.append(client_id)
    if only_new:
        where.append('NOT o.exported_1c')
    w = ('WHERE ' + ' AND '.join(where)) if where else ''
    q(cur, "SELECT o.id, o.number, o.client_id AS \"clientId\", u.company AS \"clientName\", u.inn AS \"clientInn\", "
           "u.ext_id AS \"clientExtId\", o.status, o.total, o.comment, o.exported_1c AS \"exported\", "
           "o.created_at AS date FROM {S}.orders o JOIN {S}.users u ON u.id = o.client_id "
           + w + " ORDER BY o.created_at DESC LIMIT 500", tuple(args))
    orders = cur.fetchall()
    if not orders:
        return []
    ids = tuple(o['id'] for o in orders)
    q(cur, "SELECT order_id, product_id AS \"productId\", name, qty, box_price AS \"boxPrice\", sum "
           "FROM {S}.order_items WHERE order_id IN %s ORDER BY id", (ids,))
    items = {}
    for it in cur.fetchall():
        items.setdefault(it.pop('order_id'), []).append(it)
    for o in orders:
        o['items'] = items.get(o['id'], [])
    return orders


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
            elif c.get('login') and c.get('password'):
                q(cur, "INSERT INTO {S}.users (role, login, password_hash, company, inn, contact, phone, ext_id, blocked) "
                       "VALUES ('client',%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (login) DO NOTHING",
                  (c['login'], hash_pw(c['password']), c['company'], c.get('inn', ''), c.get('contact', ''),
                   c.get('phone', ''), ext, c.get('blocked', False)))
                created.append(c['login'])
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
                   "status = COALESCE(%s, CASE WHEN status = 'Новый' THEN 'Передан в 1С' ELSE status END) WHERE number = %s",
              (st, o['number']))
        touch_sync(cur)
        return resp(200, {'ok': True})

    return resp(404, {'error': 'Неизвестное действие'})


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
              (token, u['id'], datetime.utcnow() + timedelta(days=30)))
            return resp(200, {'token': token, 'user': public_user(u)})

        user = current_user(cur, headers)
        if not user:
            return resp(401, {'error': 'Требуется вход'})
        staff = user['role'] in STAFF

        if action == 'catalog':
            return resp(200, {'products': products(cur), 'lastSync': last_sync(cur)})

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
            q(cur, "SELECT id, name, pack_kg, price, stock, unit FROM {S}.products WHERE active AND id IN %s", (tuple(wanted),))
            rows = cur.fetchall()
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
            q(cur, "INSERT INTO {S}.orders (number, client_id, total, comment) VALUES (%s, %s, %s, %s) RETURNING id",
              ('tmp-' + secrets.token_hex(6), user['id'], total, comment))
            oid = cur.fetchone()['id']
            number = 'СЛ-' + str(2000 + oid)
            q(cur, "UPDATE {S}.orders SET number = %s WHERE id = %s", (number, oid))
            for l in lines:
                q(cur, "UPDATE {S}.products SET stock = stock - %s WHERE id = %s", (l[2], l[0]))
                q(cur, "INSERT INTO {S}.order_items (order_id, product_id, name, qty, box_price, sum) VALUES (%s,%s,%s,%s,%s,%s)",
                  (oid, *l))
            return resp(200, {'id': oid, 'number': number, 'total': total})

        if not staff:
            return resp(403, {'error': 'Недостаточно прав'})

        if action == 'set_status':
            if body.get('status') not in STATUSES:
                return resp(400, {'error': 'Неизвестный статус'})
            q(cur, "UPDATE {S}.orders SET status = %s WHERE id = %s", (body['status'], int(body['orderId'])))
            return resp(200, {'ok': True})

        if action == 'clients':
            q(cur, "SELECT u.*, (SELECT COUNT(*) FROM {S}.orders o WHERE o.client_id = u.id) AS orders_count "
                   "FROM {S}.users u WHERE u.role = 'client' ORDER BY u.created_at DESC")
            return resp(200, {'clients': [{**public_user(c), 'ordersCount': c['orders_count']} for c in cur.fetchall()]})

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