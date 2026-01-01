import {
  VERCEL_BLOB_BASE_URL,
  vercelBlobUploadFromClient,
} from './vercel-blob';
import { AWS_S3_BASE_URL, isUrlFromAwsS3 } from './aws-s3';
import {
  CURRENT_STORAGE,
} from '@/app/config';
import { generateNanoid } from '@/utility/nanoid';
import {
  CLOUDFLARE_R2_BASE_URL_PUBLIC,
  isUrlFromCloudflareR2,
} from './cloudflare-r2';
import { MINIO_BASE_URL, isUrlFromMinio } from './minio';
import {
  LOCAL_FS_BASE_URL,
  isUrlFromLocalFs,
} from './local-fs';
import { PATH_API_PRESIGNED_URL } from '@/app/path';

export {
  type StorageListItem,
  type StorageListResponse,
  type StorageType,
} from './types';

import { StorageType } from './types';

export const generateStorageId = () => generateNanoid(16);

export const generateFileNameWithId = (prefix: string) =>
  `${prefix}-${generateStorageId()}`;

export const getFileNamePartsFromStorageUrl = (url: string) => {
  const [
    _,
    urlBase = '',
    fileName = '',
    fileNameBase = '',
    fileId = '',
    fileExtension = '',
  ] = url.match(/^(.+)\/((-*[a-z0-9]+-*([a-z0-9-]+))\.([a-z]{1,4}))$/i) ?? [];
  return {
    urlBase,
    fileName,
    fileNameBase,
    fileId,
    fileExtension,
  };
};

export const labelForStorage = (type: StorageType): string => {
  switch (type) {
    case 'vercel-blob': return 'Vercel Blob';
    case 'cloudflare-r2': return 'Cloudflare R2';
    case 'aws-s3': return 'AWS S3';
    case 'minio': return 'MinIO';
    case 'local-fs': return 'Local FS';
  }
};

export const baseUrlForStorage = (type: StorageType) => {
  switch (type) {
    case 'vercel-blob': return VERCEL_BLOB_BASE_URL;
    case 'cloudflare-r2': return CLOUDFLARE_R2_BASE_URL_PUBLIC;
    case 'aws-s3': return AWS_S3_BASE_URL;
    case 'minio': return MINIO_BASE_URL;
    case 'local-fs': return LOCAL_FS_BASE_URL;
  }
};

export const storageTypeFromUrl = (url: string): StorageType => {
  if (isUrlFromCloudflareR2(url)) {
    return 'cloudflare-r2';
  } else if (isUrlFromAwsS3(url)) {
    return 'aws-s3';
  } else if (isUrlFromMinio(url)) {
    return 'minio';
  } else if (isUrlFromLocalFs(url)) {
    return 'local-fs';
  } else {
    return 'vercel-blob';
  }
};

export const uploadFromClientViaPresignedUrl = async (
  file: File | Blob,
  fileNameBase: string,
  extension: string,
  addRandomSuffix?: boolean,
) => {
  const key = addRandomSuffix
    ? `${fileNameBase}-${generateStorageId()}.${extension}`
    : `${fileNameBase}.${extension}`;

  const url = await fetch(`${PATH_API_PRESIGNED_URL}/${key}`)
    .then((response) => response.text());

  return fetch(url, { method: 'PUT', body: file })
    .then(() => `${baseUrlForStorage(CURRENT_STORAGE)}/${key}`);
};

export const uploadFileFromClient = async (
  file: File | Blob,
  fileNameBase: string,
  extension: string,
) => (
  CURRENT_STORAGE === 'cloudflare-r2' ||
  CURRENT_STORAGE === 'aws-s3' ||
  CURRENT_STORAGE === 'minio' ||
  CURRENT_STORAGE === 'local-fs'
)
  ? uploadFromClientViaPresignedUrl(file, fileNameBase, extension, true)
  : vercelBlobUploadFromClient(file, `${fileNameBase}.${extension}`);
