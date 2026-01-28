export interface OptimizeResult {
  blob: Blob
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  width: number
  height: number
}
