export const COMPANY = {
  name: "ООО «СтарЛюкс»",
  phone: "+7 (495) 000-00-00",
  phoneHref: "tel:+74950000000",
  email: "zakaz@starlux.ru",
  address: "Москва, Рябиновая улица, 26",
  hours: "Пн–Сб: 7:00–20:00, Вс — выходной",
};

export const mapSrc = (address: string) =>
  `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(address)}&z=15`;
