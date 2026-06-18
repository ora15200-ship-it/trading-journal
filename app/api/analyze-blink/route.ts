import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY חסר' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const imageContent = images.map((img: { data: string; type: string }) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: (img.type === 'image/png' ? 'image/png' : 'image/jpeg') as 'image/png' | 'image/jpeg',
        data: img.data
      }
    }))

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,      messages: [{
        role: 'user',
        content: [
          ...imageContent,
          {
            type: 'text',
            text: `אתה מנתח צילומי מסך של עסקאות מכל פלטפורמת מסחר או בנק (בלינק, Interactive Brokers, בנק הפועלים, וכו').

זהה את כל העסקאות מהתמונות. 

כללים:
- התעלם מ: הפקדות, משיכות, דיבידנדים, עמלות, מיסים
- זהה רק: קניות ומכירות של ניירות ערך (מניות, ETF, קריפטו)
- התאם קניות למכירות לפי סימול (FIFO)
- חשב רווח/הפסד: (מחיר מכירה - מחיר קניה) × כמות
- אם יש כמה קניות של אותו סימול ללא מכירה — חבר אותן לפוזיציה אחת

החזר JSON בלבד, ללא טקסט נוסף:
{
  "closed": [
    {
      "symbol": "AAPL",
      "buyDate": "2024-01-15",
      "sellDate": "2024-03-20",
      "buyPrice": 185.50,
      "sellPrice": 210.30,
      "shares": 1.5,
      "buyAmount": 278.25,
      "result": 37.20
    }
  ],
  "open": [
    {
      "symbol": "SPY",
      "buyDate": "2024-06-01",
      "shares": 2.5,
      "buyAmount": 1350.00
    }
  ],
  "platform": "שם הפלטפורמה שזיהית"
}

תאריכים בפורמט YYYY-MM-DD בלבד.
החזר JSON תקין בלבד ללא שום טקסט נוסף.`
          }
        ]
      }]
    })

    const text = (response.content[0] as { type: string; text: string }).text
    const clean = text.replace(/```json|```/g, '').trim()
    const data = JSON.parse(clean)

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: err.message || 'שגיאה לא ידועה' }, { status: 500 })
  }
}