import { unstable_cache } from 'next/cache';
import { getCountsForCategories, getDataForCategories } from './data';
import { KEY_PHOTOS } from '@/cache';

export const getDataForCategoriesCached = (includeHidden?: boolean) =>
  unstable_cache(
    getDataForCategories,
    [KEY_PHOTOS, includeHidden ? 'hidden' : 'public'],
  )(includeHidden);

export const getCountsForCategoriesCached = (includeHidden?: boolean) =>
  unstable_cache(
    getCountsForCategories,
    [KEY_PHOTOS, includeHidden ? 'hidden' : 'public'],
  )(includeHidden);
