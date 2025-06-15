import { put, del, list } from '@vercel/blob';

export interface UploadOptions {
  access?: 'public' | 'private';
  folder?: string;
  filename?: string;
}

export interface BlobFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

/**
 * Upload a file to Vercel Blob storage
 */
export async function uploadFile(
  file: File | Buffer | string,
  options: UploadOptions = {}
): Promise<BlobFile> {
  const { access = 'public', folder = 'uploads', filename } = options;
  
  // Generate pathname
  const timestamp = new Date().toISOString().split('T')[0];
  const name = filename || (file instanceof File ? file.name : 'file');
  const pathname = `${folder}/${timestamp}/${name}`;
  
  const blob = await put(pathname, file, {
    access,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  
  return {
    url: blob.url,
    pathname: blob.pathname,
    size: blob.size,
    uploadedAt: blob.uploadedAt,
  };
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  options: UploadOptions = {}
): Promise<BlobFile[]> {
  const uploadPromises = files.map(file => uploadFile(file, options));
  return Promise.all(uploadPromises);
}

/**
 * Delete a file from blob storage
 */
export async function deleteFile(url: string): Promise<void> {
  await del(url, {
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

/**
 * List files in a folder
 */
export async function listFiles(folder?: string) {
  const { blobs } = await list({
    prefix: folder,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  
  return blobs.map(blob => ({
    url: blob.url,
    pathname: blob.pathname,
    size: blob.size,
    uploadedAt: blob.uploadedAt,
  }));
}

/**
 * Upload tattoo design image
 */
export async function uploadTattooDesign(file: File): Promise<BlobFile> {
  return uploadFile(file, {
    folder: 'tattoo-designs',
    access: 'public'
  });
}

/**
 * Upload artist portfolio image
 */
export async function uploadPortfolioImage(file: File): Promise<BlobFile> {
  return uploadFile(file, {
    folder: 'portfolio',
    access: 'public'
  });
}

/**
 * Upload general media file
 */
export async function uploadMediaFile(file: File): Promise<BlobFile> {
  return uploadFile(file, {
    folder: 'media',
    access: 'public'
  });
}