import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { users } from '@clerk/clerk-sdk-node';

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
if (!clerkSecretKey) {
  console.error('CLERK_SECRET_KEY is not set in environment variables.');
  process.exit(1);
}
process.env.CLERK_API_KEY = clerkSecretKey;

const email = 'client-test@example.com';
const password = 'ClientTest123!@#'; // Known strong password
const firstName = 'Client';
const lastName = 'Test';

async function deleteUserIfExists() {
  const found = await users.getUserList({ emailAddress: [email] });
  if (found.length > 0) {
    for (const user of found) {
      await users.deleteUser(user.id);
      console.log(`Deleted user: ${email}`);
    }
  } else {
    console.log(`No user found with email: ${email}`);
  }
}

async function createUser() {
  await users.createUser({
    emailAddress: [email],
    password,
    firstName,
    lastName,
  });
  console.log(`Created user: ${email}`);
  console.log(`Password: ${password}`);
}

(async () => {
  await deleteUserIfExists();
  await createUser();
})(); 