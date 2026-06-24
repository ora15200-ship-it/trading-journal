import QRCode from 'qrcode'

type TradeSummaryInput = {
  symbol: string
  direction: 'long' | 'short' | null
  percent: number
}

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="56" viewBox="0 0 220 56">
  <path d="M28 6 A22 22 0 1 1 13.7 14.3" fill="none" stroke="#6FA98A" stroke-width="5" stroke-linecap="round"/>
  <polyline points="15,40 24,33 30,36 40,20" fill="none" stroke="#F7F6F2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="64" y="36" font-family="Heebo, Arial, sans-serif" font-size="26" font-weight="700">
    <tspan fill="#6FA98A">Zen</tspan><tspan fill="#F7F6F2">Stock</tspan>
  </text>
</svg>`

const INSTAGRAM_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F7F6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
</svg>`

const WEBSITE_URL = 'https://trading-journal-liart-five.vercel.app'
const INSTAGRAM_HANDLE = '@zenstock.il'

function svgToDataUrl(svg: string) {
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function ensureFontsLoaded(): Promise<void> {
  const linkId = 'zenstock-summary-fonts'
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link')
    link.id = linkId
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@700&family=Heebo:wght@500;600;700&display=swap'
    document.head.appendChild(link)
  }
  return document.fonts.ready.then(() => {})
}

export async function generateTradeSummaryImage({ symbol, direction, percent }: TradeSummaryInput): Promise<void> {
  await ensureFontsLoaded()
  await Promise.all([
    document.fonts.load("700 90px Heebo"),
    document.fonts.load("700 56px 'Frank Ruhl Libre'"),
  ])

  const width = 1080
  const height = 600
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const isWin = percent >= 0
  const accentColor = isWin ? '#6FA98A' : '#F87171'
  const paddingX = 64
  const paddingY = 56

  // רקע
  ctx.fillStyle = '#202022'
  ctx.fillRect(0, 0, width, height)

  // לוגו מדויק (אייקון + טקסט Zen/Stock), מוגדל
  const logoImg = await loadImage(svgToDataUrl(LOGO_SVG))
  const logoWidth = 230
  const logoHeight = (logoWidth / 220) * 56
  ctx.drawImage(logoImg, paddingX, paddingY, logoWidth, logoHeight)

  // אזור מרכזי: טיקר + באדג' | קו מפריד | אחוז
  const centerY = height / 2 + 10
  ctx.textAlign = 'center'

  // טיקר
  ctx.fillStyle = '#F7F6F2'
  ctx.font = "700 56px 'Frank Ruhl Libre', serif"
  const tickerX = width / 2 - 140
  ctx.fillText(symbol.toUpperCase(), tickerX, centerY - 14)

  // באדג' כיוון
  const badgeText = direction === 'short' ? 'SHORT' : 'LONG'
  ctx.font = "600 20px Heebo, Arial, sans-serif"
  const badgeTextWidth = ctx.measureText(badgeText).width
  const badgeWidth = badgeTextWidth + 36
  const badgeHeight = 34
  const badgeX = tickerX - badgeWidth / 2
  const badgeY = centerY + 14
  ctx.strokeStyle = '#44464A'
  ctx.lineWidth = 1.5
  const r = 8
  ctx.beginPath()
  ctx.moveTo(badgeX + r, badgeY)
  ctx.arcTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + badgeHeight, r)
  ctx.arcTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX, badgeY + badgeHeight, r)
  ctx.arcTo(badgeX, badgeY + badgeHeight, badgeX, badgeY, r)
  ctx.arcTo(badgeX, badgeY, badgeX + badgeWidth, badgeY, r)
  ctx.closePath()
  ctx.stroke()
  ctx.fillStyle = '#C7C9CC'
  ctx.fillText(badgeText, tickerX, badgeY + 23)

  // קו מפריד אנכי
  ctx.strokeStyle = '#44464A'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(width / 2 + 20, centerY - 60)
  ctx.lineTo(width / 2 + 20, centerY + 60)
  ctx.stroke()

  // אחוז תשואה
  const pctText = `${isWin ? '+' : ''}${percent.toFixed(1)}%`
  ctx.font = "700 90px Heebo, Arial, sans-serif"
  ctx.fillStyle = accentColor
  ctx.fillText(pctText, width / 2 + 180, centerY + 18)

  // קו מפריד אופקי תחתון
  ctx.strokeStyle = '#44464A'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(paddingX, height - 110)
  ctx.lineTo(width - paddingX, height - 110)
  ctx.stroke()

  // שורה תחתונה: אינסטגרם (ימין) | מוטו (מרכז) | QR (שמאל)
  const bottomY = height - 70

  // אינסטגרם
  const igImg = await loadImage(svgToDataUrl(INSTAGRAM_ICON_SVG))
  const igSize = 26
  ctx.drawImage(igImg, paddingX, bottomY - igSize / 2, igSize, igSize)
  ctx.font = "500 22px Heebo, Arial, sans-serif"
  ctx.fillStyle = '#F7F6F2'
  ctx.textAlign = 'left'
  ctx.fillText(INSTAGRAM_HANDLE, paddingX + igSize + 12, bottomY + 7)

  // מוטו במרכז
  ctx.textAlign = 'center'
  ctx.font = "500 18px Heebo, Arial, sans-serif"
  ctx.fillStyle = '#C7C9CC'
  ctx.fillText('Master Your Mind. Master Your Money.', width / 2, bottomY + 6)

  // QR בצד שמאל
  const qrDataUrl = await QRCode.toDataURL(WEBSITE_URL, {
    margin: 0,
    color: { dark: '#202022', light: '#F7F6F2' },
  })
  const qrImg = await loadImage(qrDataUrl)
  const qrSize = 68
  ctx.drawImage(qrImg, width - paddingX - qrSize, bottomY - qrSize / 2, qrSize, qrSize)

  // הורדה
  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { resolve(); return }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zenstock-${symbol.toLowerCase()}-summary.png`
      a.click()
      URL.revokeObjectURL(url)
      resolve()
    })
  })
}