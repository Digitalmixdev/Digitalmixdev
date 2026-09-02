export interface ColorData {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  hsv: { h: number; s: number; v: number }
  cmyk: { c: number; m: number; y: number; k: number }
  percentage: number
  name: string
  luminance: number
  wcagVsWhite: number
  wcagVsBlack: number
  contrastOnWhite: number
  contrastOnBlack: number
  isDark: boolean
  x?: number // percentage x on canvas (0..100)
  y?: number // percentage y on canvas (0..100)
  locked?: boolean
}

export interface PaletteResult {
  dominant: ColorData[]
  vibrant?: ColorData[]
  muted?: ColorData[]
  light?: ColorData[]
  dark?: ColorData[]
  pastel?: ColorData[]
  fullSpectrum?: ColorData[]
  [key: string]: ColorData[] | undefined
}

export type ExtractionAlgorithm = 'kmeans' | 'mediancut' | 'vibrant' | 'histogram'

export interface ExtractionOptions {
  count?: number
  algorithm?: ExtractionAlgorithm
  ignoreWhite?: boolean
  ignoreBlack?: boolean
  ignoreTransparent?: boolean
  region?: { x: number; y: number; width: number; height: number } // relative 0..1
  minColorDistance?: number // Delta E threshold
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '')
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('')
  }
  const num = parseInt(clean, 16)
  if (isNaN(num)) return { r: 0, g: 0, b: 0 }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const rsRGB = r / 255
  const gsRGB = g / 255
  const bsRGB = b / 255

  const R = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
  const G = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
  const B = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

export function getColorName(h: number, s: number, l: number): string {
  if (l < 6) return 'Obsidian Black'
  if (l > 95 && s < 8) return 'Pure White'
  if (s < 10) {
    if (l < 25) return 'Charcoal Dark'
    if (l < 55) return 'Slate Gray'
    if (l < 85) return 'Soft Silver'
    return 'Pearl White'
  }

  if (h >= 345 || h < 12) {
    if (l < 30) return 'Deep Crimson'
    if (l > 75) return 'Blush Pink'
    if (s > 70) return 'Vibrant Red'
    return 'Coral Red'
  }
  if (h >= 12 && h < 38) {
    if (l < 30) return 'Burnt Sienna'
    if (l > 75) return 'Peach Cream'
    if (s > 70) return 'Flame Orange'
    return 'Warm Terracotta'
  }
  if (h >= 38 && h < 68) {
    if (l < 30) return 'Dark Ochre'
    if (l > 75) return 'Pale Sunrise'
    if (s > 70) return 'Golden Yellow'
    return 'Warm Amber'
  }
  if (h >= 68 && h < 155) {
    if (l < 30) return 'Forest Pine'
    if (l > 75) return 'Mint Pastelle'
    if (s > 70) return 'Emerald Green'
    return 'Sage Mint'
  }
  if (h >= 155 && h < 195) {
    if (l < 30) return 'Deep Teal'
    if (l > 75) return 'Ice Cyan'
    if (s > 70) return 'Vibrant Aqua'
    return 'Ocean Turquoise'
  }
  if (h >= 195 && h < 260) {
    if (l < 30) return 'Navy Midnight'
    if (l > 75) return 'Soft Sky Blue'
    if (s > 70) return 'Royal Blue'
    return 'Cerulean Blue'
  }
  if (h >= 260 && h < 315) {
    if (l < 30) return 'Deep Violet'
    if (l > 75) return 'Lavender Mist'
    if (s > 70) return 'Electric Purple'
    return 'Amethyst Purple'
  }
  if (h >= 315 && h < 345) {
    if (l < 30) return 'Dark Plum'
    if (l > 75) return 'Orchid Blossom'
    if (s > 70) return 'Hot Magenta'
    return 'Rose Berry'
  }
  return 'Custom Tone'
}

