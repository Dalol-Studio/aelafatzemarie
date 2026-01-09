import {
  RELATED_GRID_PHOTOS_TO_SHOW,
  descriptionForPhoto,
  titleForPhoto,
} from '@/photo';
import PhotoDetailPage from '@/photo/PhotoDetailPage';
import {
  getPhotosMetaCached,
  getPhotosNearIdCached,
} from '@/photo/cache';
import { PATH_ROOT, absolutePathForPhoto } from '@/app/path';
import { TAG_PRIVATE } from '@/tag';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { auth } from '@/auth/server';

const getPhotosNearIdCachedCached = cache((photoId: string) =>
  getPhotosNearIdCached(
    photoId,
    { hidden: 'only' , limit: RELATED_GRID_PHOTOS_TO_SHOW + 2 },
  ));

interface PhotoTagProps {
  params: Promise<{ photoId: string }>
}

export async function generateMetadata({
  params,
}: PhotoTagProps): Promise<Metadata> {
  const { photoId } = await params;

  // Check authentication for metadata generation
  const session = await auth();
  const role = (session?.user as any)?.role;
  const canAccessPrivate = role === 'admin' || role === 'private-viewer';
  
  if (!canAccessPrivate) { return {}; }

  const { photo } = await getPhotosNearIdCachedCached(photoId);

  if (!photo) { return {}; }

  const title = titleForPhoto(photo);
  const description = descriptionForPhoto(photo);
  const descriptionHtml = descriptionForPhoto(photo, true);
  const url = absolutePathForPhoto({ photo, tag: TAG_PRIVATE });

  return {
    title,
    description: descriptionHtml,
    openGraph: {
      title,
      description,
      url,
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
    },
  };
}

export default async function PhotoTagPrivatePage({
  params,
}: PhotoTagProps) {
  const { photoId } = await params;

  // Check authentication - only admin and private-viewer can access
  const session = await auth();
  const role = (session?.user as any)?.role;
  const canAccessPrivate = role === 'admin' || role === 'private-viewer';
  
  if (!canAccessPrivate) { redirect(PATH_ROOT); }

  const { photo, photos, photosGrid, indexNumber } =
    await getPhotosNearIdCachedCached(photoId);

  if (!photo) { redirect(PATH_ROOT); }

  const { count, dateRange } = await getPhotosMetaCached({ hidden: 'only' });

  return (
    <PhotoDetailPage {...{
      photo,
      photos,
      photosGrid,
      indexNumber,
      count,
      dateRange,
      tag: TAG_PRIVATE,
      shouldShare: false,
      includeFavoriteInAdminMenu: false,
    }} />
  );
}

