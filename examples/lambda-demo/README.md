# lambda-demo

Lambda function triggered by S3 uploads that generates two image variants (optimized and thumbnail) using `beautiful-image`.

## What it does

When an image is uploaded to the source bucket, the function:

1. Downloads the raw image from `SOURCE_BUCKET`
2. Generates two variants via the WASM pipeline:
   - `optimized/`: 800px wide, 80% JPEG quality
   - `thumbnails/`: 200px wide, 80% JPEG quality
3. Uploads both variants to `DEST_BUCKET`

## Prerequisites

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) configured with a `sandbox` profile (replace with your own profile)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Docker (required for `sam local invoke`)
- Node.js 22+

## Create the S3 buckets

The buckets must exist before deploying. Create them with:

```sh
aws s3 mb s3://beautiful-image-demo-raw-images --region us-east-1 --profile sandbox
aws s3 mb s3://beautiful-image-demo-processed-images --region us-east-1 --profile sandbox
```

Replace `b-images-raw-images` and `b-images-processed-images` with your actual bucket names, then update `samconfig.toml` accordingly.

## Install

```sh
pnpm install
```

## Local testing

Upload the included sample image to the source bucket:

```sh
aws s3 cp sample/sample.jpg s3://beautiful-image-demo-raw-images/sample/sample.jpg --profile sandbox
```

Then invoke the function locally (requires Docker):

```sh
sam local invoke ImageProcessorFunction \
  -e events/s3-put.json \
  --env-vars events/env.json \
  --profile sandbox
```

The event in `events/s3-put.json` references `sample/sample.jpg` in the source bucket.

## Deploy

```sh
sam build # requires esbuild installed globally
# or
pnpm sam:build # builds using esbuild installed locally

sam deploy --config-env sandbox
```

Invoke the deployed function directly with the sample event:

```sh
aws lambda invoke \
  --function-name ImageProcessorFunction-sandbox \
  --payload fileb://events/s3-put.json \
  --log-type Tail \
  --query 'LogResult' \
  --output text \
  --region us-east-1 \
  --profile sandbox \
  response.json | base64 -d
```

`--log-type Tail` returns the last 4KB of execution logs inline (the timer output will appear there). The function response is written to `response.json`.

After deploy, connect the S3 trigger manually (SAM does not manage existing bucket notifications):

```sh
aws s3api put-bucket-notification-configuration \
  --bucket beautiful-image-demo-raw-images \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [{
      "LambdaFunctionArn": "<ImageProcessorFunction ARN from stack outputs>",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {"Key": {"FilterRules": [{"Name": "suffix", "Value": ".jpg"}]}}
    }]
  }' \
  --profile sandbox
```

## beautiful-image vs Sharp

[Sharp](https://sharp.pixelplumbing.com/) is the standard for Node.js image processing and will outperform `beautiful-image` on raw speed, it delegates to libvips, a native C library with decades of CPU-specific optimizations that WASM cannot fully match.

`beautiful-image` does not try to compete on that front. Its value is **simplicity**: it does one thing well, resize and optimize images for the web, and covers the filters you actually need in that use case: sharpen, blur, brightness, contrast, grayscale, invert, and hue rotation. No sprawling API surface, no configuration rabbit holes.

That focus pays off on the operational side:

- **Artifact size**: Sharp pulls in libvips (~20MB compressed) plus architecture-specific native binaries. `beautiful-image`'s WASM binary is 469KB; the full package ~1.6MB.
- **Deploy complexity**: Sharp requires native binaries compiled for the exact Lambda runtime architecture (`linux/x64` or `linux/arm64`). Deploy the wrong binary and the function throws `Error: invalid ELF header` at runtime. The [official Sharp docs for Lambda](https://sharp.pixelplumbing.com/install/#aws-lambda) walk through the required platform flags, cross-compilation considerations, and symlink pitfalls, pnpm uses symlinks by default, which Lambda does not support, so you need extra steps to flatten them. The docs themselves suggest relying on community-maintained Lambda Layers as an easier alternative.
- **Portability**: `beautiful-image` is pure WASM. The same artifact runs on any Lambda architecture with no compilation step, no Lambda Layer, no platform flags, and no symlink concerns.

**`beautiful-image` is a lightweight, focused alternative**, not a replacement. If what you need is the full power of Sharp (compositing, SVG rendering, raw camera formats, color space conversion, advanced morphology), Sharp remains the right tool and nothing else comes close. But if your use case is resizing and optimizing images for the web with a handful of filters, `beautiful-image` gets you there with a fraction of the weight and none of the deploy friction.

## Considerations

**`@aws-sdk/client-s3` is marked external**
Lambda's Node.js 22 runtime includes AWS SDK v3 by default, so there is no need to bundle it. Marking it external keeps the artifact small.

**Output format is ESM (`.mjs`)**
The handler is bundled as ESM (`--format=esm`) to match `"type": "module"` in `package.json`, which is required for `beautiful-image/node` to resolve correctly.

**Supported input formats**
The handler validates extensions and only processes `.jpg`, `.jpeg`, `.png`, and `.webp` files. Other objects uploaded to the bucket are skipped silently.
