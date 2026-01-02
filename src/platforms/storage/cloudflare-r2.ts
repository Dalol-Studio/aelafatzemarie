import { StorageListResponse, generateStorageId } from '.';
import { removeUrlProtocol } from '@/utility/url';
import { formatBytes } from '@/utility/number';

const CLOUDFLARE_R2_BUCKET =
  process.env.NEXT_PUBLIC_CLOUDFLARE_R2_BUCKET ?? '';
const CLOUDFLARE_R2_ACCOUNT_ID =
  process.env.NEXT_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID ?? '';
const CLOUDFLARE_R2_PUBLIC_DOMAIN =
  removeUrlProtocol(process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN) ?? '';
const CLOUDFLARE_R2_ACCESS_KEY =
  process.env.CLOUDFLARE_R2_ACCESS_KEY ?? '';
const CLOUDFLARE_R2_SECRET_ACCESS_KEY =
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? '';
const CLOUDFLARE_R2_ENDPOINT = CLOUDFLARE_R2_ACCOUNT_ID
  ? `https://${CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : undefined;

export const CLOUDFLARE_R2_BASE_URL_PUBLIC = CLOUDFLARE_R2_PUBLIC_DOMAIN
  ? `https://${CLOUDFLARE_R2_PUBLIC_DOMAIN}`
  : undefined;
export const CLOUDFLARE_R2_BASE_URL_PRIVATE =
  CLOUDFLARE_R2_ENDPOINT && CLOUDFLARE_R2_BUCKET
    ? `${CLOUDFLARE_R2_ENDPOINT}/${CLOUDFLARE_R2_BUCKET}`
    : undefined;

export const cloudflareR2Client = async () => {
  const { S3Client } = await import('@aws-sdk/client-s3');
  return new S3Client({
    region: 'auto',
    endpoint: CLOUDFLARE_R2_ENDPOINT,
    credentials: {
      accessKeyId: CLOUDFLARE_R2_ACCESS_KEY,
      secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  });
};

const urlForKey = (key?: string, isPublic = true) => isPublic
  ? `${CLOUDFLARE_R2_BASE_URL_PUBLIC}/${key}`
  : `${CLOUDFLARE_R2_BASE_URL_PRIVATE}/${key}`;

export const isUrlFromCloudflareR2 = (url?: string) => (
  CLOUDFLARE_R2_BASE_URL_PRIVATE &&
  url?.startsWith(CLOUDFLARE_R2_BASE_URL_PRIVATE)
) || (
  CLOUDFLARE_R2_BASE_URL_PUBLIC &&
  url?.startsWith(CLOUDFLARE_R2_BASE_URL_PUBLIC)
);

export const cloudflareR2PutObjectCommandForKey = async (Key: string) => {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  return new PutObjectCommand({ Bucket: CLOUDFLARE_R2_BUCKET, Key });
};

export const cloudflareR2Put = async (
  file: Buffer,
  fileName: string,
): Promise<string> => {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  return (await cloudflareR2Client()).send(new PutObjectCommand({
    Bucket: CLOUDFLARE_R2_BUCKET,
    Key: fileName,
    Body: file,
  }))
    .then(() => urlForKey(fileName));
};

export const cloudflareR2Copy = async (
  fileNameSource: string,
  fileNameDestination: string,
  addRandomSuffix?: boolean,
) => {
  const { CopyObjectCommand } = await import('@aws-sdk/client-s3');
  const name = fileNameSource.split('.')[0];
  const extension = fileNameSource.split('.')[1];
  const Key = addRandomSuffix
    ? `${name}-${generateStorageId()}.${extension}`
    : fileNameDestination;
  return (await cloudflareR2Client()).send(new CopyObjectCommand({
    Bucket: CLOUDFLARE_R2_BUCKET,
    CopySource: `${CLOUDFLARE_R2_BUCKET}/${fileNameSource}`,
    Key,
  }))
    .then(() => urlForKey(fileNameDestination));
};

export const cloudflareR2List = async (
  Prefix: string,
): Promise<StorageListResponse> => {
  const { ListObjectsCommand } = await import('@aws-sdk/client-s3');
  return (await cloudflareR2Client()).send(new ListObjectsCommand({
    Bucket: CLOUDFLARE_R2_BUCKET,
    Prefix,
  }))
    .then((data) => data.Contents?.map(({ Key, LastModified, Size }) => ({
      url: urlForKey(Key),
      fileName: Key ?? '',
      uploadedAt: LastModified,
      size: Size ? formatBytes(Size) : undefined,
    })) ?? []);
};

export const cloudflareR2Delete = async (Key: string) => {
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  await (await cloudflareR2Client()).send(new DeleteObjectCommand({
    Bucket: CLOUDFLARE_R2_BUCKET,
    Key,
  }));
};
