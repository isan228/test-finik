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
  
  return fs.readFileSync(keyPath, 'utf8');
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

