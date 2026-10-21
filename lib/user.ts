// Replace this with your real auth (NextAuth, Clerk, Supabase, etc.).
// IMPORTANT: the phone number must come from YOUR database, never from the browser.
export type AppUser = { id: string; name: string; phone: string };

export async function getCurrentUser(): Promise<AppUser | null> {
  if (!process.env.DEMO_PHONE) return null;
  return {
    id: 'demo-user',
    name: process.env.DEMO_NAME ?? 'there',
    phone: process.env.DEMO_PHONE,
  };
}