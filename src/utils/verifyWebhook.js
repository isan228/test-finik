import { Verifier } from '@mancho.devs/authorizer';

export function verifyFinikWebhook(req) {
  const signature = req.headers.signature;

  const requestData = {
    httpMethod: req.method,
    path: req.originalUrl,
    headers: req.headers,
    queryStringParameters: req.query,
    body: req.body
  };

  return new Verifier(requestData)
    .verify(process.env.FINIK_PUBLIC_KEY, signature);
}

