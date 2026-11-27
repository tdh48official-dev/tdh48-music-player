import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_HOST = 'hjzsrvqqpwuwhdtyahzk.supabase.co';
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get('url');
  if (!source) {
    return NextResponse.json({ error: 'Missing artwork URL' }, { status: 400 });
  }

  let imageUrl: URL;
  try {
    imageUrl = new URL(source);
  } catch {
    return NextResponse.json({ error: 'Invalid artwork URL' }, { status: 400 });
  }

  if (
    imageUrl.protocol !== 'https:' ||
    imageUrl.hostname !== ALLOWED_HOST ||
    !imageUrl.pathname.startsWith('/storage/v1/object/public/tdh48-covers/')
  ) {
    return NextResponse.json({ error: 'Artwork source not allowed' }, { status: 403 });
  }

  try {
    const response = await fetch(imageUrl.toString(), {
      cache: 'force-cache',
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Artwork source unavailable' }, { status: 502 });
    }

    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > MAX_SOURCE_BYTES) {
      return NextResponse.json({ error: 'Artwork file is too large' }, { status: 413 });
    }

    const sourceBuffer = Buffer.from(await response.arrayBuffer());
    if (sourceBuffer.byteLength > MAX_SOURCE_BYTES) {
      return NextResponse.json({ error: 'Artwork file is too large' }, { status: 413 });
    }

    const output = await sharp(sourceBuffer, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    return new NextResponse(new Uint8Array(output), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(output.byteLength),
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Could not optimize lock-screen artwork:', error);
    return NextResponse.json({ error: 'Could not process artwork' }, { status: 500 });
  }
}
