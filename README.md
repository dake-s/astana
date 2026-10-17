# Astana Kebab

Сайт кебабной Astana Kebab (ул. Marszałkowska 6, Варшава): меню, корзина и онлайн-заказ с доставкой или самовывозом. Интерфейс на польском.

## Запуск

```bash
npm install
npm start
```

Сайт откроется на http://localhost:3000. Для разработки с автоперезапуском: `npm run dev`. Тесты: `npm test`.

## Структура

- `server.js` — сервер на Express: отдаёт сайт, `GET /api/menu`, `POST /api/orders`
- `orders.js` — проверка заказа и сохранение в `data/orders.json`
- `data/menu.json` — меню и цены, правится вручную
- `public/` — страница, стили и скрипт
- `historia/` — страница с историей, открывается по адресу `/historia/`

Сумму заказа считает сервер по ценам из `data/menu.json`, цене из браузера он не доверяет.
