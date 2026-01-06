-- SQL схема для таблицы payments
-- Выполните этот скрипт в вашей PostgreSQL базе данных

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(255) UNIQUE NOT NULL,
    transaction_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_status ON payments(status);

