# Plan: Web Worker transparente dentro de `beautiful-image` (entry web)

## 0. Principio rector

> El consumidor sigue escribiendo exactamente `await image(file).resize(1200).sharpen().toJpeg(80)`.
> Nada cambia en la firma pública. Internamente, ese `toJpeg` despacha el trabajo pesado a un
> worker; si el entorno no lo soporta, cae al hilo principal (comportamiento actual).
> **Transparencia total + degradación elegante.**

Todo el cambio vive en `packages/beautiful-image/`. El playground **no se toca** (su
debounce/coalescing es responsabilidad de la app, no de la librería).

---

## 1. Decisiones de arquitectura (qué / por qué / alternativa descartada)

### Decisión 1 — Solo el entry **web** gana worker. Node intacto.
- **Qué:** `main.node.ts` -> `image-processor-node.ts` se quedan igual.
- **Por qué:** En Node/Lambda cada invocación procesa un request; bloquear el hilo es lo correcto
  (usas todo el CPU disponible y no hay UI que congelar). Meter `worker_threads` ahí solo añade
  latencia de arranque y complejidad sin beneficio.
- **Descartado:** Un worker universal. No aporta en server y contamina el bundle de Node con
  `OffscreenCanvas`/`Worker` que no existen ahí.

### Decisión 2 — La API ya es `async`, así que el cambio es **interno puro**.
- **Qué:** `toJpeg(quality): Promise<OptimizeResult>` mantiene su firma.
- **Por qué:** Ya devuelve Promise. Pasar de "resolver tras WASM en main thread" a "resolver tras
  WASM en worker" es invisible para quien llama. Cero breaking changes, cero migración.

### Decisión 3 — **Worker singleton reutilizado**, creado de forma perezosa.
- **Qué:** Un único `Worker` por pestaña, creado en la **primera** llamada a `toJpeg`, reutilizado
  para todas las siguientes.
- **Por qué:**
  - Inicializar el WASM cuesta (instanciar el módulo). Un worker por llamada pagaría ese costo cada
    vez. El singleton mantiene el WASM **caliente**.
  - Creación perezosa = **SSR-safe**. Astro importa la librería durante el build/SSR en Node, donde
    `Worker` no existe. Si instanciáramos el worker al importar el módulo, **reventaría el build del
    sitio**. Solo lo creamos cuando se ejecuta `toJpeg` (siempre en navegador).
- **Descartado:** (a) Worker por llamada -> desperdicia init de WASM. (b) Pool de N workers ->
  optimización prematura; el coalescing del playground ya evita backlog. Empezamos con 1; si más
  adelante hay lotes (batch), se evalúa un pool.

### Decisión 4 — Empaquetar el worker **inline** (`?worker&inline`).
- **Qué:** El worker se importa con el sufijo `?worker&inline`, que Vite convierte en un constructor
  cuyo código va embebido como blob base64 dentro del `dist`.
- **Por qué:** Vite en modo `lib` ya inlinea el WASM por la misma razón (una librería no debe
  depender de archivos sueltos servidos por el consumidor). Si emitiéramos el worker como **chunk
  aparte**, el bundler del consumidor tendría que resolver y servir ese asset — frágil en setups
  viejos o sin bundler. Inline = **"just works"** en cualquier consumidor (Vite, webpack, esbuild, o
  sin bundler).
- **Costo aceptado:** el WASM (~600 KB) queda **duplicado**: una copia en el camino de fallback del
  hilo principal, otra dentro del blob del worker (~1.2 MB total inline). Ver seccion 6 (trade-offs)
  para la mitigación futura.
- **Descartado:** `new Worker(new URL('./w.ts', import.meta.url))` sin inline -> genera un archivo
  `.js` separado que el consumidor debe poder servir. Rompe la propiedad de "un solo archivo
  autocontenido" que hoy tiene la librería.

### Decisión 5 — **Fallback** al hilo principal, con detección de features.
- **Qué:** Si `Worker`/`OffscreenCanvas` no existen, o crear el worker lanza (p. ej. CSP bloquea blob
  workers), o el primer job falla, se procesa en el hilo principal (código actual) y se desactiva el
  worker para esa sesión.
