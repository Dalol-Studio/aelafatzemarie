export type StorageType =
  | 'vercel-blob'
  | 'aws-s3'
  | 'cloudflare-r2'
  | 'minio'
  | 'local-fs';

export type StorageListItem = {
  url: string
  fileName: string
  uploadedAt?: Date
  size?: string
};

export type StorageListResponse = StorageListItem[];
