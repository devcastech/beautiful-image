import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { image } from "beautiful-image/node"
import path from "node:path"

// sam local invoke ImageProcessorFunction -e events/s3-put.json \
//   --env-vars '{"ImageProcessorFunction":{"SOURCE_BUCKET":"my-raw-images","DEST_BUCKET":"my-processed-images"}}'

const SOURCE_BUCKET = process.env.SOURCE_BUCKET!
const DEST_BUCKET = process.env.DEST_BUCKET!

const s3 = new S3Client({})

const VARIANTS = [
  { folder: "optimized",  width: 800, quality: 80 },
  { folder: "thumbnails", width: 200, quality: 80 },
] as const

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"])

export const handler = async (event: AWSLambda.S3Event): Promise<void> => {
  for (const record of event.Records) {
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "))

    const ext = path.extname(key).toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      console.log(`Skipping unsupported file type: ${key}`)
      continue
    }

    const t0 = performance.now()
    console.log(`Processing: ${key}`)

    let input: Buffer
    try {
      const t1 = performance.now()
      const { Body } = await s3.send(
        new GetObjectCommand({ Bucket: SOURCE_BUCKET, Key: key })
      )
      if (!Body) {
        console.error(`Empty body for key: ${key}`)
        continue
      }
      input = Buffer.from(await Body.transformToByteArray())
      console.log(`[timer] download: ${(performance.now() - t1).toFixed(0)}ms ${input.length}B`)
    } catch (err) {
      console.error(`Failed to download ${key}:`, err)
      continue
    }

    const filename = path.parse(key).name

    for (const { folder, width, quality } of VARIANTS) {
      const tp = performance.now()
      let result: Awaited<ReturnType<ReturnType<typeof image>["toJpeg"]>>
      try {
        result = await image(input).resize(width).toJpeg(quality)
      } catch (err) {
        console.error(`Failed to process variant ${folder} for ${key}:`, err)
        continue
      }
      console.log(`[timer] wasm ${folder} (${width}px): ${(performance.now() - tp).toFixed(0)}ms`)

      const destKey = `${folder}/${filename}.jpg`
      const tu = performance.now()
      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: DEST_BUCKET,
            Key: destKey,
            Body: result.data,
            ContentType: "image/jpeg",
          })
        )
      } catch (err) {
        console.error(`Failed to upload ${destKey}:`, err)
        continue
      }
      console.log(`[timer] upload ${destKey}: ${(performance.now() - tu).toFixed(0)}ms`)

      console.log(
        `Saved ${destKey} - ${result.originalSize}B → ${result.optimizedSize}B (${Math.round(result.compressionRatio * 100)}% smaller)`
      )
    }

    console.log(`[timer] total: ${(performance.now() - t0).toFixed(0)}ms`)
  }
}
