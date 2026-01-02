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

export async function GET(
  _: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;

  const session = await auth();
  if (session?.user && key) {
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
    
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });

    return new Response(
      url,
      { headers: { 'content-type': 'text/plain' } },
    );
  } else {
    return new Response('Unauthorized request', { status: 401 });
  }
}
