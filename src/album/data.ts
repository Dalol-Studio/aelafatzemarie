import { getPhotosCached, getPhotosMetaCached } from '@/photo/cache';
import { Album } from '.';

export const getPhotosAlbumDataCached = ({
  album,
  limit,
  hidden,
}: {
  album: Album,
  limit?: number,
  hidden?: 'exclude' | 'include' | 'only',
}) =>
  Promise.all([
    getPhotosCached({ album, limit, hidden }),
    getPhotosMetaCached({ album, hidden }),
  ]);

