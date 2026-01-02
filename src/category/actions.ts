'use server';

import { getCountsForCategoriesCached } from './cache';

import { auth } from '@/auth/server';

export const getCountsForCategoriesCachedAction = async () => {
  const session = await auth();
  const role = (session?.user as any)?.role;
  return getCountsForCategoriesCached(
    role === 'admin' || role === 'private-viewer',
  );
};
