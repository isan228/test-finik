import fetch from 'node-fetch';
import pkg from '@mancho.devs/authorizer';
const { Signer } = pkg;
import { randomUUID } from 'crypto';
import { FINIK_BASE_URL, FINIK_HOST } from '../config/finik.js';
import { getPrivateKey } from '../utils/keys.js';

export async function createFinikPayment({ amount, redirectUrl, webhookUrl }) {
  const timestamp = Date.now().toString();

  const body = {
    Amount: amount,
    CardType: 'FINIK_QR',
    PaymentId: randomUUID(),
    RedirectUrl: redirectUrl,
    Data: {
      accountId: process.env.FINIK_ACCOUNT_ID,
      merchantCategoryCode: '0742',
      name_en: 'finik-qr',
      webhookUrl
    }
  };

  const requestData = {
    httpMethod: 'POST',
    path: '/v1/payment',
    headers: {
      Host: FINIK_HOST,
      'x-api-key': process.env.FINIK_API_KEY,
      'x-api-timestamp': timestamp,
      'Content-Type': 'application/json'
    },
    queryStringParameters: undefined,
    body: body
  };

  const privateKey = getPrivateKey();
  const signature = await new Signer(requestData)
    .sign(privateKey);

  // Логирование запроса к Finik
  console.log('\n' + '='.repeat(60));
  console.log('📤 ЗАПРОС К FINIK API');
  console.log('='.repeat(60));
  console.log('URL:', `${FINIK_BASE_URL}/v1/payment`);
  console.log('Method: POST');
  console.log('Timestamp:', timestamp);
  console.log('\n📋 REQUEST BODY:');
  console.log(JSON.stringify(body, null, 2));
  console.log('\n📝 HEADERS:');
  console.log('  Host:', FINIK_HOST);
  console.log('  Content-Type: application/json');
  console.log('  x-api-key:', process.env.FINIK_API_KEY ? `${process.env.FINIK_API_KEY.substring(0, 15)}...` : 'NOT SET');
  console.log('  x-api-timestamp:', timestamp);
  console.log('  signature:', signature ? `${signature.substring(0, 60)}...` : 'NOT SET');
  console.log('\n🔑 ПАРАМЕТРЫ:');
  console.log('  Account ID:', process.env.FINIK_ACCOUNT_ID || 'NOT SET');
  console.log('  Amount:', amount, 'сом');
  console.log('  PaymentId:', body.PaymentId);
  console.log('  RedirectUrl:', redirectUrl);
  console.log('  WebhookUrl:', webhookUrl);
  console.log('='.repeat(60) + '\n');

  const res = await fetch(`${FINIK_BASE_URL}/v1/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': FINIK_HOST,
      'x-api-key': process.env.FINIK_API_KEY,
      'x-api-timestamp': timestamp,
      'signature': signature
    },
    body: JSON.stringify(body),
    redirect: 'manual'
  });

  if (res.status === 302) {
    const paymentUrl = res.headers.get('location');
    console.log('\n' + '='.repeat(60));
    console.log('✅ ПЛАТЕЖ УСПЕШНО СОЗДАН');
    console.log('='.repeat(60));
    console.log('PaymentId:', body.PaymentId);
    console.log('PaymentUrl:', paymentUrl);
    console.log('='.repeat(60) + '\n');
    return {
      paymentUrl: paymentUrl,
      paymentId: body.PaymentId
    };
  }

  const text = await res.text();
  console.log('\n' + '='.repeat(60));
  console.log('📥 ОТВЕТ ОТ FINIK API');
  console.log('='.repeat(60));
  console.log('Status:', res.status);
  console.log('Response Body:', text);
  console.log('Response Headers:', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
  console.log('='.repeat(60) + '\n');
  throw new Error(`Finik error ${res.status}: ${text}`);
}

