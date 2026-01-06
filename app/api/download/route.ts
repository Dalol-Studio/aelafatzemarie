import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const fileName = request.nextUrl.searchParams.get('fileName');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return new NextResponse(`Failed to fetch file: ${response.status}`, {
        status: response.status,
      });
    }

    const blob = await response.blob();
    const headers = new Headers();
    
    headers.set('Content-Type', blob.type || 'application/octet-stream');
    headers.set(
      'Content-Disposition',
      `attachment; filename="${fileName || 'download'}"`,
    );
    headers.set('Content-Length', blob.size.toString());

    return new NextResponse(blob, { headers });
  } catch (error: any) {
    console.error('Download error:', error);
    return new NextResponse(`Download failed: ${error.message}`, {
      status: 500,
    });
  }
}
