import {
  copyFile,
  deleteFile,
  moveFile,
  putFile,
  getStorageUrlsForPrefix,
} from '@/platforms/storage/server';
import { getFileNamePartsFromStorageUrl } from '@/platforms/storage';
import { removeGpsData, resizeImageToBytes } from '../server';
import {
  generateRandomFileNameForPhoto,
  getOptimizedPhotoFileMeta,
} from '.';

export const storeOptimizedPhotos = async (
  url: string,
  fileBytes: ArrayBuffer,
) => {
  const { fileNameBase } = getFileNamePartsFromStorageUrl(url);
  const optimizedPhotoFileMeta = getOptimizedPhotoFileMeta(fileNameBase);
  for (const { fileName, size, quality } of optimizedPhotoFileMeta) {
    await putFile(await resizeImageToBytes(fileBytes, size, quality), fileName);
  }
  return url;
};

export const convertUploadToPhoto = async ({
  uploadUrl,
  fileBytes: _fileBytes,
  shouldStripGpsData,
  shouldDeleteOrigin = true,
} : {
  uploadUrl: string
  fileBytes?: ArrayBuffer
  shouldStripGpsData?: boolean
  shouldDeleteOrigin?: boolean
}) => {
  const fileNameBase = generateRandomFileNameForPhoto();
  const { fileExtension } = getFileNamePartsFromStorageUrl(uploadUrl);
  const fileName = `${fileNameBase}.${fileExtension}`;
  const fileBytes = _fileBytes
    ? _fileBytes
    : await fetch(uploadUrl).then(res => res.arrayBuffer());
  let promise: Promise<string>;
  if (shouldStripGpsData) {
    const fileWithoutGps = await removeGpsData(fileBytes);
    promise = putFile(fileWithoutGps, fileName)
      .then(async url => {
        if (url && shouldDeleteOrigin) { await deleteFile(uploadUrl); }
        return url;
      });
  } else {
    promise = shouldDeleteOrigin
      ? moveFile(uploadUrl, fileName)
      : copyFile(uploadUrl, fileName);
  }
  // Store optimized photos after original photo is copied/moved
  const updatedUrl = await promise
    .then(async url => storeOptimizedPhotos(url, fileBytes));

  return updatedUrl;
};

const PREFIX_PHOTO = 'photo';
const PREFIX_UPLOAD = 'upload';

export const getStorageUploadUrls = () =>
  getStorageUrlsForPrefix(`${PREFIX_UPLOAD}-`);

export const getStoragePhotoUrls = () =>
  getStorageUrlsForPrefix(`${PREFIX_PHOTO}-`);

import { Photo } from '..';

export const getStorageUrlsForPhoto = async ({ url }: Photo) => {
  const getSortScoreForUrl = (url: string) => {
    const { fileNameBase } = getFileNamePartsFromStorageUrl(url);
    if (fileNameBase.endsWith('-sm')) { return 1; }
    if (fileNameBase.endsWith('-md')) { return 2; }
    if (fileNameBase.endsWith('-lg')) { return 3; }
    return 0;
  };

  const { fileNameBase } = getFileNamePartsFromStorageUrl(url);

  return getStorageUrlsForPrefix(fileNameBase).then(urls =>
    urls.sort((a, b) => getSortScoreForUrl(a.url) - getSortScoreForUrl(b.url)),
  );
};
