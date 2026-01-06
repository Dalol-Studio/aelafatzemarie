import { auth } from '@/auth/server';
import {
  awsS3Client,
  awsS3PutObjectCommandForKey,
} from '@/platforms/storage/aws-s3';
import {
  cloudflareR2Client,
  cloudflareR2PutObjectCommandForKey,
} from '@/platforms/storage/cloudflare-r2';
import {
  minioClient,
  minioPutObjectCommandForKey,
} from '@/platforms/storage/minio';
import { CURRENT_STORAGE } from '@/app/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(
  _: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const { key } = await params;

    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized request', {
        status: 401,
        headers: { 'content-type': 'text/plain' },
      });
    }

    if (!key) {
      return new Response('Missing key parameter', {
        status: 400,
        headers: { 'content-type': 'text/plain' },
      });
    }

    let client;
    let command;

    switch (CURRENT_STORAGE) {
      case 'cloudflare-r2':
        client = await cloudflareR2Client();
        command = await cloudflareR2PutObjectCommandForKey(key);
        break;
      case 'minio':
        client = await minioClient();
        command = await minioPutObjectCommandForKey(key);
        break;
      default:
        client = await awsS3Client();
        command = await awsS3PutObjectCommandForKey(key);
        break;
    }

    // 1 hour expiration for presigned URL
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });

    return new Response(url, {
      headers: {
        'content-type': 'text/plain',
        'cache-control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: { 'content-type': 'text/plain' },
    });
  }
}
