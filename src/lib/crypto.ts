import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'kre8ors_os_secure_aes256_key_32_bytes_long';
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  if (!text) return '';
  
  // Enforce key is exactly 32 bytes
  const key = Buffer.concat([Buffer.from(ENCRYPTION_KEY)], 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  if (!text) return '';
  
  // Backward compatibility check: if it doesn't contain the IV delimiter, it's not encrypted
  if (!text.includes(':')) {
    return text;
  }
  
  try {
    const key = Buffer.concat([Buffer.from(ENCRYPTION_KEY)], 32);
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift() || '', 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (err) {
    // If decryption fails, log it and fallback to returning the raw text
    console.error('Decryption failed, fallback to raw text:', err);
    return text;
  }
}
