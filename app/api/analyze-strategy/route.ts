import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { portfolioName, categories } = await req.json()

    const strategyText = categories
      .map((cat: any) => {
        const itemsText = (cat.items || [])
          .map((item: any) => {
            const note = item.personal_note ? ` — ${item.personal_note}` : ' — (לא נכתב הסבר אישי)'
            const required = item.is_required ? ' [חובה]' : ''
            return `  • ${item.text}${required}${note}`
          })
          .join('\n')
        return `${cat.label}:\n${itemsText || '  (אין תנאים בקטגוריה זו)'}`
      })
      .join('\n\n')

    const systemPrompt = `את/ה עוזר מסחר שמנתח אסטרטגיית מסחר אישית של סוחר, בעברית בלבד.
תקבל רשימת קטגוריות ותנאים שהסוחר בנה לעצמו עבור התיק "${portfolioName}", כולל הסברים אישיים שכתב לכל תנאי (אם כתב).

המשימה שלך: לכתוב ניתוח מילולי קצר וברור (כ-4-8 שורות) שמסביר:
- מה אופי האסטרטגיה הכוללת (האם היא מבוססת בעיקר על ניתוח טכני, פונדומנטלי, או שילוב ביניהם)
- האם יש פערים או חוסר עקביות (לדוגמה: תנאי בלי הסבר אישי, או תנאים שיכולים להתנגש זה בזה)
- טיפ מעשי אחד לשיפור או חידוד האסטרטגיה

היה תכליתי, חם, ולא שיפוטי. אל תמציא תנאים שלא קיימים ברשימה שקיבלת.`

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
        messages: [
          { role: 'user', content: `הנה האסטרטגיה האישית שלי:\n\n${strategyText}` },
        ],
      }),
    })

    const data = await response.json()

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 })
    }

    const text =
      data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n') || ''

    return NextResponse.json({ analysis: text })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'שגיאה לא ידועה' }, { status: 500 })
  }
}