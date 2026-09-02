export interface ColorData {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  cmyk: { c: number; m: number; y: number; k: number }
  percentage: number
  name: string
  luminance: number
  wcagVsWhite: number
  wcagVsBlack: number
  contrastOnWhite: number
  contrastOnBlack: number
  isDark: boolean
}

export interface PaletteResult {
  dominant: ColorData[]
  vibrant?: ColorData[]
  muted?: ColorData[]
  light?: ColorData[]
  pastel?: ColorData[]
  dark?: ColorData[]
  [key: string]: ColorData[] | undefined
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
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

function getColorName(h: number, s: number, l: number): string {
  if (l < 8) return 'Obsidian Black'
  if (l > 94 && s < 10) return 'Pure White'
  if (s < 10) {
    if (l < 30) return 'Charcoal Dark'
    if (l < 70) return 'Slate Gray'
    return 'Soft Silver'
  }

  if (h >= 345 || h < 12) {
    if (l < 35) return 'Dark Crimson'
    if (s > 70) return 'Vibrant Red'
    return 'Rose Pink'
  }
  if (h >= 12 && h < 40) {
    if (l < 35) return 'Burnt Sienna'
    if (s > 70) return 'Warm Orange'
    return 'Coral Peach'
  }
  if (h >= 40 && h < 68) {
    if (l < 35) return 'Dark Ochre'
    if (s > 70) return 'Golden Yellow'
    return 'Soft Amber'
  }
  if (h >= 68 && h < 155) {
    if (l < 35) return 'Forest Green'
    if (s > 70) return 'Emerald Green'
    return 'Sage Mint'
  }
  if (h >= 155 && h < 195) {
    if (l < 35) return 'Deep Teal'
    if (s > 70) return 'Cyan Aqua'
    return 'Soft Turquoise'
  }
  if (h >= 195 && h < 265) {
    if (l < 35) return 'Navy Midnight'
    if (s > 70) return 'Royal Blue'
    return 'Sky Blue'
  }
  if (h >= 265 && h < 315) {
    if (l < 35) return 'Dark Violet'
    if (s > 70) return 'Electric Purple'
    return 'Lavender Mist'
  }
  if (h >= 315 && h < 345) {
    if (l < 35) return 'Deep Magenta'
    if (s > 70) return 'Hot Pink'
    return 'Blush Magenta'
  }
  return 'Custom Tone'
}

export function createColorData(r: number, g: number, b: number, percentage = 0): ColorData {
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

  // CMYK
  const k = 1 - Math.max(rs, gs, bs)
  const c = k === 1 ? 0 : Math.round(((1 - rs - k) / (1 - k)) * 100)
  const m = k === 1 ? 0 : Math.round(((1 - gs - k) / (1 - k)) * 100)
  const y = k === 1 ? 0 : Math.round(((1 - bs - k) / (1 - k)) * 100)
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
    cmyk: { c: Math.max(0, c), m: Math.max(0, m), y: Math.max(0, y), k: Math.max(0, kPerc) },
    percentage: Number(percentage.toFixed(1)),
    name,
    luminance,
    wcagVsWhite,
    wcagVsBlack,
    contrastOnWhite: wcagVsWhite,
    contrastOnBlack: wcagVsBlack,
    isDark,
  }
}

export async function extractPaletteFromImage(
  imageInput: HTMLImageElement | HTMLCanvasElement,
  count = 8
): Promise<PaletteResult> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  const maxDimension = 150
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

  canvas.width = width
  canvas.height = height

  if (!ctx) {
    const fallback = createColorData(50, 50, 50, 100)
    return { dominant: [fallback] }
  }

  ctx.drawImage(imageInput, 0, 0, width, height)
  const imgData = ctx.getImageData(0, 0, width, height).data

  // Simple k-means / color quantization
  const colorBuckets: { [key: string]: { r: number; g: number; b: number; count: number } } = {}
  let totalValidPixels = 0

  const step = 4
  for (let i = 0; i < imgData.length; i += 4 * step) {
    const a = imgData[i + 3]
    if (a < 128) continue // ignore transparent

    const r = imgData[i]
    const g = imgData[i + 1]
    const b = imgData[i + 2]

    // Quantize into 16-level buckets
    const qR = Math.round(r / 16) * 16
    const qG = Math.round(g / 16) * 16
    const qB = Math.round(b / 16) * 16

    const key = `${qR},${qG},${qB}`
    if (!colorBuckets[key]) {
      colorBuckets[key] = { r, g, b, count: 0 }
    }
    colorBuckets[key].count++
    totalValidPixels++
  }

  if (totalValidPixels === 0) {
    totalValidPixels = 1
  }

  const sortedBuckets = Object.values(colorBuckets).sort((a, b) => b.count - a.count)
  const selectedClusters = sortedBuckets.slice(0, count)

  const dominantColors: ColorData[] = selectedClusters.map((cluster) => {
    const perc = (cluster.count / totalValidPixels) * 100
    return createColorData(cluster.r, cluster.g, cluster.b, perc)
  })

  if (dominantColors.length === 0) {
    dominantColors.push(createColorData(30, 41, 59, 100))
  }

  // Derive vibrant, muted, light/pastel, and dark collections
  const vibrant = dominantColors.filter((c) => c.hsl.s >= 40 && c.hsl.l >= 30 && c.hsl.l <= 75)
  const muted = dominantColors.filter((c) => c.hsl.s < 45 || c.hsl.l < 25 || c.hsl.l > 80)
  const light = dominantColors.filter((c) => c.hsl.l >= 65)
  const dark = dominantColors.filter((c) => c.hsl.l <= 35)

  return {
    dominant: dominantColors,
    vibrant: vibrant.length > 0 ? vibrant : dominantColors.slice(0, 3),
    muted: muted.length > 0 ? muted : dominantColors.slice(0, 3),
    light: light.length > 0 ? light : dominantColors.filter((c) => c.hsl.l > 50),
    pastel: light.length > 0 ? light : dominantColors.filter((c) => c.hsl.l > 50),
    dark: dark.length > 0 ? dark : dominantColors.filter((c) => c.isDark),
  }
}

