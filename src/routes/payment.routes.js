import express from 'express';
import { createFinikPayment } from '../services/finik.service.js';
import { paymentsRepository } from '../db/payments.repository.js';

const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const result = await createFinikPayment({
      amount,
      redirectUrl: process.env.REDIRECT_URL || 'https://your-site.com/payment/success',
      webhookUrl: process.env.WEBHOOK_URL || 'https://your-site.com/api/webhooks/finik'
    });

    // Сохраняем платеж в БД
    await paymentsRepository.createPayment(result.paymentId, amount, 'PENDING');

    res.json(result);
  } catch (e) {
    console.error('Payment creation error:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;

