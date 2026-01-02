import { generateOgImageMetaForPhotos } from '@/photo';
import PhotosEmptyState from '@/photo/PhotosEmptyState';
import { Metadata } from 'next/types';
import { getPhotos } from '@/photo/query';
import PhotoFullPage from '@/photo/PhotoFullPage';
import { getPhotosMetaCached } from '@/photo/cache';
import { USER_DEFAULT_SORT_OPTIONS } from '@/app/config';
import { FEED_META_QUERY_OPTIONS, getFeedQueryOptions } from '@/feed';

import { auth } from '@/auth/server';

export const maxDuration = 60;

const getPhotosForPage = (role?: string) =>
  getPhotos(getFeedQueryOptions({
    isGrid: false,
    hidden: (role === 'admin' || role === 'private-viewer')
      ? 'include'
      : 'exclude',
  }));

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const photos = await getPhotosForPage((session?.user as any)?.role)
    .catch(() => []);
  return generateOgImageMetaForPhotos(photos);
}

export default async function FullPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const isSensitive = role === 'admin' || role === 'private-viewer';

  const [
    photos,
    photosCount,
  ] = await Promise.all([
    getPhotosForPage(role)
      .catch(() => []),
    getPhotosMetaCached(isSensitive
      ? { ...FEED_META_QUERY_OPTIONS, hidden: 'include' }
      : FEED_META_QUERY_OPTIONS)
      .then(({ count }) => count)
      .catch(() => 0),
  ]);

  return (
    photos.length > 0
      ? <PhotoFullPage {...{
        photos,
        photosCount,
        ...USER_DEFAULT_SORT_OPTIONS,
      }} />
      : <PhotosEmptyState />
  );
}
