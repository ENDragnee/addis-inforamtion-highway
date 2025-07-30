//@/lib/password-utils.ts
import bcrypt from 'bcrypt';

/**
 * Hashes a plain-text password for secure storage.
 * @param {string} password - The plain-text password to hash.
 * @returns {Promise<string>} - A hashed version of the password.
 */
export async function hashPassword(password:string) {
  const saltRounds = 10; // Adjust this value for desired hashing strength
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
}

/**
 * Verifies a plain-text password against a hashed password.
 * @param {string} inputPassword - The plain-text password to verify.
 * @param {string} hashedPassword - The hashed password to compare against.
 * @returns {Promise<boolean>} - True if the passwords match, false otherwise.
 */
export async function verifyPassword(inputPassword:string, hashedPassword:string) {
  return await bcrypt.compare(inputPassword, hashedPassword);
}
