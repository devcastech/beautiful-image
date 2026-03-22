/* tslint:disable */
/* eslint-disable */

export enum ResizeMode {
  Standard = 0,
  HighQuality = 1,
}

export function processImage(rgba_data: Uint8Array, width: number, height: number, quality: number, sharpen_sigma: number | null | undefined, sharpen_threshold: number | null | undefined, blur_sigma: number | null | undefined, brightness: number | null | undefined, contrast: number | null | undefined, grayscale: boolean, invert: boolean, hue_rotate?: number | null): Uint8Array;

export function processImageFromBytes(image_data: Uint8Array, target_width: number | null | undefined, quality: number, sharpen_sigma: number | null | undefined, sharpen_threshold: number | null | undefined, blur_sigma: number | null | undefined, brightness: number | null | undefined, contrast: number | null | undefined, grayscale: boolean, invert: boolean, hue_rotate?: number | null): Uint8Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly processImage: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => [number, number, number, number];
  readonly processImageFromBytes: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => [number, number, number, number];
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
