# Быстрая инструкция по деплою

## Шаг 1: Подключение к серверу

```bash
ssh root@2.56.179.126
```

## Шаг 2: Установка Node.js (если нужно)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Шаг 3: Клонирование и установка

```bash
# Создайте директорию
mkdir -p /var/www/finik-backend
cd /var/www/finik-backend

# Клонируйте репозиторий
git clone https://github.com/isan228/test-finik.git .

# Установите зависимости
npm install --production
```

## Шаг 4: Настройка .env

```bash
nano .env
```

Заполните:
```env
PORT=3000
FINIK_ENV=beta
FINIK_API_KEY=ваш_ключ
FINIK_ACCOUNT_ID=ваш_id
FINIK_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----"
FINIK_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----"
REDIRECT_URL=http://2.56.179.126/payment/success
WEBHOOK_URL=http://2.56.179.126/api/webhooks/finik
```

## Шаг 5: Установка PM2 и запуск

```bash
# Установка PM2
sudo npm install -g pm2

# Запуск приложения
pm2 start src/server.js --name finik-backend

# Сохранение и автозапуск
pm2 save
pm2 startup
# Выполните команду, которую выведет PM2
```

## Шаг 6: Настройка Nginx (опционально, но рекомендуется)

```bash
# Установка
sudo apt-get install nginx

# Создание конфигурации
sudo nano /etc/nginx/sites-available/finik-backend
```

Вставьте:
```nginx
server {
    listen 80;
    server_name 2.56.179.126;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 5s;
    }
}
```

```bash
# Активация
sudo ln -s /etc/nginx/sites-available/finik-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Шаг 7: Настройка Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

## Проверка

```bash
# Health check
curl http://localhost:3000/health

# Или через Nginx
curl http://2.56.179.126/health
```

## Полезные команды

```bash
# Логи
pm2 logs finik-backend

# Перезапуск
pm2 restart finik-backend

# Статус
pm2 status
```

## Обновление кода

```bash
cd /var/www/finik-backend
git pull origin main
npm install --production
pm2 restart finik-backend
```

---

📖 **Подробная инструкция**: см. [DEPLOY.md](./DEPLOY.md)


