export { image } from './image-processor-web.js';
export type { OptimizeResult } from './types.js';

// Low-level Api in Rust
export { processImage } from '../wasm/beautiful_image.js';
