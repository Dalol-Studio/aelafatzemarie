import { INFINITE_SCROLL_GRID_INITIAL } from '@/photo';
import { getUniqueTags } from '@/photo/query';
import { PATH_ROOT } from '@/app/path';
import { generateMetaForTag } from '@/tag';
import TagOverview from '@/tag/TagOverview';
import { getPhotosTagDataCached } from '@/tag/data';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { staticallyGenerateCategoryIfConfigured } from '@/app/static';
import { getAppText } from '@/i18n/state/server';

import { auth } from '@/auth/server';

const getPhotosTagDataPreload = (tag: string, role?: string) =>
  getPhotosTagDataCached({
    tag,
    limit: INFINITE_SCROLL_GRID_INITIAL,
    hidden: (role === 'admin' || role === 'private-viewer')
      ? 'include'
      : 'exclude',
  });

export const generateStaticParams = staticallyGenerateCategoryIfConfigured(
  'tags',
  'page',
  getUniqueTags,
  tags => tags.map(({ tag }) => ({ tag })),
);

interface TagProps {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({
  params,
}: TagProps): Promise<Metadata> {
  const { tag: tagFromParams } = await params;

  const tag = decodeURIComponent(tagFromParams);

  const session = await auth();
  const [
    photos,
    { count, dateRange },
  ] = await getPhotosTagDataPreload(tag, (session?.user as any)?.role);

  if (photos.length === 0) { return {}; }

  const appText = await getAppText();

  const {
    url,
    title,
    description,
    images,
  } = generateMetaForTag(tag, photos, appText, count, dateRange);

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

export default async function TagPage({
  params,
}:TagProps) {
  const { tag: tagFromParams } = await params;

  const tag = decodeURIComponent(tagFromParams);

  const session = await auth();
  const [
    photos,
    { count, dateRange },
  ] = await getPhotosTagDataPreload(tag, (session?.user as any)?.role);

  if (photos.length === 0) { redirect(PATH_ROOT); }

  return (
    <TagOverview {...{ tag, photos, count, dateRange }} />
  );
}
