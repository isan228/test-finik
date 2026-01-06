import pg from 'pg';
const { Pool } = pg;

// Опциональная настройка PostgreSQL
// Если переменные окружения не заданы, репозиторий будет работать в режиме in-memory
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
    })
  : null;

// In-memory хранилище для тестирования без БД
const inMemoryStore = new Map();

export class PaymentsRepository {
  async createPayment(paymentId, amount, status = 'PENDING') {
    if (pool) {
      const result = await pool.query(
        `INSERT INTO payments (payment_id, amount, status, created_at) 
         VALUES ($1, $2, $3, NOW()) 
         RETURNING *`,
        [paymentId, amount, status]
      );
      return result.rows[0];
    } else {
      const payment = {
        payment_id: paymentId,
        amount,
        status,
        created_at: new Date()
      };
      inMemoryStore.set(paymentId, payment);
      return payment;
    }
  }

  async getPaymentByPaymentId(paymentId) {
    if (pool) {
      const result = await pool.query(
        'SELECT * FROM payments WHERE payment_id = $1',
        [paymentId]
      );
      return result.rows[0] || null;
    } else {
      return inMemoryStore.get(paymentId) || null;
    }
  }

  async getPaymentByTransactionId(transactionId) {
    if (pool) {
      const result = await pool.query(
        'SELECT * FROM payments WHERE transaction_id = $1',
        [transactionId]
      );
      return result.rows[0] || null;
    } else {
      // Поиск по transaction_id в in-memory хранилище
      for (const payment of inMemoryStore.values()) {
        if (payment.transaction_id === transactionId) {
          return payment;
        }
      }
      return null;
    }
  }

  async updatePaymentStatus(paymentId, transactionId, status) {
    if (pool) {
      const result = await pool.query(
        `UPDATE payments 
         SET status = $1, transaction_id = $2, updated_at = NOW() 
         WHERE payment_id = $3 
         RETURNING *`,
        [status, transactionId, paymentId]
      );
      return result.rows[0];
    } else {
      const payment = inMemoryStore.get(paymentId);
      if (payment) {
        payment.status = status;
        payment.transaction_id = transactionId;
        payment.updated_at = new Date();
        inMemoryStore.set(paymentId, payment);
      }
      return payment;
    }
  }

  async close() {
    if (pool) {
      await pool.end();
    }
  }
}

export const paymentsRepository = new PaymentsRepository();

