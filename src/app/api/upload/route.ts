import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const type = searchParams.get('type') || 'media';

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    if (!request.body) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      );
    }

    // Create folder structure based on type and date
    const timestamp = new Date().toISOString().split('T')[0];
    let folder = 'media';
    
    switch (type) {
      case 'tattoo-design':
        folder = 'tattoo-designs';
        break;
      case 'portfolio':
        folder = 'portfolio';
        break;
      case 'avatar':
        folder = 'avatars';
        break;
      default:
        folder = 'media';
    }

    const pathname = `${folder}/${timestamp}/${filename}`;

    // Upload to Vercel Blob
    const blob = await put(pathname, request.body, {
      access: 'public',
      addRandomSuffix: true,
    });

    return NextResponse.json(blob);

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}