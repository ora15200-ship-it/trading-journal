import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const today = new Date().toISOString().split('T')[0]

    const systemPrompt = `את/ה עוזר AI שמסייע לסוחר לתעד עסקאות מסחר ביומן שלו, בעברית בלבד.
המשתמש מתאר עסקה במילים חופשיות (למשל: "נכנסתי ל-INTC בלונג ב-37.50, סטופ ב-36, יעד ב-40, סיכנתי 100 דולר").

חלץ מהתיאור:
- date: תאריך בפורמט YYYY-MM-DD. אם לא צוין תאריך, השתמש בתאריך של היום: ${today}.
- symbol: סימול המנייה, אותיות גדולות.
- direction: "long" או "short".
- entry_price: מספר.
- stop_loss: מספר (אופציונלי).
- take_profit: מספר (אופציונלי).
- risk_amount: סכום בדולרים שהסוחר מוכן לסכן (אופציונלי).
- setup: סוג הסטאפ/אסטרטגיה במילה או שתיים (אופציונלי).
- notes: כל תיאור נוסף, תחושות או סיבות לכניסה (אופציונלי).
- result: תוצאה סופית בדולרים אם העסקה כבר נסגרה (אופציונלי, השאר ריק אם פתוחה).

symbol, entry_price ו-direction הם שדות חובה.
אם אחד מהם חסר - אל תקרא לכלי record_trade. במקום זה, שאל שאלת המשך אחת קצרה וממוקדת בעברית כדי להשלים בדיוק את החסר.
ברגע שיש לך את שלושת השדות החיוניים - קרא לכלי record_trade עם כל מה שיש לך (null לשדות לא ידועים).
היה תכליתי וחם, שאלה אחת בכל פעם, בלי הצפה.`

    const tools = [
      {
        name: 'record_trade',
        description: 'שמירת נתוני עסקה מובנים שחולצו מהשיחה עם המשתמש',
        input_schema: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            symbol: { type: 'string' },
            direction: { type: 'string', enum: ['long', 'short'] },
            entry_price: { type: 'number' },
            stop_loss: { type: ['number', 'null'] },
            take_profit: { type: ['number', 'null'] },
            risk_amount: { type: ['number', 'null'] },
            setup: { type: ['string', 'null'] },
            notes: { type: ['string', 'null'] },
            result: { type: ['number', 'null'] },
          },
          required: ['date', 'symbol', 'direction', 'entry_price'],
        },
      },
    ]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
        tools,
      }),
    })

    const data = await response.json()

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 })
    }

    const toolUse = data.content?.find((b: any) => b.type === 'tool_use' && b.name === 'record_trade')
    const assistantText =
      data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n') || null

    if (toolUse) {
      return NextResponse.json({ type: 'trade_ready', trade: toolUse.input, assistantText })
    }

    return NextResponse.json({ type: 'message', text: assistantText || 'אפשר לפרט עוד קצת?' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'שגיאה לא ידועה' }, { status: 500 })
  }
}