export function createColorData(
  r: number,
  g: number,
  b: number,
  percentage = 0,
  x?: number,
  y?: number
): ColorData {
  r = Math.max(0, Math.min(255, Math.round(r)))
  g = Math.max(0, Math.min(255, Math.round(g)))
  b = Math.max(0, Math.min(255, Math.round(b)))

  const hex = rgbToHex(r, g, b)

  // HSL
  const rs = r / 255
  const gs = g / 255
  const bs = b / 255
  const max = Math.max(rs, gs, bs)
  const min = Math.min(rs, gs, bs)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rs:
        h = (gs - bs) / d + (gs < bs ? 6 : 0)
        break
      case gs:
        h = (bs - rs) / d + 2
        break
      case bs:
        h = (rs - gs) / d + 4
        break
    }
    h /= 6
  }

  const hDeg = Math.round(h * 360)
  const sPerc = Math.round(s * 100)
  const lPerc = Math.round(l * 100)

  // HSV
  const v = max
  const sHsv = max === 0 ? 0 : (max - min) / max
  const hsvS = Math.round(sHsv * 100)
  const hsvV = Math.round(v * 100)

  // CMYK
  const k = 1 - Math.max(rs, gs, bs)
  const c = k === 1 ? 0 : Math.round(((1 - rs - k) / (1 - k)) * 100)
  const m = k === 1 ? 0 : Math.round(((1 - gs - k) / (1 - k)) * 100)
  const yC = k === 1 ? 0 : Math.round(((1 - bs - k) / (1 - k)) * 100)
  const kPerc = Math.round(k * 100)

  // Luminance & WCAG
  const luminance = getRelativeLuminance(r, g, b)
  const wcagVsWhite = Number(((1 + 0.05) / (luminance + 0.05)).toFixed(2))
  const wcagVsBlack = Number(((luminance + 0.05) / (0 + 0.05)).toFixed(2))
  const isDark = luminance < 0.45

  const name = getColorName(hDeg, sPerc, lPerc)

  return {
    hex,
    rgb: { r, g, b },
    hsl: { h: hDeg, s: sPerc, l: lPerc },
    hsv: { h: hDeg, s: hsvS, v: hsvV },
    cmyk: { c: Math.max(0, c), m: Math.max(0, m), y: Math.max(0, yC), k: Math.max(0, kPerc) },
    percentage: Number(percentage.toFixed(1)),
    name,
    luminance,
    wcagVsWhite,
    wcagVsBlack,
    contrastOnWhite: wcagVsWhite,
    contrastOnBlack: wcagVsBlack,
    isDark,
    x,
    y,
  }
}

