import {
  vercelBlobCopy,
  vercelBlobDelete,
  vercelBlobList,
  vercelBlobPut,
} from './vercel-blob';
import {
  awsS3Copy,
  awsS3Delete,
  awsS3List,
  awsS3Put,
} from './aws-s3';
import {
  CURRENT_STORAGE,
  HAS_AWS_S3_STORAGE,
  HAS_VERCEL_BLOB_STORAGE,
  HAS_CLOUDFLARE_R2_STORAGE,
  HAS_MINIO_STORAGE,
} from '@/app/config';
import {
  cloudflareR2Copy,
  cloudflareR2Delete,
  cloudflareR2List,
  cloudflareR2Put,
} from './cloudflare-r2';
import {
  minioCopy,
  minioDelete,
  minioList,
  minioPut,
} from './minio';
import {
  localFsCopy,
  localFsDelete,
  localFsList,
  localFsPut,
} from './local-fs.server';
import {
  StorageListResponse,
  getFileNamePartsFromStorageUrl,
  storageTypeFromUrl,
} from '.';

export const putFile = (
  file: Buffer,
  fileName: string,
) => {
  switch (CURRENT_STORAGE) {
    case 'vercel-blob':
      return vercelBlobPut(file, fileName);
    case 'cloudflare-r2':
      return cloudflareR2Put(file, fileName);
    case 'aws-s3':
      return awsS3Put(file, fileName);
    case 'minio':
      return minioPut(file, fileName);
    case 'local-fs':
      return localFsPut(file, fileName);
  }
};

export const copyFile = (
  originUrl: string,
  destinationFileName: string,
): Promise<string> => {
  const { fileName } = getFileNamePartsFromStorageUrl(originUrl);
  switch (storageTypeFromUrl(originUrl)) {
    case 'vercel-blob':
      return vercelBlobCopy(
        originUrl,
        destinationFileName,
        false,
      );
    case 'cloudflare-r2':
      return cloudflareR2Copy(
        fileName,
        destinationFileName,
        false,
      );
    case 'aws-s3':
      return awsS3Copy(
        originUrl,
        destinationFileName,
        false,
      );
    case 'minio':
      return minioCopy(
        fileName,
        destinationFileName,
        false,
      );
    case 'local-fs':
      return localFsCopy(
        originUrl,
        destinationFileName,
        false,
      );
  }
};

export const deleteFile = (url: string) => {
  const { fileName } = getFileNamePartsFromStorageUrl(url);
  switch (storageTypeFromUrl(url)) {
    case 'vercel-blob':
      return vercelBlobDelete(url);
    case 'cloudflare-r2':
      return cloudflareR2Delete(fileName);
    case 'aws-s3':
      return awsS3Delete(fileName);
    case 'minio':
      return minioDelete(fileName);
    case 'local-fs':
      return localFsDelete(fileName);
  }
};

export const deleteFilesWithPrefix = async (prefix: string) => {
  const urls = await getStorageUrlsForPrefix(prefix);
  return Promise.all(urls.map(({ url }) => deleteFile(url)));
};

export const moveFile = async (
  originUrl: string,
  destinationFileName: string,
) => {
  const url = await copyFile(originUrl, destinationFileName);
  // If successful, delete original file
  if (url) { await deleteFile(originUrl); }
  return url;
};

export const getStorageUrlsForPrefix = async (prefix = '') => {
  const urls: StorageListResponse = [];

  if (HAS_VERCEL_BLOB_STORAGE) {
    urls.push(...await vercelBlobList(prefix)
      .catch(() => []));
  }
  if (HAS_AWS_S3_STORAGE) {
    urls.push(...await awsS3List(prefix)
      .catch(() => []));
  }
  if (HAS_CLOUDFLARE_R2_STORAGE) {
    urls.push(...await cloudflareR2List(prefix)
      .catch(() => []));
  }
  if (HAS_MINIO_STORAGE) {
    urls.push(...await minioList(prefix)
      .catch(() => []));
  }
  if (CURRENT_STORAGE === 'local-fs') {
    urls.push(...await localFsList(prefix)
      .catch(() => []));
  }

  return urls
    .sort((a, b) => {
      if (!a.uploadedAt) { return 1; }
      if (!b.uploadedAt) { return -1; }
      return b.uploadedAt.getTime() - a.uploadedAt.getTime();
    });
};

export const testStorageConnection = () =>
  getStorageUrlsForPrefix();
