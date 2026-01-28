import './style.css'
import { image } from 'beautiful-image'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <h1>Beautiful Image</h1>

    <div class="panels">
      <div class="panel">
        <h2>Compression</h2>
        <div class="control">
          <label>Width <span id="width-value">1000</span>px</label>
          <input type="range" id="width" min="100" max="2000" step="50" value="1000" />
        </div>
        <div class="control">
          <label>Quality <span id="quality-value">75</span>%</label>
          <input type="range" id="quality" min="1" max="100" value="75" />
        </div>
      </div>

      <div class="panel">
        <h2>Filters</h2>
        <div class="controls-grid">
          <div class="control">
            <label>Sharpen <span id="sharpen-value">0</span></label>
            <input type="range" id="sharpen" min="0" max="5" step="0.5" value="0" />
          </div>
          <div class="control">
            <label>Blur <span id="blur-value">0</span></label>
            <input type="range" id="blur" min="0" max="10" step="0.5" value="0" />
          </div>
          <div class="control">
            <label>Brightness <span id="brightness-value">0</span></label>
            <input type="range" id="brightness" min="-100" max="100" value="0" />
          </div>
          <div class="control">
            <label>Contrast <span id="contrast-value">0</span></label>
            <input type="range" id="contrast" min="-100" max="100" value="0" />
          </div>
          <div class="control">
            <label>Hue <span id="hue-value">0</span>°</label>
            <input type="range" id="hue" min="-180" max="180" value="0" />
          </div>
          <div class="checkboxes">
            <label class="checkbox"><input type="checkbox" id="grayscale" /> Grayscale</label>
            <label class="checkbox"><input type="checkbox" id="invert" /> Invert</label>
          </div>
        </div>
      </div>
    </div>

    <div class="upload-area">
      <input type="file" id="upload" accept="image/*" />
    </div>

    <p id="status"></p>

    <div class="results">
      <div class="result-card">
        <div class="card-header">
          <span>Original</span>
          <span class="size-badge" id="original-size"></span>
        </div>
        <img id="original" />
      </div>
      <div class="arrow">→</div>
      <div class="result-card result">
        <div class="card-header">
          <span>Result</span>
          <span class="size-badge" id="result-size"></span>
        </div>
        <img id="result" />
      </div>
    </div>

    <button id="download" class="download-btn" disabled>Download</button>
  </div>
`

function run() {
  const status = document.getElementById('status')!
  const input = document.getElementById('upload') as HTMLInputElement

  const quality = document.getElementById('quality') as HTMLInputElement
  const width = document.getElementById('width') as HTMLInputElement
  const sharpen = document.getElementById('sharpen') as HTMLInputElement
  const blur = document.getElementById('blur') as HTMLInputElement
  const brightness = document.getElementById('brightness') as HTMLInputElement
  const contrast = document.getElementById('contrast') as HTMLInputElement
  const hue = document.getElementById('hue') as HTMLInputElement
  const grayscale = document.getElementById('grayscale') as HTMLInputElement
  const invert = document.getElementById('invert') as HTMLInputElement

  const qualityValue = document.getElementById('quality-value')!
  const widthValue = document.getElementById('width-value')!
  const sharpenValue = document.getElementById('sharpen-value')!
  const blurValue = document.getElementById('blur-value')!
  const brightnessValue = document.getElementById('brightness-value')!
  const contrastValue = document.getElementById('contrast-value')!
  const hueValue = document.getElementById('hue-value')!

  const imgOriginal = document.getElementById('original') as HTMLImageElement
  const imgResult = document.getElementById('result') as HTMLImageElement
  const originalSize = document.getElementById('original-size')!
  const resultSize = document.getElementById('result-size')!
  const downloadBtn = document.getElementById('download') as HTMLButtonElement

  let resultBlob: Blob | null = null

  downloadBtn.addEventListener('click', () => {
    if (!resultBlob) return
    const url = URL.createObjectURL(resultBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'beautiful-image.jpg'
    a.click()
    URL.revokeObjectURL(url)
  })

  quality.addEventListener('input', () => qualityValue.textContent = quality.value)
  width.addEventListener('input', () => widthValue.textContent = width.value)
  sharpen.addEventListener('input', () => sharpenValue.textContent = sharpen.value)
  blur.addEventListener('input', () => blurValue.textContent = blur.value)
  brightness.addEventListener('input', () => brightnessValue.textContent = brightness.value)
  contrast.addEventListener('input', () => contrastValue.textContent = contrast.value)
  hue.addEventListener('input', () => hueValue.textContent = hue.value)

  let currentFile: File | null = null

  input.addEventListener('change', async (e) => {
    const target = e.target as HTMLInputElement
    currentFile = target.files?.[0] || null
    if (currentFile) await processImage()
  })

  const controls = [quality, width, sharpen, blur, brightness, contrast, hue, grayscale, invert]
  controls.forEach(ctrl => ctrl.addEventListener('change', () => currentFile && processImage()))

  async function processImage() {
    if (!currentFile) return

    try {
      imgOriginal.src = URL.createObjectURL(currentFile)
      originalSize.textContent = formatSize(currentFile.size)

      status.textContent = 'Processing...'

      let processor = image(currentFile).resize(parseInt(width.value))

      if (parseFloat(sharpen.value) > 0) processor = processor.sharpen(parseFloat(sharpen.value))
      if (parseFloat(blur.value) > 0) processor = processor.blur(parseFloat(blur.value))
      if (parseInt(brightness.value) !== 0) processor = processor.brightness(parseInt(brightness.value))
      if (parseInt(contrast.value) !== 0) processor = processor.contrast(parseFloat(contrast.value))
      if (parseInt(hue.value) !== 0) processor = processor.hueRotate(parseInt(hue.value))
      if (grayscale.checked) processor = processor.grayscale()
      if (invert.checked) processor = processor.invert()

      const result = await processor.toJpeg(parseInt(quality.value))
      resultBlob = result.blob
      imgResult.src = URL.createObjectURL(result.blob)

      const reduction = ((1 - result.optimizedSize / currentFile.size) * 100).toFixed(0)
      resultSize.textContent = `${formatSize(result.optimizedSize)} (-${reduction}%)`

      downloadBtn.disabled = false
      status.textContent = ''
    } catch (error) {
      status.textContent = `Error: ${error}`
      console.error(error)
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }
}

run()