// Distance between 2 RGB colors (Euclidean in RGB space)
export function colorDistance(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number }
): number {
  const dr = c1.r - c2.r
  const dg = c1.g - c2.g
  const db = c1.b - c2.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

// Color extraction algorithms
export async function extractPaletteFromImage(
  imageInput: HTMLImageElement | HTMLCanvasElement,
  options: ExtractionOptions = {}
): Promise<PaletteResult> {
  const count = options.count || 8
  const algo = options.algorithm || 'kmeans'

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  const maxDimension = 200
  let width = imageInput.width || maxDimension
  let height = imageInput.height || maxDimension

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width)
      width = maxDimension
    } else {
      width = Math.round((width * maxDimension) / height)
      height = maxDimension
    }
  }

  canvas.width = Math.max(1, width)
  canvas.height = Math.max(1, height)

  if (!ctx) {
    const fallback = createColorData(50, 50, 50, 100)
    return { dominant: [fallback] }
  }

  ctx.drawImage(imageInput, 0, 0, canvas.width, canvas.height)

  let startX = 0
  let startY = 0
  let cropW = canvas.width
  let cropH = canvas.height

  if (options.region) {
    startX = Math.max(0, Math.floor(options.region.x * canvas.width))
    startY = Math.max(0, Math.floor(options.region.y * canvas.height))
    cropW = Math.max(1, Math.floor(options.region.width * canvas.width))
    cropH = Math.max(1, Math.floor(options.region.height * canvas.height))
  }

  const imgData = ctx.getImageData(startX, startY, cropW, cropH).data

  // Collect valid pixels
  const pixels: { r: number; g: number; b: number; x: number; y: number }[] = []
  const step = 2

  for (let py = 0; py < cropH; py += step) {
    for (let px = 0; px < cropW; px += step) {
      const idx = (py * cropW + px) * 4
      const a = imgData[idx + 3]

      if (options.ignoreTransparent && a < 128) continue
      if (a < 50) continue

      const r = imgData[idx]
      const g = imgData[idx + 1]
      const b = imgData[idx + 2]

      // Ignore white / black option
      if (options.ignoreWhite && r > 240 && g > 240 && b > 240) continue
      if (options.ignoreBlack && r < 15 && g < 15 && b < 15) continue

      const relX = ((startX + px) / canvas.width) * 100
      const relY = ((startY + py) / canvas.height) * 100

      pixels.push({ r, g, b, x: relX, y: relY })
    }
  }

  if (pixels.length === 0) {
    const fallback = createColorData(50, 50, 50, 100, 50, 50)
    return { dominant: [fallback] }
  }

  let extractedColors: { r: number; g: number; b: number; count: number; x: number; y: number }[] = []

  if (algo === 'kmeans') {
    extractedColors = runKMeans(pixels, count)
  } else if (algo === 'mediancut') {
    extractedColors = runMedianCut(pixels, count)
  } else {
    extractedColors = runHistogramQuantization(pixels, count)
  }

  // Deduplicate similar colors based on minColorDistance if set
  const minDistance = options.minColorDistance || 18
  const filtered: typeof extractedColors = []

  for (const c of extractedColors) {
    const isTooClose = filtered.some((f) => colorDistance(f, c) < minDistance)
    if (!isTooClose || filtered.length < Math.min(3, count)) {
      filtered.push(c)
    }
  }

  const totalPixelCount = pixels.length || 1
  const dominantColors: ColorData[] = filtered.map((c) => {
    const perc = (c.count / totalPixelCount) * 100
    return createColorData(c.r, c.g, c.b, perc, c.x, c.y)
  })

  if (dominantColors.length === 0) {
    dominantColors.push(createColorData(30, 41, 59, 100, 50, 50))
  }

  // Filter categorizations
  const vibrant = dominantColors.filter((c) => c.hsl.s >= 38 && c.hsl.l >= 28 && c.hsl.l <= 78)
  const muted = dominantColors.filter((c) => c.hsl.s < 42 || c.hsl.l < 25 || c.hsl.l > 82)
  const light = dominantColors.filter((c) => c.hsl.l >= 62)
  const dark = dominantColors.filter((c) => c.hsl.l <= 38)
  const pastel = dominantColors.filter((c) => c.hsl.l >= 68 && c.hsl.s <= 70)

  return {
    dominant: dominantColors,
    vibrant: vibrant.length > 0 ? vibrant : dominantColors.slice(0, 4),
    muted: muted.length > 0 ? muted : dominantColors.slice(0, 4),
    light: light.length > 0 ? light : dominantColors.filter((c) => c.hsl.l > 50),
    pastel: pastel.length > 0 ? pastel : dominantColors.filter((c) => c.hsl.l > 55),
    dark: dark.length > 0 ? dark : dominantColors.filter((c) => c.isDark),
    fullSpectrum: [...dominantColors].sort((a, b) => a.hsl.h - b.hsl.h),
  }
}

// K-Means Clustering Algorithm
function runKMeans(
  pixels: { r: number; g: number; b: number; x: number; y: number }[],
  k: number
): { r: number; g: number; b: number; count: number; x: number; y: number }[] {
  if (pixels.length <= k) {
    return pixels.map((p) => ({ r: p.r, g: p.g, b: p.b, count: 1, x: p.x, y: p.y }))
  }

  // Initialize centroids evenly spaced across pixel list
  let centroids = []
  const step = Math.floor(pixels.length / k)
  for (let i = 0; i < k; i++) {
    const p = pixels[Math.min(pixels.length - 1, i * step)]
    centroids.push({ r: p.r, g: p.g, b: p.b, count: 0, sumR: 0, sumG: 0, sumB: 0, sumX: 0, sumY: 0 })
  }

  const maxIterations = 8
  for (let iter = 0; iter < maxIterations; iter++) {
    // Reset sums
    centroids.forEach((c) => {
      c.count = 0
      c.sumR = 0
      c.sumG = 0
      c.sumB = 0
      c.sumX = 0
      c.sumY = 0
    })

    // Assign pixels to closest centroid
    for (const p of pixels) {
      let minDist = Infinity
      let closestIdx = 0
      for (let cIdx = 0; cIdx < centroids.length; cIdx++) {
        const dist = colorDistance(p, centroids[cIdx])
        if (dist < minDist) {
          minDist = dist
          closestIdx = cIdx
        }
      }
      const target = centroids[closestIdx]
      target.count++
      target.sumR += p.r
      target.sumG += p.g
      target.sumB += p.b
      target.sumX += p.x
      target.sumY += p.y
    }

    // Recalculate centroid values
    for (const c of centroids) {
      if (c.count > 0) {
        c.r = Math.round(c.sumR / c.count)
        c.g = Math.round(c.sumG / c.count)
        c.b = Math.round(c.sumB / c.count)
      }
    }
  }

  return centroids
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((c) => ({
      r: c.r,
      g: c.g,
      b: c.b,
      count: c.count,
      x: c.count > 0 ? c.sumX / c.count : 50,
      y: c.count > 0 ? c.sumY / c.count : 50,
    }))
}

