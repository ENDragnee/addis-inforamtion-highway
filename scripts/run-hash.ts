
// run-hash.ts
import bcrypt from 'bcrypt';
export async function hashPassword(password:string) {
  const saltRounds = 10; // Adjust this value for desired hashing strength
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
}

async function main() {
  const password = 'qazwsxedc'; // Replace with any password
  const hashed = await hashPassword(password);
  console.log('Hashed password:', hashed);
}

main();
