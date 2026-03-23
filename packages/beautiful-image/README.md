# beautiful-image

Compress and optimize images with minimal quality loss in the browser or on the server. Powered by Rust/WASM with zero native dependencies.

## How it works

Most tools that compress images do it at the cost of visible quality degradation. `beautiful-image` combines resize, sharpening, and JPEG encoding tuned to produce the smallest file size while keeping the image looking sharp and clean.

- **Browser** uses the native Canvas API for fast GPU-accelerated decode and resize, then hands off to WASM for sharpening and JPEG encoding
- **Node.js** runs the full pipeline in WASM (decode, resize, filters, encode), making it ideal for serverless environments like AWS Lambda or Google Cloud Functions with no native dependencies

## Install

```bash
npm install beautiful-image
```

## Browser

```html
<input type="file" id="upload" accept="image/*" />
<img id="preview" />
```

```typescript
import { image } from 'beautiful-image'

const input = document.getElementById('upload') as HTMLInputElement

input.addEventListener('change', async () => {
  const file = input.files?.[0]
  if (!file) return

  const result = await image(file)
    .resize(1200)
    .sharpen()
    .toJpeg(80)

  // result.blob             — optimized image as Blob
  // result.originalSize     — original size in bytes
  // result.optimizedSize    — new size in bytes
  // result.compressionRatio — 0.85 = 85% smaller
  // result.width / result.height

  document.getElementById('preview').src = URL.createObjectURL(result.blob)
})
```

For a full working demo see [`examples/web-demo`](./examples/web-demo).

## Node.js

```typescript
import { image } from 'beautiful-image/node'
import { readFileSync, writeFileSync } from 'node:fs'

const input = readFileSync('./photo.jpg')

const result = await image(input)
  .resize(1200)
  .sharpen()
  .toJpeg(80)

writeFileSync('./optimized.jpg', result.data)

// result.data             — optimized image as Buffer
// result.originalSize     — original size in bytes
// result.optimizedSize    — new size in bytes
// result.compressionRatio — 0.85 = 85% smaller
```

### Lambda + S3 example

```typescript
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { image } from 'beautiful-image/node'

const s3 = new S3Client({})

export const handler = async (event: any) => {
  const bucket = event.Records[0].s3.bucket.name
  const key = decodeURIComponent(event.Records[0].s3.object.key)

  const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  const input = Buffer.from(await Body!.transformToByteArray())

  const result = await image(input).resize(1200).sharpen().toJpeg(80)

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: `optimized/${key}`,
    Body: result.data,
    ContentType: 'image/jpeg',
  }))
}
```

## API

All methods are available in both browser and Node.js:

```typescript
image(file)
  .resize(width)        // resize maintaining aspect ratio
  .sharpen(sigma)       // default 1.5 — subtle to strong
  .blur(sigma)          // gaussian blur
  .brightness(value)    // -100 to 100
  .contrast(value)      // -100 to 100
  .hueRotate(degrees)   // -180 to 180
  .grayscale()          // black & white
  .invert()             // invert colors
  .toJpeg(quality)      // 1-100
```

## Use Cases

- **E-commerce** — Optimize product images before upload, saving storage and bandwidth
- **CMS/Blogs** — Process images on the client before saving, no server needed
- **Social apps** — Compress and filter photos before posting
- **Lambda/Cloud Functions** — Automatically optimize images on upload to S3 or cloud storage
- **Blurred previews** — Generate blurred thumbnails before unlocking content

## TODO

- [ ] More filters (sepia, vignette, noise)
- [ ] Crop
- [ ] Export to WebP/PNG
- [ ] Presets
- [ ] Web Worker support
- [ ] Batch processing
- [ ] `getImageDimensions()` return width/height from Node.js pipeline (`image::image_dimensions()` reads only the header, no full decode)