// Median Cut Algorithm
function runMedianCut(
  pixels: { r: number; g: number; b: number; x: number; y: number }[],
  maxColors: number
): { r: number; g: number; b: number; count: number; x: number; y: number }[] {
  let boxes = [pixels]

  while (boxes.length < maxColors) {
    let biggestBoxIdx = -1
    let maxRange = -1

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i]
      if (box.length <= 1) continue

      let minR = 255, maxR = 0
      let minG = 255, maxG = 0
      let minB = 255, maxB = 0

      for (const p of box) {
        if (p.r < minR) minR = p.r
        if (p.r > maxR) maxR = p.r
        if (p.g < minG) minG = p.g
        if (p.g > maxG) maxG = p.g
        if (p.b < minB) minB = p.b
        if (p.b > maxB) maxB = p.b
      }

      const rangeR = maxR - minR
      const rangeG = maxG - minG
      const rangeB = maxB - minB
      const largestRange = Math.max(rangeR, rangeG, rangeB)

      if (largestRange > maxRange) {
        maxRange = largestRange
        biggestBoxIdx = i
      }
    }

    if (biggestBoxIdx === -1 || maxRange <= 0) break

    const targetBox = boxes[biggestBoxIdx]
    let minR = 255, maxR = 0
    let minG = 255, maxG = 0
    let minB = 255, maxB = 0

    for (const p of targetBox) {
      if (p.r < minR) minR = p.r
      if (p.r > maxR) maxR = p.r
      if (p.g < minG) minG = p.g
      if (p.g > maxG) maxG = p.g
      if (p.b < minB) minB = p.b
      if (p.b > maxB) maxB = p.b
    }

    const rangeR = maxR - minR
    const rangeG = maxG - minG
    const rangeB = maxB - minB

    let channel: 'r' | 'g' | 'b' = 'r'
    if (rangeG >= rangeR && rangeG >= rangeB) channel = 'g'
    if (rangeB >= rangeR && rangeB >= rangeG) channel = 'b'

    targetBox.sort((a, b) => a[channel] - b[channel])

    const median = Math.floor(targetBox.length / 2)
    const box1 = targetBox.slice(0, median)
    const box2 = targetBox.slice(median)

    boxes.splice(biggestBoxIdx, 1, box1, box2)
  }

  return boxes.map((box) => {
    let sumR = 0, sumG = 0, sumB = 0, sumX = 0, sumY = 0
    for (const p of box) {
      sumR += p.r
      sumG += p.g
      sumB += p.b
      sumX += p.x
      sumY += p.y
    }
    const len = box.length || 1
    return {
      r: Math.round(sumR / len),
      g: Math.round(sumG / len),
      b: Math.round(sumB / len),
      count: len,
      x: sumX / len,
      y: sumY / len,
    }
  }).sort((a, b) => b.count - a.count)
}

// Histogram Quantization Algorithm
function runHistogramQuantization(
  pixels: { r: number; g: number; b: number; x: number; y: number }[],
  count: number
): { r: number; g: number; b: number; count: number; x: number; y: number }[] {
  const buckets: { [key: string]: { rSum: number; gSum: number; bSum: number; xSum: number; ySum: number; count: number } } = {}

  const quantum = 20
  for (const p of pixels) {
    const qR = Math.round(p.r / quantum) * quantum
    const qG = Math.round(p.g / quantum) * quantum
    const qB = Math.round(p.b / quantum) * quantum
    const key = `${qR},${qG},${qB}`

    if (!buckets[key]) {
      buckets[key] = { rSum: 0, gSum: 0, bSum: 0, xSum: 0, ySum: 0, count: 0 }
    }
    buckets[key].rSum += p.r
    buckets[key].gSum += p.g
    buckets[key].bSum += p.b
    buckets[key].xSum += p.x
    buckets[key].ySum += p.y
    buckets[key].count++
  }

  return Object.values(buckets)
    .sort((a, b) => b.count - a.count)
    .slice(0, count)
    .map((b) => ({
      r: Math.round(b.rSum / b.count),
      g: Math.round(b.gSum / b.count),
      b: Math.round(b.bSum / b.count),
      count: b.count,
      x: b.xSum / b.count,
      y: b.ySum / b.count,
    }))
}

