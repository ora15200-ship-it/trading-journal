import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { trades, previousInsights } = await req.json()

    if (!trades || trades.length === 0) {
      return NextResponse.json({ insights: null })
    }

    const systemPrompt = `את/ה מאמן AI אישי למסחר. אתה מנתח את היסטוריית העסקאות של סוחר ובונה לאורך זמן הבנה של מי הוא כסוחר.
ענה תמיד בעברית, בפורמט הבא בדיוק (שתי כותרות):

🧠 אפיון:
[2-3 משפטים על אופי המסחר שלו - האם הוא ממושמע, אימפולסיבי, מנהל סיכונים טוב, נוטה לסטאפים מסוימים, וכו']

💡 המלצות:
[2-3 המלצות קצרות וממוקדות לשיפור, מבוססות נתונים]

התבסס רק על הנתונים שתקבל. שים לב במיוחד ל: יחס סיכון/סיכוי בפועל מול המוצהר, win rate, האם יש סטייה בין סטופים/יעדים שהוגדרו לתוצאה הסופית, חזרתיות בסטאפים, גודל פוזיציה לא עקבי, וסימנים להתנהגות אימפולסיבית (כניסות בלי סטופ/סיכון מוגדר).

חשוב: כתוב טקסט רגיל בלבד, בלי שום סימני Markdown (אל תשתמש בכוכביות ** להדגשה, אל תשתמש ב-# לכותרות וכו'). רק טקסט רגיל וברור.`

    const userPrompt = `היסטוריית העסקאות (JSON, מהחדש לישן):
${JSON.stringify(trades)}

${previousInsights ? `האפיון וההמלצות הקודמים שניתנו לסוחר:\n${previousInsights}\n\nעדכן אותם לאור הנתונים החדשים - אל תחזור על אותו ניתוח אם אין שינוי מהותי.` : ''}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    const data = await response.json()
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 })
    }

    const text =
      data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n') || null

    return NextResponse.json({ insights: text })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'שגיאה לא ידועה' }, { status: 500 })
  }
}