import express from 'express';
import { verifyFinikWebhook } from '../utils/verifyWebhook.js';
import { paymentsRepository } from '../db/payments.repository.js';

const router = express.Router();

router.post('/finik', async (req, res) => {
  try {
    // Проверяем подпись webhook
    verifyFinikWebhook(req);

    const { transactionId, status, PaymentId } = req.body;

    if (!transactionId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Идемпотентность: проверяем, обрабатывали ли мы уже этот transactionId
    const existingPayment = await paymentsRepository.getPaymentByTransactionId(transactionId);
    
    if (existingPayment && existingPayment.status === status) {
      // Уже обработали этот webhook
      return res.sendStatus(200);
    }

    // Ищем платеж по PaymentId
    const payment = PaymentId 
      ? await paymentsRepository.getPaymentByPaymentId(PaymentId)
      : null;

    if (!payment) {
      console.warn(`Payment not found for PaymentId: ${PaymentId}, transactionId: ${transactionId}`);
      // Возвращаем 200, чтобы Finik не повторял запрос
      return res.sendStatus(200);
    }

    // Обновляем статус платежа
    if (status === 'SUCCEEDED') {
      await paymentsRepository.updatePaymentStatus(
        payment.payment_id,
        transactionId,
        'SUCCEEDED'
      );
      // TODO: Здесь можно добавить логику уведомления пользователя, отправки email и т.д.
    } else if (status === 'FAILED') {
      await paymentsRepository.updatePaymentStatus(
        payment.payment_id,
        transactionId,
        'FAILED'
      );
      // TODO: Здесь можно добавить логику обработки ошибки
    }

    res.sendStatus(200);
  } catch (e) {
    console.error('Webhook verification error:', e);
    res.status(401).json({ error: 'Invalid signature' });
  }
});

export default router;