// Color Harmonies
export function getColorHarmonies(color: ColorData): {
  complementary: ColorData
  splitComplementary: [ColorData, ColorData]
  analogous: [ColorData, ColorData]
  triadic: [ColorData, ColorData]
  tetradic: [ColorData, ColorData, ColorData]
  monochromatic: ColorData[]
  shadesAndTints: ColorData[]
} {
  const { h, s, l } = color.hsl

  const hslToRgb = (hDeg: number, sPerc: number, lPerc: number) => {
    let h = (hDeg % 360) / 360
    if (h < 0) h += 1
    const s = Math.max(0, Math.min(100, sPerc)) / 100
    const l = Math.max(0, Math.min(100, lPerc)) / 100

    let r: number, g: number, b: number
    if (s === 0) {
      r = g = b = l
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
  }

  const makeColor = (hDeg: number, sPerc: number, lPerc: number) => {
    const rgb = hslToRgb(hDeg, sPerc, lPerc)
    return createColorData(rgb.r, rgb.g, rgb.b)
  }

  // Complementary (+180)
  const complementary = makeColor(h + 180, s, l)

  // Split-Complementary (+150, +210)
  const splitComplementary: [ColorData, ColorData] = [
    makeColor(h + 150, s, l),
    makeColor(h + 210, s, l),
  ]

  // Analogous (-30, +30)
  const analogous: [ColorData, ColorData] = [
    makeColor(h - 30, s, l),
    makeColor(h + 30, s, l),
  ]

  // Triadic (+120, +240)
  const triadic: [ColorData, ColorData] = [
    makeColor(h + 120, s, l),
    makeColor(h + 240, s, l),
  ]

  // Tetradic (+90, +180, +270)
  const tetradic: [ColorData, ColorData, ColorData] = [
    makeColor(h + 90, s, l),
    makeColor(h + 180, s, l),
    makeColor(h + 270, s, l),
  ]

  // Monochromatic
  const monoSteps = [Math.max(10, l - 35), Math.max(15, l - 20), Math.min(85, l + 20), Math.min(95, l + 35)]
  const monochromatic = monoSteps.map((lStep) => makeColor(h, s, lStep))

  // Shades & Tints (5 steps)
  const shadesAndTints = [15, 30, 45, 60, 75, 90].map((lStep) => makeColor(h, s, lStep))

  return {
    complementary,
    splitComplementary,
    analogous,
    triadic,
    tetradic,
    monochromatic,
    shadesAndTints,
  }
}

// Colorblindness Simulation
export function simulateColorblindness(
  color: ColorData,
  type: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'
): ColorData {
  let { r, g, b } = color.rgb

  if (type === 'achromatopsia') {
    // Monochrome grayscale
    const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
    return createColorData(gray, gray, gray)
  }

  // Simplified LMS matrix transformation
  let simR = r, simG = g, simB = b

  if (type === 'protanopia') {
    simR = 0.56667 * r + 0.43333 * g + 0.0 * b
    simG = 0.55833 * r + 0.44167 * g + 0.0 * b
    simB = 0.0 * r + 0.24167 * g + 0.75833 * b
  } else if (type === 'deuteranopia') {
    simR = 0.625 * r + 0.375 * g + 0.0 * b
    simG = 0.7 * r + 0.3 * g + 0.0 * b
    simB = 0.0 * r + 0.3 * g + 0.7 * b
  } else if (type === 'tritanopia') {
    simR = 0.95 * r + 0.05 * g + 0.0 * b
    simG = 0.0 * r + 0.43333 * g + 0.56667 * b
    simB = 0.0 * r + 0.475 * g + 0.525 * b
  }

  return createColorData(simR, simG, simB)
}

// Code Exporters
function getColorsList(colors: ColorData[] | PaletteResult): ColorData[] {
  if (Array.isArray(colors)) return colors
  return colors.dominant || []
}

export function generateCssVariables(colorsInput: ColorData[] | PaletteResult): string {
  const colors = getColorsList(colorsInput)
  let css = ':root {\n'
  colors.forEach((c, idx) => {
    css += `  --color-palette-${idx + 1}: ${c.hex};\n`
    css += `  --color-palette-${idx + 1}-rgb: ${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b};\n`
    css += `  --color-palette-${idx + 1}-hsl: ${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%;\n`
  })
  css += '}'
  return css
}

export function generateTailwindConfig(colorsInput: ColorData[] | PaletteResult): string {
  const colors = getColorsList(colorsInput)
  const obj: { [key: string]: string } = {}
  colors.forEach((c, idx) => {
    const keyName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || `color-${idx + 1}`
    obj[`palette-${idx + 1}`] = c.hex
  })

  return `// Tailwind v3 config (tailwind.config.js)
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(obj, null, 6)}
    }
  }
}

/* Tailwind v4 theme block (globals.css) */
@theme {
${colors.map((c, idx) => `  --color-palette-${idx + 1}: ${c.hex};`).join('\n')}
}`
}

export function generateScssVariables(colorsInput: ColorData[] | PaletteResult): string {
  const colors = getColorsList(colorsInput)
  return colors.map((c, idx) => `$color-palette-${idx + 1}: ${c.hex}; // ${c.name}`).join('\n')
}

export function generateJsonPalette(colorsInput: ColorData[] | PaletteResult): string {
  const colors = getColorsList(colorsInput)
  return JSON.stringify(colors, null, 2)
}

export function generateHexList(colorsInput: ColorData[] | PaletteResult, separator = ', '): string {
  const colors = getColorsList(colorsInput)
  return colors.map((c) => c.hex).join(separator)
}

export async function generatePaletteCardPng(
  colors: ColorData[],
  title = 'Color Palette',
  subTitle = 'Extracted with DigitalMix Color Palette Studio'
): Promise<Blob> {
  const width = 1000
  const height = 560
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 2D context not supported')
  }

  // Draw Dark Card Background
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#0F172A')
  gradient.addColorStop(1, '#1E293B')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Top Header Card Branding
  ctx.fillStyle = '#F8FAFC'
  ctx.font = 'bold 28px sans-serif'
  ctx.fillText(title || 'Color Palette Studio', 48, 64)

  ctx.fillStyle = '#94A3B8'
  ctx.font = '15px sans-serif'
  ctx.fillText(subTitle, 48, 94)

  // Swatches Grid
  const count = colors.length || 1
  const padding = 48
  const startY = 130
  const availableWidth = width - padding * 2
  const swatchWidth = Math.floor((availableWidth - (count - 1) * 16) / count)
  const swatchHeight = 280

  colors.forEach((c, i) => {
    const x = padding + i * (swatchWidth + 16)

    // Swatch Box
    ctx.fillStyle = c.hex
    ctx.beginPath()
    if (ctx.roundRect) {
      ctx.roundRect(x, startY, swatchWidth, swatchHeight, 16)
    } else {
      ctx.fillRect(x, startY, swatchWidth, swatchHeight)
    }
    ctx.fill()

    // Inner White Accent Line
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 2
    ctx.stroke()

    // HEX Label underneath
    ctx.fillStyle = '#F8FAFC'
    ctx.font = 'bold 15px monospace'
    ctx.fillText(c.hex, x, startY + swatchHeight + 36)

    // Name Label underneath
    ctx.fillStyle = '#94A3B8'
    ctx.font = '12px sans-serif'
    const truncatedName = c.name.length > 14 ? c.name.substring(0, 12) + '..' : c.name
    ctx.fillText(truncatedName, x, startY + swatchHeight + 58)

    // RGB & Percentage
    if (c.percentage > 0) {
      ctx.fillStyle = '#64748B'
      ctx.font = '11px sans-serif'
      ctx.fillText(`${c.percentage}%`, x, startY + swatchHeight + 76)
    }
  })

  // Footer Branding
  ctx.fillStyle = '#475569'
  ctx.font = '12px sans-serif'
  ctx.fillText('100% Client-Side Extraction • DigitalMix Tools', width - 290, height - 24)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create Blob from canvas'))
    }, 'image/png')
  })
}
