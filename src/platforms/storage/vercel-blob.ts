import { PATH_API_VERCEL_BLOB_UPLOAD } from '@/app/path';
import { upload } from '@vercel/blob/client';
import { getFileNamePartsFromStorageUrl, StorageListResponse } from '.';
import { formatBytes } from '@/utility/number';

const VERCEL_BLOB_STORE_ID = process.env.BLOB_READ_WRITE_TOKEN?.match(
  /^vercel_blob_rw_([a-z0-9]+)_[a-z0-9]+$/i,
)?.[1].toLowerCase();

export const VERCEL_BLOB_BASE_URL = VERCEL_BLOB_STORE_ID
  ? `https://${VERCEL_BLOB_STORE_ID}.public.blob.vercel-storage.com`
  : undefined;

export const isUrlFromVercelBlob = (url?: string) =>
  VERCEL_BLOB_BASE_URL &&
  url?.startsWith(VERCEL_BLOB_BASE_URL);

export const vercelBlobUploadFromClient = async (
  file: File | Blob,
  fileName: string,
): Promise<string> =>
  upload(
    fileName,
    file, {
      access: 'public',
      handleUploadUrl: PATH_API_VERCEL_BLOB_UPLOAD,
    },
  )
    .then(({ url }) => url);

export const vercelBlobPut = async (
  file: Buffer,
  fileName: string,
): Promise<string> => {
  const { put } = await import('@vercel/blob');
  return put(fileName, file, { access: 'public' })
    .then(({ url }) => url);
};

export const vercelBlobCopy = async (
  sourceUrl: string,
  destinationFileName: string,
  addRandomSuffix?: boolean,
): Promise<string> => {
  const { copy } = await import('@vercel/blob');
  return copy(
    sourceUrl,
    destinationFileName,
    { access: 'public', addRandomSuffix },
  )
    .then(({ url }) => url);
};

export const vercelBlobDelete = async (fileName: string) => {
  const { del } = await import('@vercel/blob');
  return del(fileName);
};

export const vercelBlobList = async (
  prefix: string,
): Promise<StorageListResponse> => {
  const { list } = await import('@vercel/blob');
  return list({ prefix })
    .then(({ blobs }) => blobs.map(({ url, uploadedAt, size }) => ({
      url,
      fileName: getFileNamePartsFromStorageUrl(url).fileName,
      uploadedAt,
      size: formatBytes(size),
    })));
};
