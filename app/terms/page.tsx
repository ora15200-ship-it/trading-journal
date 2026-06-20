import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="bg-zen-cream text-zen-text">
      {/* Navbar */}
      <header className="bg-zen-charcoal">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <img src="/logo.svg" alt="ZenStock" className="h-9 w-auto" />
          <nav className="hidden items-center gap-8 text-sm font-medium text-zen-cream/80 md:flex">
            <Link href="/about" className="hover:text-zen-sage transition-colors">
              אודות
            </Link>
            <Link href="/login" className="hover:text-zen-sage transition-colors">
              התחברות
            </Link>
          </nav>
          <Link
            href="/login"
            className="rounded-md bg-zen-sage px-5 py-2 text-sm font-semibold text-zen-charcoal transition-opacity hover:opacity-90"
          >
            הרשמה חינם
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-20">
        <p className="mb-3 text-sm font-medium tracking-wide text-zen-sage">תקנון</p>
        <h1 className="font-display text-3xl text-zen-charcoal">הצהרת אחריות</h1>

        <div className="mt-10 border-t border-zen-line" />

        <div className="mt-10 flex flex-col gap-6 text-sm leading-relaxed text-zen-text/80 md:text-base">
          <p>
            ZenStock ("האפליקציה") מספקת כלי טכנולוגי למעקב, תיעוד וניתוח עסקאות מסחר אישיות
            בלבד. כל התכנים, הניתוחים, התובנות וההודעות המופקים על ידי האפליקציה, לרבות אלו
            המבוססים על מערכת בינה מלאכותית (ZEN Bot), נמסרים אך ורק לצורך תיעוד עצמי וככלי
            לימודי-אישי ותו לא.
          </p>

          <p>
            ZenStock ומפעיליו אינם אחראים ולא יהיו אחראים לכל נזק ו/או הפסד, במישרין ו/או
            בעקיפין, שיגרם למשתמש ו/או לצד שלישי כלשהו בכל הקשור לשימוש באפליקציה, בתכניה, או
            בתובנות המופקות בה.
          </p>

          <p>
            האפליקציה ותכניה אינם מהווים ייעוץ פיננסי ו/או השקעות, ואינם מהווים המלצה לקנייה
            ו/או מכירה ו/או ביצוע פעולה אחרת כלשהי בקשר לנייר ערך או לנכס פיננסי כזה או אחר.
            עליך לפנות לייעוץ פיננסי עצמאי ומוסמך לפני ביצוע פעולות פיננסיות.
          </p>

          <p>
            ידוע לך כי הפעולות הכרוכות במסחר ובעסקאות בניירות ערך ובנכסים פיננסיים הנן בעלות
            סיכון גבוה מאד ומשתנה, ואתה מודע לסיכון הרב ולתנודתיות החריפה הכרוכים בפעולות אלו.
            זכור כי תוצאות ביצועי עבר אינן מעידות בהכרח על תוצאות עתידיות.
          </p>

          <p className="font-medium text-zen-charcoal">
            בהרשמתך לשירות אתה מאשר שקראת והבנת הצהרה זו.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zen-charcoal">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-zen-cream/60 md:flex-row">
          <img src="/logo.svg" alt="ZenStock" className="h-7 w-auto opacity-80" />
          <p>© {new Date().getFullYear()} ZenStock. כל הזכויות שמורות.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-zen-sage">
              תקנון
            </Link>
            <Link href="/about" className="hover:text-zen-sage transition-colors">
              אודות
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}