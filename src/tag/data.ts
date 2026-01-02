import {
  getPhotosCached,
  getPhotosMetaCached,
} from '@/photo/cache';

export const getPhotosTagDataCached = ({
  tag,
  limit,
  hidden,
}: {
  tag: string,
  limit?: number,
  hidden?: 'exclude' | 'include' | 'only',
}) =>
  Promise.all([
    getPhotosCached({ tag, limit, hidden }),
    getPhotosMetaCached({ tag, hidden }),
  ]);

