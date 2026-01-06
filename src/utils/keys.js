import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Читает приватный ключ из файла
 * @returns {string} Приватный ключ
 */
export function getPrivateKey() {
  const keyPath = process.env.FINIK_PRIVATE_KEY_PATH || 
    path.join(process.cwd(), 'finik_private.pem');
  
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Private key file not found: ${keyPath}`);
  }
  
  let keyContent = fs.readFileSync(keyPath, 'utf8').trim();
  
  // Убеждаемся, что ключ имеет правильные переносы строк
  if (!keyContent.includes('\n')) {
    // Если ключ в одной строке, добавляем переносы
    keyContent = keyContent.replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----\n')
      .replace(/-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----')
      .replace(/(.{64})/g, '$1\n')
      .replace(/\n\n/g, '\n');
  }
  
  // Проверяем формат ключа
  if (keyContent.includes('BEGIN PRIVATE KEY')) {
    // PKCS#8 format - библиотека должна поддерживать
    return keyContent;
  } else if (keyContent.includes('BEGIN RSA PRIVATE KEY')) {
    // PKCS#1 format
    return keyContent;
  } else {
    throw new Error('Invalid private key format. Expected BEGIN PRIVATE KEY or BEGIN RSA PRIVATE KEY');
  }
}

/**
 * Читает публичный ключ из файла
 * @returns {string} Публичный ключ
 */
export function getPublicKey() {
  const keyPath = process.env.FINIK_PUBLIC_KEY_PATH || 
    path.join(process.cwd(), 'finik_public.pem');
  
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Public key file not found: ${keyPath}`);
  }
  
  return fs.readFileSync(keyPath, 'utf8');
}

