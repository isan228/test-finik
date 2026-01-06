import fetch from 'node-fetch';
import { Signer } from '@mancho.devs/authorizer';
import { randomUUID } from 'crypto';
import { FINIK_BASE_URL, FINIK_HOST } from '../config/finik.js';

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
      'x-api-timestamp': timestamp
    },
    queryStringParameters: undefined,
    body
  };

  const signature = await new Signer(requestData)
    .sign(process.env.FINIK_PRIVATE_KEY);

  const res = await fetch(`${FINIK_BASE_URL}/v1/payment`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.FINIK_API_KEY,
      'x-api-timestamp': timestamp,
      signature
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
  throw new Error(`Finik error ${res.status}: ${text}`);
}

