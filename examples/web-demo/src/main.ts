import './style.css'
import { optimizeImage, ResizeMode } from 'beautiful-image'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
    <h1 style="font-family: system-ui; margin-bottom: 2.5rem; font-size: 2.5rem; color: #e5e7eb;">Beautiful Image Optimizer</h1>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
      <div>
        <label style="display: block; margin-bottom: 0.75rem; font-weight: 600; font-size: 1.05rem; color: #e5e7eb;">
          Quality: <span id="quality-value">75</span>%
        </label>
        <input
          type="range"
          id="quality"
          min="1"
          max="100"
          value="75"
          style="width: 100%; height: 6px; border-radius: 3px;"
        />
      </div>

      <div>
        <label style="display: block; margin-bottom: 0.75rem; font-weight: 600; font-size: 1.05rem; color: #e5e7eb;">
          Width: <span id="width-value">1000</span>px
        </label>
        <input
          type="range"
          id="width"
          min="100"
          max="2000"
          step="50"
          value="1000"
          style="width: 100%; height: 6px; border-radius: 3px;"
        />
      </div>

      <div>
        <label style="display: block; margin-bottom: 0.75rem; font-weight: 600; font-size: 1.05rem; color: #e5e7eb;">
          Resize Mode
        </label>
        <div style="display: flex; gap: 1.5rem; margin-top: 0.5rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: #e5e7eb;">
            <input type="radio" name="resize-mode" value="standard" style="cursor: pointer;" />
            <span>Standard</span>
          </label>
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: #e5e7eb;">
            <input type="radio" name="resize-mode" value="high" checked style="cursor: pointer;" />
            <span>High Quality</span>
          </label>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 2rem;">
      <input
        type="file"
        id="upload"
        accept="image/*"
        style="padding: 0.6rem; border-radius: 6px; background: #374151; color: #e5e7eb; border: 1px solid #4b5563;"
      />
    </div>

    <p id="status" style="font-family: monospace; color: #9ca3af; margin-bottom: 2rem; font-size: 1rem;"></p>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
      <div>
        <h3 id="original-title" style="margin-bottom: 1rem; font-size: 1.25rem; color: #e5e7eb;">Original</h3>
        <img
          id="original"
          style="max-width: 100%; border: 2px solid #3b82f6; display: none; border-radius: 8px;"
        />
      </div>
      <div>
        <h3 id="optimized-title" style="margin-bottom: 1rem; font-size: 1.25rem; color: #e5e7eb;">Optimized</h3>
        <img
          id="result"
          style="max-width: 100%; border: 2px solid #10b981; display: none; border-radius: 8px;"
        />
      </div>
    </div>
  </div>
`

function run() {
  const status = document.getElementById('status')!
  const input = document.getElementById('upload') as HTMLInputElement
  const quality = document.getElementById('quality') as HTMLInputElement
  const qualityValue = document.getElementById('quality-value')!
  const width = document.getElementById('width') as HTMLInputElement
  const widthValue = document.getElementById('width-value')!
  const imgResult = document.getElementById('result') as HTMLImageElement
  const imgOriginal = document.getElementById('original') as HTMLImageElement
  const originalTitle = document.getElementById('original-title')!
  const optimizedTitle = document.getElementById('optimized-title')!

  quality.addEventListener('input', () => {
    qualityValue.textContent = quality.value
  })

  width.addEventListener('input', () => {
    widthValue.textContent = width.value
  })

  input.addEventListener('change', async (e) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return


    try {
      status.textContent = 'Converting to arrayBuffer...'
      const arrayBuffer = await file.arrayBuffer()
      status.textContent = 'Converted...'
      const bytes = new Uint8Array(arrayBuffer)

      const resizeModeRadio = document.querySelector('input[name="resize-mode"]:checked') as HTMLInputElement
      const mode = resizeModeRadio?.value === 'high' ? ResizeMode.HighQuality : ResizeMode.Standard

      status.textContent = 'Optimizing...'
      const optimized = optimizeImage(
        bytes,
        parseInt(width.value),
        parseInt(quality.value),
        mode
      )
      status.textContent = 'Optimized!...'

      const percentReduction = ((1 - optimized.length / bytes.length) * 100).toFixed(1)
      const originalKB = (bytes.length / 1024).toFixed(1)
      const optimizedKB = (optimized.length / 1024).toFixed(1)

      status.textContent = `${percentReduction}% smaller`
      originalTitle.textContent = `Original - (${originalKB} KB)`
      optimizedTitle.textContent = `Optimized - (${optimizedKB} KB)`

      const blobOriginal = new Blob([bytes], { type: file.type })
      imgOriginal.src = URL.createObjectURL(blobOriginal)
      imgOriginal.style.display = 'block'

      const blobResult = new Blob([new Uint8Array(optimized)], { type: 'image/jpeg' })
      imgResult.src = URL.createObjectURL(blobResult)
      imgResult.style.display = 'block'
    } catch (error) {
      status.textContent = `Error: ${error}`
      console.error(error)
    }
  })
}

run()
