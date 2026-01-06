import pkg from '@mancho.devs/authorizer';
const { Verifier } = pkg;
import { getPublicKey } from './keys.js';

export function verifyFinikWebhook(req) {
  const signature = req.headers.signature;

  const requestData = {
    httpMethod: req.method,
    path: req.originalUrl,
    headers: req.headers,
    queryStringParameters: req.query,
    body: req.body
  };

  const publicKey = getPublicKey();
  return new Verifier(requestData)
    .verify(publicKey, signature);
}

