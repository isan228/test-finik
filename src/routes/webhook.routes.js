import express from 'express';
import { verifyFinikWebhook } from '../utils/verifyWebhook.js';
import { paymentsRepository } from '../db/payments.repository.js';

const router = express.Router();

router.post('/finik', async (req, res) => {
  try {
    // Логирование входящего webhook
    console.log('\n' + '='.repeat(60));
    console.log('📨 WEBHOOK ОТ FINIK');
    console.log('='.repeat(60));
    console.log('📋 REQUEST BODY:');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('📝 HEADERS:');
    console.log('  signature:', req.headers.signature ? `${req.headers.signature.substring(0, 60)}...` : 'NOT SET');
    console.log('  content-type:', req.headers['content-type'] || 'NOT SET');
    console.log('='.repeat(60) + '\n');

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
      console.log('⚠️  Webhook уже обработан ранее (идемпотентность)');
      console.log('TransactionId:', transactionId);
      console.log('Status:', status);
      return res.sendStatus(200);
    }

    // Ищем платеж по PaymentId
    const payment = PaymentId 
      ? await paymentsRepository.getPaymentByPaymentId(PaymentId)
      : null;

    if (!payment) {
      console.warn('\n⚠️  ПЛАТЕЖ НЕ НАЙДЕН В БД');
      console.warn('PaymentId:', PaymentId);
      console.warn('TransactionId:', transactionId);
      console.warn('Status:', status);
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
      console.log('\n' + '='.repeat(60));
      console.log('✅ ПЛАТЕЖ УСПЕШНО ОБРАБОТАН');
      console.log('='.repeat(60));
      console.log('PaymentId:', payment.payment_id);
      console.log('TransactionId:', transactionId);
      console.log('Status: SUCCEEDED');
      console.log('Amount:', payment.amount, 'сом');
      console.log('='.repeat(60) + '\n');
      // TODO: Здесь можно добавить логику уведомления пользователя, отправки email и т.д.
    } else if (status === 'FAILED') {
      await paymentsRepository.updatePaymentStatus(
        payment.payment_id,
        transactionId,
        'FAILED'
      );
      console.log('\n' + '='.repeat(60));
      console.log('❌ ПЛАТЕЖ НЕ УДАЛСЯ');
      console.log('='.repeat(60));
      console.log('PaymentId:', payment.payment_id);
      console.log('TransactionId:', transactionId);
      console.log('Status: FAILED');
      console.log('Amount:', payment.amount, 'сом');
      console.log('='.repeat(60) + '\n');
      // TODO: Здесь можно добавить логику обработки ошибки
    }

    res.sendStatus(200);
  } catch (e) {
    console.error('Webhook verification error:', e);
    res.status(401).json({ error: 'Invalid signature' });
  }
});

export default router;


