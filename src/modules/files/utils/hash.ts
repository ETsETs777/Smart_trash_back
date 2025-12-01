import crypto, { BinaryLike, Hash } from 'crypto';

export function createHashMd5(data: BinaryLike): Hash {
  return crypto.createHash('md5').update(data);
}

export function createHashMd5InHex(data: BinaryLike): string {
  return createHashMd5(data).digest('hex');
}
