# Инструкция по деплою на сервер

## Сервер: 2.56.179.126

## Предварительные требования

1. SSH доступ к серверу
2. Node.js 18+ установлен на сервере
3. PostgreSQL (опционально, если используете БД)
4. Nginx (рекомендуется для reverse proxy)

## Шаг 1: Подключение к серверу

```bash
ssh root@2.56.179.126
# или
ssh your_user@2.56.179.126
```

## Шаг 2: Установка Node.js (если не установлен)

```bash
# Для Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версии
node --version
npm --version
```

## Шаг 3: Клонирование репозитория

```bash
# Создайте директорию для проекта
mkdir -p /var/www/finik-backend
cd /var/www/finik-backend

# Клонируйте репозиторий
git clone https://github.com/isan228/test-finik.git .

# Или если репозиторий приватный, используйте SSH
# git clone git@github.com:isan228/test-finik.git .
```

## Шаг 4: Установка зависимостей

```bash
cd /var/www/finik-backend
npm install --production
```

## Шаг 5: Настройка переменных окружения

```bash
# Создайте .env файл
nano .env
```

Заполните все необходимые переменные:

```env
PORT=3000

FINIK_ENV=beta
FINIK_API_KEY=your_api_key_here
FINIK_ACCOUNT_ID=your_account_id_here

FINIK_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----"

FINIK_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----"

# URLs (важно: используйте реальный IP или домен сервера)
REDIRECT_URL=http://2.56.179.126:3000/payment/success
WEBHOOK_URL=http://2.56.179.126:3000/api/webhooks/finik

# Опционально: PostgreSQL
# DATABASE_URL=postgresql://user:password@localhost:5432/finik_db
# DATABASE_SSL=false
```

**Важно**: 
- `WEBHOOK_URL` должен быть доступен извне (публичный URL)
- Если используете домен, замените IP на домен
- Приватный ключ должен быть в полном формате с переносами строк

## Шаг 6: Настройка базы данных (опционально)

Если используете PostgreSQL:

```bash
# Установка PostgreSQL (если не установлен)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Создание базы данных
sudo -u postgres psql
CREATE DATABASE finik_db;
CREATE USER finik_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE finik_db TO finik_user;
\q

# Применение схемы
psql -U finik_user -d finik_db -f /var/www/finik-backend/src/db/schema.sql
```

## Шаг 7: Установка PM2 (процесс-менеджер)

```bash
# Установка PM2 глобально
sudo npm install -g pm2

# Запуск приложения через PM2
cd /var/www/finik-backend
pm2 start src/server.js --name finik-backend

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска при перезагрузке сервера
pm2 startup
# Выполните команду, которую выведет PM2
```

## Шаг 8: Настройка Nginx (рекомендуется)

```bash
# Установка Nginx (если не установлен)
sudo apt-get install nginx

# Создание конфигурации
sudo nano /etc/nginx/sites-available/finik-backend
```

Содержимое конфигурации:

```nginx
server {
    listen 80;
    server_name 2.56.179.126;  # или ваш домен

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Важно для webhook - увеличиваем таймауты
        proxy_read_timeout 5s;
        proxy_connect_timeout 5s;
        proxy_send_timeout 5s;
    }
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/finik-backend /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl reload nginx
```

## Шаг 9: Настройка Firewall

```bash
# Разрешить HTTP и HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Если не используете Nginx, разрешите порт 3000
# sudo ufw allow 3000/tcp

# Проверка статуса
sudo ufw status
```

## Шаг 10: Обновление WEBHOOK_URL в .env

После настройки Nginx обновите `.env`:

```env
WEBHOOK_URL=http://2.56.179.126/api/webhooks/finik
REDIRECT_URL=http://2.56.179.126/payment/success
```

Перезапустите приложение:

```bash
pm2 restart finik-backend
```

## Полезные команды PM2

```bash
# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs finik-backend

# Перезапуск
pm2 restart finik-backend

# Остановка
pm2 stop finik-backend

# Удаление из PM2
pm2 delete finik-backend
```

## Проверка работы

1. **Health check**:
```bash
curl http://localhost:3000/health
# или
curl http://2.56.179.126/health
```

2. **Создание тестового платежа**:
```bash
curl -X POST http://2.56.179.126/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'
```

## Обновление кода

```bash
cd /var/www/finik-backend
git pull origin main
npm install --production
pm2 restart finik-backend
```

## Мониторинг

```bash
# Просмотр логов в реальном времени
pm2 logs finik-backend --lines 100

# Мониторинг ресурсов
pm2 monit
```

## Troubleshooting

### Проблема: Webhook не приходит

1. Проверьте, что `WEBHOOK_URL` доступен извне:
```bash
curl http://2.56.179.126/api/webhooks/finik
```

2. Проверьте firewall:
```bash
sudo ufw status
```

3. Проверьте логи:
```bash
pm2 logs finik-backend
```

### Проблема: Приложение не запускается

1. Проверьте переменные окружения:
```bash
cat .env
```

2. Проверьте логи ошибок:
```bash
pm2 logs finik-backend --err
```

3. Проверьте, что порт не занят:
```bash
sudo netstat -tulpn | grep 3000
```

## Безопасность

1. **Не храните .env в git** (уже в .gitignore)
2. **Используйте HTTPS** (настройте SSL сертификат через Let's Encrypt)
3. **Ограничьте доступ к серверу** через firewall
4. **Регулярно обновляйте зависимости**:
```bash
npm audit
npm audit fix
```

