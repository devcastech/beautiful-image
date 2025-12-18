# Beautiful Image

A Rust library for optimizing images in the browser using WebAssembly.

## What it does

Optimizes images by resizing and compressing them to JPEG format. Perfect for reducing image file sizes before uploading to your website.

## Features

- Resize images to a specific width (maintains aspect ratio)
- Compress to JPEG with adjustable quality
- Two resize modes:
  - **Standard**: Fast resizing (Triangle filter)
  - **HighQuality**: Better quality (Lanczos3 filter)
- Supports JPEG, PNG, and WebP input formats
- Runs in the browser via WebAssembly

## Installation

```bash
npm i beautiful-image
```

## Usage

Works with any modern bundler (Vite, Webpack, Rollup) and framework (React, Vue, Angular, Svelte).

```javascript
import { optimizeImage, ResizeMode } from "beautiful-image";
```

### API

```javascript
optimizeImage(bytes, width, quality, mode)
```

**Parameters:**
- `bytes` (Uint8Array): Image data as byte array
- `width` (number): Target width in pixels (maintains aspect ratio)
- `quality` (number): JPEG quality from 1-100 (higher = better quality, larger file)
- `mode` (ResizeMode): `ResizeMode.Standard` (fast) or `ResizeMode.HighQuality` (slower, better)

**Returns:** `Uint8Array` - Optimized JPEG image bytes

### Examples

```javascript
import { optimizeImage, ResizeMode } from "beautiful-image";

// Get image bytes from a file input
const file = document.getElementById('upload').files[0];
const arrayBuffer = await file.arrayBuffer();
const bytes = new Uint8Array(arrayBuffer);

// Example 1: High quality resize to 800px
const result1 = optimizeImage(bytes, 800, 85, ResizeMode.HighQuality);

// Example 2: Fast standard resize to 1200px with lower quality
const result2 = optimizeImage(bytes, 1200, 60, ResizeMode.Standard);

// Example 3: Small thumbnail with standard mode
const result3 = optimizeImage(bytes, 300, 70, ResizeMode.Standard);

// Create a blob to display or download
const blob = new Blob([result1], { type: "image/jpeg" });
const url = URL.createObjectURL(blob);
```

## Building from Source

If you want to build the package yourself:

```bash
cargo install wasm-pack
wasm-pack build --target bundler --release
```

## License

MIT
