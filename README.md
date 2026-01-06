# Finik Backend Integration

Backend для интеграции с системой оплаты Finik.

## Технологии

- Node.js 18+
- Express.js
- @mancho.devs/authorizer — для подписи и валидации
- node-fetch — для HTTP запросов
- dotenv — для переменных окружения
- uuid — для генерации идентификаторов
- PostgreSQL (опционально)

## Установка

```bash
npm install
```

## Настройка

1. Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. Заполните переменные окружения в `.env`:
   - `FINIK_API_KEY` — API ключ от Finik
   - `FINIK_ACCOUNT_ID` — ID аккаунта
   - `FINIK_PRIVATE_KEY` — приватный ключ RSA (хранить только в backend!)
   - `FINIK_PUBLIC_KEY` — публичный ключ
   - `REDIRECT_URL` — URL для редиректа после оплаты
   - `WEBHOOK_URL` — URL для получения webhook от Finik

## Запуск

```bash
npm start
```

Для разработки с автоперезагрузкой:
```bash
npm run dev
```

## API Endpoints

### Создание платежа

**POST** `/api/payments/create`

Request body:
```json
{
  "amount": 1000
}
```

Response:
```json
{
  "paymentUrl": "https://...",
  "paymentId": "uuid"
}
```

### Webhook от Finik

**POST** `/api/webhooks/finik`

Этот endpoint принимает webhook от Finik и обрабатывает статусы платежей.

## Важные моменты

1. **Подтверждение платежа**: Платеж считается успешным ТОЛЬКО после получения webhook со статусом `SUCCEEDED`. Редирект на `RedirectUrl` не является подтверждением.

2. **Идемпотентность**: Webhook обрабатывается идемпотентно — повторные запросы с тем же `transactionId` не изменяют статус платежа.

3. **Безопасность**: 
   - Приватный ключ хранится только в backend
   - Все webhook проверяются на подлинность через подпись
   - Webhook должен отвечать менее чем за 1 секунду

4. **База данных**: 
   - Если `DATABASE_URL` не задан, используется in-memory хранилище (для тестирования)
   - Для продакшена рекомендуется использовать PostgreSQL

## Структура проекта

```
finik-backend/
├── src/
│   ├── app.js                 # Express приложение
│   ├── server.js              # Точка входа
│   ├── config/
│   │   └── finik.js           # Конфигурация Finik
│   ├── routes/
│   │   ├── payment.routes.js  # Роуты для платежей
│   │   └── webhook.routes.js  # Роуты для webhook
│   ├── services/
│   │   └── finik.service.js   # Сервис для работы с Finik API
│   ├── utils/
│   │   └── verifyWebhook.js   # Проверка подписи webhook
│   └── db/
│       └── payments.repository.js # Репозиторий для работы с БД
├── .env                       # Переменные окружения
├── package.json
└── README.md
```

## Деплой

Проект готов к деплою на сервер `2.56.179.126`.

Убедитесь, что:
- Все переменные окружения настроены
- `WEBHOOK_URL` указывает на публичный URL вашего сервера
- `REDIRECT_URL` настроен для редиректа после оплаты
- Webhook endpoint доступен извне и отвечает быстро (< 1 сек)

