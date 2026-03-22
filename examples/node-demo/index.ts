import { image } from 'beautiful-image/node';
import { readFileSync, writeFileSync } from 'node:fs';

// Using Lambda with S3:
// const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
// const input = Buffer.from(await Body!.transformToByteArray());
const input = readFileSync('./sample.jpg');

const result = await image(input)
  .resize(1200)
  .toJpeg(80);

writeFileSync('./optimized.jpg', result.data);

console.log(`Original: ${(result.originalSize / 1024).toFixed(1)} KB`);
console.log(`Optimized: ${(result.optimizedSize / 1024).toFixed(1)} KB`);
console.log(`Saved: ${(result.compressionRatio * 100).toFixed(1)}%`);
