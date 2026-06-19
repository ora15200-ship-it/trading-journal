import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const today = new Date().toISOString().split('T')[0]

    const systemPrompt = `את/ה עוזר AI שמסייע לסוחר לתעד עסקאות מסחר ביומן שלו, בעברית בלבד.
המשתמש עשוי לתאר עסקה במילים חופשיות, ולעיתים גם לשלוח תמונה (צילום מסך של פלטפורמת מסחר, אישור עסקה, היסטוריית תנועות בחשבון וכו').

חשוב מאוד: לעיתים תמונה אחת מכילה **כמה עסקאות בבת אחת** (למשל היסטוריית תנועות עם כמה רכישות שונות). במקרה כזה עליך לזהות ולחלץ **את כולן**, לא רק את הראשונה או האחרונה.

לכל עסקה, חלץ:
- date: תאריך בפורמט YYYY-MM-DD. אם לא ידוע, השתמש בתאריך של היום: ${today}.
- symbol: סימול המנייה, אותיות גדולות.
- direction: "long" או "short". אם זו "קניה"/"buy" בלי מידע נוסף - זו כנראה "long".
- entry_price: מחיר ליחידה (מספר). אם בתמונה מוצג רק "סכום עסקה כולל" (amount) ו"כמות מניות" (shares) בלי מחיר ליחידה - חשב בעצמך: entry_price = amount / shares.
- shares: כמות המניות, אם ידועה (אופציונלי).
- stop_loss: מספר (אופציונלי).
- take_profit: מספר (אופציונלי).
- risk_amount: סכום בדולרים שהסוחר מוכן לסכן (אופציונלי).
- setup: סוג הסטאפ/אסטרטגיה במילה או שתיים (אופציונלי).
- notes: כל תיאור נוסף, תחושות או סיבות לכניסה (אופציונלי).
- result: תוצאה סופית בדולרים אם העסקה כבר נסגרה (אופציונלי, השאר ריק/null אם פתוחה - כמו רכישה בלי מכירה מקבילה).

symbol, entry_price ו-direction הם שדות חובה לכל עסקה.
אם חסר מידע חיוני לעסקה היחידה שבה אתה עוסק (ואין תמונה עם כמה עסקאות) - אל תקרא לכלי. שאל שאלת המשך אחת קצרה וממוקדת בעברית.

ברגע שיש לך מידע מספק - קרא לכלי record_trades עם **מערך** של כל העסקאות שזוהו (גם אם זו עסקה אחת בלבד - שלח מערך עם איבר אחד).
היה תכליתי וחם.`

    const tools = [
      {
        name: 'record_trades',
        description: 'שמירת עסקה אחת או יותר שחולצו מהשיחה או מתמונה. תמיד משתמשים בכלי הזה (גם לעסקה בודדת - כמערך עם איבר אחד).',
        input_schema: {
          type: 'object',
          properties: {
            trades: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  symbol: { type: 'string' },
                  direction: { type: 'string', enum: ['long', 'short'] },
                  entry_price: { type: 'number' },
                  shares: { type: ['number', 'null'] },
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
          },
          required: ['trades'],
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
        max_tokens: 2048,
        system: systemPrompt,
        messages,
        tools,
      }),
    })

    const data = await response.json()

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 })
    }

    const toolUse = data.content?.find((b: any) => b.type === 'tool_use' && b.name === 'record_trades')
    const assistantText =
      data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n') || null

    if (toolUse) {
      return NextResponse.json({ type: 'trades_ready', trades: toolUse.input.trades, assistantText })
    }

    return NextResponse.json({ type: 'message', text: assistantText || 'אפשר לפרט עוד קצת?' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'שגיאה לא ידועה' }, { status: 500 })
  }
}