- **Por qué:** Robustez. `OffscreenCanvas` en worker no existe en Safari < 16.4. El fallback es
  exactamente el comportamiento de hoy, así que **nunca es una regresión**. En el peor caso, se
  congela como ahora; en el mejor (mayoría), fluido.

### Decisión 6 — Extraer un **core puro** `encodeWeb()` compartido.
- **Qué:** Mover el cuerpo actual de `toJpeg` a una función sin `this`:
  `encodeWeb({ file, targetWidth, ops, quality })`.
- **Por qué:** El worker y el fallback deben ejecutar **exactamente la misma lógica**. Una sola
  fuente de verdad evita que diverjan. El worker importa `encodeWeb` (y con ello arrastra el WASM a
  su bundle, que es justo lo que queremos).

---

## 2. Contrato de mensajes (worker <-> main)

Tipos compartidos por worker y cliente (los tipos se borran en runtime, no añaden peso):

```ts
// lib/worker-protocol.ts
import type { Operations, OptimizeResult } from './types.js';

export interface EncodePayload {
  file: File | Blob;          // structured-clone por referencia -> barato
  targetWidth?: number;
  ops: Operations;
  quality: number;
}

export interface WorkerRequest {
  id: number;
  payload: EncodePayload;
}

export type WorkerResponse =
  | { id: number; ok: true; result: OptimizeResult }   // result.blob es cloneable
  | { id: number; ok: false; error: string };
```

- **Enviar `File`/`Blob`:** structured clone los pasa por referencia a los bytes inmutables ->
  barato, sin copia.
- **Devolver `OptimizeResult`:** su `blob` es cloneable. No necesitamos transferables.

---

## 3. Cambios archivo por archivo

### 3.1 NUEVO — `lib/encode-web.ts` (el core puro)
Extraes aquí lo que hoy está en `ImageProcessorWeb.toJpeg`:

```ts
import init, { processImage } from '../wasm/beautiful_image.js';
import type { EncodePayload } from './worker-protocol.js';
import type { OptimizeResult } from './types.js';

let initialized = false;
async function ensureInit() {
  if (!initialized) { await init(); initialized = true; }
}

/** Núcleo de codificación. Idéntico para worker y fallback. */
export async function encodeWeb(
  { file, targetWidth, ops, quality }: EncodePayload,
): Promise<OptimizeResult> {
  await ensureInit();

  const bitmap = await createImageBitmap(file);
  const aspectRatio = bitmap.height / bitmap.width;
  const finalWidth = targetWidth ? Math.min(targetWidth, bitmap.width) : bitmap.width;
  const finalHeight = Math.round(finalWidth * aspectRatio);

  const canvas = new OffscreenCanvas(finalWidth, finalHeight);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, finalWidth, finalHeight);

  const imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
  const rgbaBytes = new Uint8Array(imageData.data.buffer);

  const result = processImage(
    rgbaBytes, finalWidth, finalHeight, quality,
    ops.sharpenSigma ?? null, ops.sharpenThreshold ?? null, ops.blurSigma ?? null,
    ops.brightness ?? null, ops.contrast ?? null, ops.grayscale, ops.invert,
    ops.hueRotate ?? null,
  );
  bitmap.close();

  const originalSize = file.size;
  const optimizedSize = result.length;
  return {
    blob: new Blob([new Uint8Array(result)], { type: 'image/jpeg' }),
    originalSize, optimizedSize,
    compressionRatio: 1 - optimizedSize / originalSize,
    width: finalWidth, height: finalHeight,
  };
}
```

> **Por qué aquí:** `ensureInit` se mueve con el core para que el worker tenga su propia
> inicialización de WASM caliente.

### 3.2 NUEVO — `lib/optimizer.worker.ts` (el script del worker)

```ts
/// <reference lib="webworker" />
import { encodeWeb } from './encode-web.js';
import type { WorkerRequest, WorkerResponse } from './worker-protocol.js';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, payload } = e.data;
  try {
    const result = await encodeWeb(payload);
    ctx.postMessage({ id, ok: true, result } satisfies WorkerResponse);
  } catch (err) {
    ctx.postMessage({
      id, ok: false,
      error: err instanceof Error ? err.message : 'Optimization failed',
    } satisfies WorkerResponse);
  }
};
```