export function getColorHarmonies(color: ColorData): {
  complementary: ColorData
  analogous: ColorData[]
  triadic: ColorData[]
  monochromatic: ColorData[]
} {
  const { h, s, l } = color.hsl

  const hslToRgb = (hDeg: number, sPerc: number, lPerc: number) => {
    let h = (hDeg % 360) / 360
    if (h < 0) h += 1
    const s = sPerc / 100
    const l = lPerc / 100

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

  // Complementary: +180
  const compRgb = hslToRgb(h + 180, s, l)
  const complementary = createColorData(compRgb.r, compRgb.g, compRgb.b)

  // Analogous: -30, +30
  const an1Rgb = hslToRgb(h - 30, s, l)
  const an2Rgb = hslToRgb(h + 30, s, l)
  const analogous = [createColorData(an1Rgb.r, an1Rgb.g, an1Rgb.b), createColorData(an2Rgb.r, an2Rgb.g, an2Rgb.b)]

  // Triadic: +120, +240
  const tr1Rgb = hslToRgb(h + 120, s, l)
  const tr2Rgb = hslToRgb(h + 240, s, l)
  const triadic = [createColorData(tr1Rgb.r, tr1Rgb.g, tr1Rgb.b), createColorData(tr2Rgb.r, tr2Rgb.g, tr2Rgb.b)]

  // Monochromatic: l-30, l-15, l+15, l+30
  const monoSteps = [Math.max(10, l - 30), Math.max(20, l - 15), Math.min(85, l + 15), Math.min(95, l + 30)]
  const monochromatic = monoSteps.map((lStep) => {
    const rgb = hslToRgb(h, s, lStep)
    return createColorData(rgb.r, rgb.g, rgb.b)
  })

  return { complementary, analogous, triadic, monochromatic }
}

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
  })
  css += '}'
  return css
}

export function generateTailwindConfig(colorsInput: ColorData[] | PaletteResult): string {
  const colors = getColorsList(colorsInput)
  const obj: { [key: string]: string } = {}
  colors.forEach((c, idx) => {
    const keyName = c.name.toLowerCase().replace(/[^a-z0-0]/g, '-') || `color-${idx + 1}`
    obj[`palette-${idx + 1}`] = c.hex
  })

  return `module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(obj, null, 6)}
    }
  }
}`
}

export function generateJsonPalette(colorsInput: ColorData[] | PaletteResult): string {
  const colors = getColorsList(colorsInput)
  return JSON.stringify(colors, null, 2)
}

export async function generatePaletteCardPng(colors: ColorData[], title = 'Color Palette'): Promise<Blob> {
  const width = 800
  const height = 450
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 2D context not supported')
  }

  // Draw Dark Card Background
  ctx.fillStyle = '#0F172A'
  ctx.fillRect(0, 0, width, height)

  // Header Title
  ctx.fillStyle = '#F8FAFC'
  ctx.font = 'bold 24px sans-serif'
  ctx.fillText(title || 'Color Palette Studio', 40, 50)

  ctx.fillStyle = '#64748B'
  ctx.font = '14px sans-serif'
  ctx.fillText('DigitalMix Image Color Extractor • 100% Client-Side', 40, 75)

  // Swatches Grid
  const count = colors.length || 1
  const padding = 40
  const startY = 110
  const availableWidth = width - padding * 2
  const swatchWidth = Math.floor((availableWidth - (count - 1) * 12) / count)
  const swatchHeight = 220

  colors.forEach((c, i) => {
    const x = padding + i * (swatchWidth + 12)

    // Swatch Block
    ctx.fillStyle = c.hex
    ctx.beginPath()
    ctx.roundRect ? ctx.roundRect(x, startY, swatchWidth, swatchHeight, 12) : ctx.fillRect(x, startY, swatchWidth, swatchHeight)
    ctx.fill()

    // HEX Label underneath
    ctx.fillStyle = '#F8FAFC'
    ctx.font = 'bold 13px monospace'
    ctx.fillText(c.hex, x + 4, startY + swatchHeight + 28)

    // Name Label underneath
    ctx.fillStyle = '#94A3B8'
    ctx.font = '11px sans-serif'
    const truncatedName = c.name.length > 12 ? c.name.substring(0, 10) + '..' : c.name
    ctx.fillText(truncatedName, x + 4, startY + swatchHeight + 48)

    // Percentage
    if (c.percentage > 0) {
      ctx.fillStyle = '#64748B'
      ctx.font = '10px sans-serif'
      ctx.fillText(`${c.percentage}%`, x + 4, startY + swatchHeight + 64)
    }
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create Blob from canvas'))
    }, 'image/png')
  })
}
