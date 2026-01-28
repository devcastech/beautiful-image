# beautiful-image

Image optimization and filters powered by Rust/WASM.

Resize, compress, and apply filters to images in the browser. Runs fast via WebAssembly.

## Why Rust and WASM?

Browsers can resize and encode JPEG natively, but **cannot apply filters** like sharpen, blur, or color adjustments. Rust gives us:

- Image processing algorithms (sharpen, blur, etc.) that browsers don't have
- Fast execution via WebAssembly
- Battle-tested `image` crate with optimized implementations

## Use Cases

- **E-commerce** - Bulk optimize product images before upload
- **CMS/Blogs** - Process images on the client before saving
- **Social apps** - Apply filters and compress photos
- **Photo editors** - Real-time filter previews
- **Blurred previews** - Show blurred thumbnails before unlocking content

## Install

```bash
npm install beautiful-image
```

## Usage

```typescript
import { image } from 'beautiful-image'

const result = await image(file)
  .resize(1000)
  .sharpen(1.5)
  .toJpeg(75)

// result.blob - optimized image
// result.originalSize - original size in bytes
// result.optimizedSize - new size in bytes
// result.compressionRatio - 0.85 = 85% smaller
```

## Filters

```typescript
image(file)
  .resize(width)           // resize maintaining aspect ratio
  .sharpen(sigma)          // 1.0 subtle, 3.0 strong
  .blur(sigma)             // gaussian blur
  .brightness(value)       // -100 to 100
  .contrast(value)         // -100 to 100
  .hueRotate(degrees)      // -180 to 180
  .grayscale()             // black & white
  .invert()                // invert colors
  .toJpeg(quality)         // 1-100
```

## TODO

- [ ] More filters (sepia, vignette, noise)
- [ ] Crop
- [ ] Export to WebP/PNG
- [ ] Presets
- [ ] Web Worker support
- [ ] Batch processing
