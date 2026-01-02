import { INFINITE_SCROLL_GRID_INITIAL } from '@/photo';
import { PATH_ROOT } from '@/app/path';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { staticallyGenerateCategoryIfConfigured } from '@/app/static';
import { getAppText } from '@/i18n/state/server';
import AlbumOverview from '@/album/AlbumOverview';
import { Album, generateMetaForAlbum } from '@/album';
import { getPhotosAlbumDataCached } from '@/album/data';
import {
  getAlbumFromSlugCached,
  getAlbumsWithMetaCached,
  getTagsForAlbumCached,
} from '@/album/cache';
import { getPhotosCached } from '@/photo/cache';

import { auth } from '@/auth/server';

const getPhotosAlbumDataPreload = (album: Album, role?: string) =>
  getPhotosAlbumDataCached({
    album,
    limit: INFINITE_SCROLL_GRID_INITIAL,
    hidden: (role === 'admin' || role === 'private-viewer')
      ? 'include'
      : 'exclude',
  });

export const generateStaticParams = staticallyGenerateCategoryIfConfigured(
  'albums',
  'page',
  getAlbumsWithMetaCached,
  albums => albums.map(({ album }) => ({ album: album.slug })),
);

interface AlbumProps {
  params: Promise<{ album: string }>
}

export async function generateMetadata({
  params,
}: AlbumProps): Promise<Metadata> {
  const { album: albumFromParams } = await params;

  const albumSlug = decodeURIComponent(albumFromParams);

  const album = await getAlbumFromSlugCached(albumSlug);

  if (!album) { return {}; }

  const session = await auth();
  const role = (session?.user as any)?.role;
  const [
    photos,
    { count, dateRange },
  ] = await getPhotosAlbumDataPreload(album, role);

  if (photos.length === 0) { return {}; }

  const appText = await getAppText();

  const {
    url,
    title,
    description,
    images,
  } = generateMetaForAlbum(album, photos, appText, count, dateRange);

  return {
    title,
    openGraph: {
      title,
      description,
      images,
      url,
    },
    twitter: {
      images,
      description,
      card: 'summary_large_image',
    },
    description,
  };
}

export default async function AlbumPage({
  params,
}:AlbumProps) {
  const { album: albumFromParams } = await params;

  const albumSlug = decodeURIComponent(albumFromParams);

  const album = await getAlbumFromSlugCached(albumSlug);

  if (!album) { redirect(PATH_ROOT); }

  const session = await auth();
  const role = (session?.user as any)?.role;
  const isSensitive = role === 'admin' || role === 'private-viewer';

  const photos = await getPhotosCached({
    album,
    hidden: isSensitive ? 'include' : 'exclude',
  });

  const tags = await getTagsForAlbumCached(album.id);

  return (
    <AlbumOverview {...{
      album,
      photos,
      tags,
      count: photos.length,
    }} />
  );
}
