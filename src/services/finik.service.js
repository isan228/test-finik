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

  // Логирование для отладки
  console.log('=== Finik Payment Request ===');
  console.log('URL:', `${FINIK_BASE_URL}/v1/payment`);
  console.log('Host:', FINIK_HOST);
  console.log('Timestamp:', timestamp);
  console.log('API Key:', process.env.FINIK_API_KEY ? `${process.env.FINIK_API_KEY.substring(0, 10)}...` : 'NOT SET');
  console.log('Account ID:', process.env.FINIK_ACCOUNT_ID || 'NOT SET');
  console.log('Signature length:', signature?.length);
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('Headers:', {
    'Content-Type': 'application/json',
    'Host': FINIK_HOST,
    'x-api-key': process.env.FINIK_API_KEY ? `${process.env.FINIK_API_KEY.substring(0, 10)}...` : 'NOT SET',
    'x-api-timestamp': timestamp,
    'signature': signature ? `${signature.substring(0, 50)}...` : 'NOT SET'
  });

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
    return {
      paymentUrl: res.headers.get('location'),
      paymentId: body.PaymentId
    };
  }

  const text = await res.text();
  console.log('=== Finik Response ===');
  console.log('Status:', res.status);
  console.log('Response:', text);
  console.log('Response headers:', Object.fromEntries(res.headers.entries()));
  throw new Error(`Finik error ${res.status}: ${text}`);
}