> Procesa **serialmente** (un `onmessage` a la vez). El orden de responsabilidades: la librería no
> hace coalescing; resuelve cada job. La app decide cadencia.

### 3.3 NUEVO — `lib/worker-client.ts` (singleton + correlación + fallback)

```ts
import OptimizerWorker from './optimizer.worker.ts?worker&inline';
import { encodeWeb } from './encode-web.js';
import type { EncodePayload, WorkerResponse } from './worker-protocol.js';
import type { OptimizeResult } from './types.js';

let worker: Worker | null = null;
let disabled = false;                 // se apaga para la sesión si algo falla
let nextId = 0;
const pending = new Map<number, {
  resolve: (r: OptimizeResult) => void;
  reject: (e: Error) => void;
}>();

function canUseWorker(): boolean {
  return !disabled
    && typeof Worker !== 'undefined'
    && typeof OffscreenCanvas !== 'undefined';
}

function getWorker(): Worker | null {
  if (!canUseWorker()) return null;
  if (worker) return worker;
  try {
    worker = new OptimizerWorker();
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      const job = pending.get(msg.id);
      if (!job) return;
      pending.delete(msg.id);
      if (msg.ok) job.resolve(msg.result);
      else job.reject(new Error(msg.error));
    };
    worker.onerror = () => disableWorker(new Error('Worker crashed'));
    return worker;
  } catch {
    disableWorker();
    return null;
  }
}

function disableWorker(err?: Error) {
  disabled = true;
  worker?.terminate();
  worker = null;
  if (err) for (const job of pending.values()) job.reject(err);
  pending.clear();
}

/** Punto de entrada usado por toJpeg. Worker-first, fallback a main thread. */
export async function runEncode(payload: EncodePayload): Promise<OptimizeResult> {
  const w = getWorker();
  if (!w) return encodeWeb(payload);            // fallback transparente

  try {
    return await new Promise<OptimizeResult>((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      w.postMessage({ id, payload });
    });
  } catch {
    // Primer fallo del worker -> apaga y reintenta en main thread esta vez.
    disableWorker();
    return encodeWeb(payload);
  }
}
```

> **Claves de diseño:** lazy (`getWorker` solo en runtime, nunca al importar) = SSR-safe. `disabled`
> recuerda el fallo y no reintenta crear worker toda la sesión. La correlación por `id` permite
> múltiples jobs en vuelo resolviendo cada Promise correcta.

### 3.4 MODIFICAR — `lib/image-processor-web.ts`
Queda mínimo: arma el payload y delega.

```ts
import { ImageProcessor } from './image-processor.js';
import { runEncode } from './worker-client.js';
import type { OptimizeResult } from './types.js';

export class ImageProcessorWeb extends ImageProcessor<File | Blob, OptimizeResult> {
  async toJpeg(quality: number): Promise<OptimizeResult> {
    return runEncode({
      file: this.file,
      targetWidth: this.targetWidth,
      ops: this.ops,
      quality,
    });
  }
}

export const image = (file: File | Blob) => new ImageProcessorWeb(file);
```

> Para esto, `file`, `targetWidth` y `ops` en la clase base deben ser accesibles desde aquí (hoy son
> `protected` -> ok, misma jerarquía). Verifica visibilidad al refactorizar.

### 3.5 `lib/main.ts` — sin cambios funcionales
Sigue exportando `image` y `processImage`. (El `processImage` de bajo nivel se mantiene para quien
lo use directo.)

---

## 4. Build / empaquetado (lo más delicado)

### 4.1 Tipos del import `?worker&inline`
`lib/vite-env.d.ts` ya referencia los tipos de Vite (`/// <reference types="vite/client" />`).
Confirma que ahí estén, porque `?worker&inline` necesita esa declaración para que TS no marque error
en el import del worker.

### 4.2 `vite.config.ts` — añadir bloque `worker`
Por defecto Vite puede generar el worker inline como IIFE (clásico), que es lo más compatible para
blob workers. Pero como nuestro worker usa ESM y arrastra el WASM, conviene ser explícito:

```ts
export default defineConfig({
  build: { lib: { /* ...igual... */ } },
  worker: {
    format: 'es',          // o 'iife' si el blob ES da problemas en Safari
    rollupOptions: {},
  },
  plugins: [ dts({ /* ...igual... */ }) ],
});
```

> **Decisión a validar empíricamente:** algunos navegadores no aceptan **module workers desde blob
> URL**. Si al probar en Safari el worker no arranca, cambia `worker.format` a `'iife'`. Por eso este
> punto se **verifica con el dist real**, no se asume.

### 4.3 Verificación del `dist` (criterio de aceptación del empaquetado)
Tras `pnpm build` en el paquete:
1. Abre `dist/beautiful-image.js` y confirma que aparece un **blob worker inline** (un
   `new Worker(URL.createObjectURL(new Blob([...])))` o un data URL) y **no** una referencia a un
   archivo `.worker.js` externo.
2. Confirma que `dist/beautiful-image.node.*` **no** contiene `OffscreenCanvas`, `Worker`, ni el
   worker (el entry node no debe arrastrarlo).
3. Nota el tamaño: deberías ver ~2x el WASM. Si sorprende, es la copia esperada (seccion 1 Decisión 4).

---

## 5. SSR / consumo desde Astro
- El website consume el **dist** de la librería, no el fuente. El `?worker&inline` se resuelve en el
  build **de la librería**; el consumidor solo ve `new Worker(blob)`. **No** necesita plugin de
  worker.
- Como `getWorker()` es perezoso, importar la librería durante el SSR/build de Astro **no** instancia
  ningún worker. Seguro.
- Tras publicar la versión nueva de la librería, en el website basta `pnpm update beautiful-image`
  (o re-`pnpm install` del `file:` link) y un hard refresh.

---

## 6. Trade-offs aceptados y trabajo futuro
- **+~600 KB de bundle** (WASM duplicado en el blob del worker). Aceptable para desbloquear el hilo
  principal.
- **Optimización futura (no ahora):** cargar el WASM del **fallback** por `import()` dinámico para que
  la mayoría (que sí usa worker) no descargue la segunda copia. Se pospone: en modo `lib` el
  code-splitting genera chunks que complican el "un solo archivo". *Hacerlo funcionar primero, achicar
  después.*
- **Más allá:** WASM threads (paralelismo real) requiere headers COOP/COEP y aislamiento cross-origin
  -> carga de despliegue para el consumidor. Fuera de alcance.

---

## 7. Tests y verificación
- **Tests node existentes:** no se rompen — ejercitan el path node, que no tocamos. El path web no
  corre en `environment: 'node'` (no hay `OffscreenCanvas`/`Worker`).
- **Path web:** difícil de unit-testear en node (ni jsdom da `OffscreenCanvas`). Recomendación:
  - Verificación **manual** en el playground: imagen grande, arrastra sliders rápido -> la UI debe
    seguir respondiendo (el comparador se arrastra fluido mientras procesa).
  - Opcional a futuro: vitest en **browser mode** o Playwright para una prueba de humo del worker. No
    bloquea este cambio.
- **Prueba del fallback:** en DevTools, simula falta de worker (o fuerza `disabled = true`
  temporalmente) y confirma que sigue optimizando (más lento, como hoy).

---

## 8. Checklist de implementación (orden sugerido)
1. `lib/worker-protocol.ts` — tipos del contrato.
2. `lib/encode-web.ts` — extraer el core desde el `toJpeg` actual (con `ensureInit`).
3. `lib/optimizer.worker.ts` — script del worker.
4. `lib/worker-client.ts` — singleton + correlación + fallback.
5. `lib/image-processor-web.ts` — adelgazar `toJpeg` para delegar en `runEncode`.
6. `vite.config.ts` — bloque `worker`; revisar `vite-env.d.ts`.
7. `pnpm build` -> **verificar el dist** (seccion 4.3).
8. Probar en el playground (fluido) y forzar fallback (funciona).
9. Bump de versión + re-link/instalar en el website.
