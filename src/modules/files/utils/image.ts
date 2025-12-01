import heic from 'heic-convert';
import path from 'node:path';

import { Buffer } from 'node:buffer';
import sharp from 'sharp';

export async function ConvertHeicToJpeg({
  buffer,
  quality = 1,
}: {
  buffer: ArrayBufferLike;
  quality?: number;
}): Promise<Buffer<ArrayBufferLike>> {
  return Buffer.from(
    await heic({
      buffer,
      format: 'JPEG',
      quality,
    }),
  );
}

export function IsHeic(fileName: string): boolean {
  return path.extname(fileName).toLowerCase() === '.heic';
}

export async function IfHeicThenConvertToJpeg({
  fileName,
  buffer,
  quality = 1,
}: {
  fileName: string;
  buffer: Buffer<ArrayBufferLike>;
  quality?: number;
}): Promise<Buffer<ArrayBufferLike>> {
  if (!IsHeic(fileName)) return buffer;
  return Buffer.from(
    await heic({
      buffer: buffer.buffer,
      format: 'JPEG',
      quality,
    }),
  );
}

export async function createImageAndAvatar({
  buffer,
  angle,
}: {
  buffer: Buffer<ArrayBufferLike>;
  angle?: string | number;
}): Promise<{
  bufferImage: Buffer<ArrayBufferLike>;
  bufferAvatar: Buffer<ArrayBufferLike>;
}> {
  const [bufferImage, bufferAvatar] = await Promise.all([
    sharp(buffer)
      .resize(1000)
      .rotate(Number(angle || 0))
      .jpeg({ mozjpeg: true, quality: 70 })
      .toBuffer(),
    sharp(buffer)
      .resize(100)
      .rotate(Number(angle || 0))
      .jpeg({ mozjpeg: true, quality: 50 })
      .toBuffer(),
  ]);
  return { bufferImage, bufferAvatar };
}
