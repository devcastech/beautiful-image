let wasm;

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

/**
 * @enum {0 | 1}
 */
export const ResizeMode = Object.freeze({
    Standard: 0, "0": "Standard",
    HighQuality: 1, "1": "HighQuality",
});

/**
 * @param {Uint8Array} rgba_data
 * @param {number} width
 * @param {number} height
 * @param {number} quality
 * @param {number | null | undefined} sharpen_sigma
 * @param {number | null | undefined} sharpen_threshold
 * @param {number | null | undefined} blur_sigma
 * @param {number | null | undefined} brightness
 * @param {number | null | undefined} contrast
 * @param {boolean} grayscale
 * @param {boolean} invert
 * @param {number | null} [hue_rotate]
 * @returns {Uint8Array}
 */
export function processImage(rgba_data, width, height, quality, sharpen_sigma, sharpen_threshold, blur_sigma, brightness, contrast, grayscale, invert, hue_rotate) {
    const ptr0 = passArray8ToWasm0(rgba_data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.processImage(ptr0, len0, width, height, quality, isLikeNone(sharpen_sigma) ? 0x100000001 : Math.fround(sharpen_sigma), isLikeNone(sharpen_threshold) ? 0x100000001 : (sharpen_threshold) >> 0, isLikeNone(blur_sigma) ? 0x100000001 : Math.fround(blur_sigma), isLikeNone(brightness) ? 0x100000001 : (brightness) >> 0, isLikeNone(contrast) ? 0x100000001 : Math.fround(contrast), grayscale, invert, isLikeNone(hue_rotate) ? 0x100000001 : (hue_rotate) >> 0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

/**
 * @param {Uint8Array} image_data
 * @param {number | null | undefined} target_width
 * @param {number} quality
 * @param {number | null | undefined} sharpen_sigma
 * @param {number | null | undefined} sharpen_threshold
 * @param {number | null | undefined} blur_sigma
 * @param {number | null | undefined} brightness
 * @param {number | null | undefined} contrast
 * @param {boolean} grayscale
 * @param {boolean} invert
 * @param {number | null} [hue_rotate]
 * @returns {Uint8Array}
 */
export function processImageFromBytes(image_data, target_width, quality, sharpen_sigma, sharpen_threshold, blur_sigma, brightness, contrast, grayscale, invert, hue_rotate) {
    const ptr0 = passArray8ToWasm0(image_data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.processImageFromBytes(ptr0, len0, isLikeNone(target_width) ? 0x100000001 : (target_width) >>> 0, quality, isLikeNone(sharpen_sigma) ? 0x100000001 : Math.fround(sharpen_sigma), isLikeNone(sharpen_threshold) ? 0x100000001 : (sharpen_threshold) >> 0, isLikeNone(blur_sigma) ? 0x100000001 : Math.fround(blur_sigma), isLikeNone(brightness) ? 0x100000001 : (brightness) >> 0, isLikeNone(contrast) ? 0x100000001 : Math.fround(contrast), grayscale, invert, isLikeNone(hue_rotate) ? 0x100000001 : (hue_rotate) >> 0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_cast_2241b6af4c4b2941 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(String) -> Externref`.
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_externrefs;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
    };

    return imports;
}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('beautiful_image_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
