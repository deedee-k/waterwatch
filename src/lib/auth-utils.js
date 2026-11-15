import { db } from './db';

// Simple offline sign‑in. Passwords are stored in plain text for demo purposes.
export async function offlineSignIn(email, password) {
  const user = await db.authUsers.where('email').equals(email).first();
  if (!user) throw new Error('User not found');
  if (user.password !== password) throw new Error('Invalid password');
  // Store a minimal session object locally so the rest of the app sees a logged‑in user.
  const session = { user: { id: email, email, role: user.role } };
  await db.auth.put({ id: 'session', ...session });
  return session;
}

// Very light JWT expiry check – assumes the token is a standard JWT.
export function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp > now;
  } catch {
    return false;
  }
}

