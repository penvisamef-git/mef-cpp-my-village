const crypto = require("crypto");

const ENCRYPTION_KEY = "my_secret_key_32chars1234567890"; // Must be 32 chars for AES-256
const IV_LENGTH = 16; // AES block size

// Encrypt function
function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return iv.toString("base64") + ":" + encrypted;
}

// Decrypt function
function decrypt(text) {
  let parts = text.split(":");
  let iv = Buffer.from(parts[0], "base64");
  let encryptedText = parts[1];
  let decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let decrypted = decipher.update(encryptedText, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
