import { auth } from '@clerk/nextjs/server';

type Roles = 'publisher' | 'admin' | 'user';
export const checkRole = async (role: Roles) => {
  const { sessionClaims } = await auth();
  return (sessionClaims?.metadata as { role: string })?.role === role;
};
