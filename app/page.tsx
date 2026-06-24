import Link from "next/link";
import InstallPwaButton from "../components/InstallPwaButton";

export default function HomePage() {
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
          <div className="flex items-center gap-3">
            <InstallPwaButton />
            <Link
              href="/login"
              className="rounded-md bg-zen-sage px-5 py-2 text-sm font-semibold text-zen-charcoal transition-opacity hover:opacity-90"
            >
              הרשמה חינם
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <svg
          className="pointer-events-none absolute -left-32 top-1/2 hidden h-[640px] w-[640px] -translate-y-1/2 opacity-[0.06] md:block"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <path
            d="M100 12 A88 88 0 1 1 50.5 26.4"
            fill="none"
            stroke="#1B1F1C"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>

        <div className="relative mx-auto max-w-3xl px-6 py-28 text-center md:py-36">
          <p className="mb-4 text-sm font-medium tracking-wide text-zen-sage">
            ZEN + STOCK
          </p>
          <h1 className="font-display text-4xl leading-tight text-zen-charcoal md:text-5xl">
            איפוק ומשמעת הם הדרך לשוק ההון
            <br />
            <span className="text-zen-sage">לא מזל. לא ריגוש רגעי.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zen-text/70 md:text-lg">
            Zen מסמל בהירות מחשבתית ושליטה עצמית. Stock מסמל את עולם המסחר וההון.
            ZenStock הוא יומן המסחר שעוזר לך לפעול מתוך תהליך שקול ועקבי - ולא מתוך רגש.
          </p>
          <p className="mt-3 text-sm font-medium text-zen-text/50">
            Master Your Mind. Master Your Money.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="w-full rounded-md bg-zen-charcoal px-7 py-3 text-sm font-semibold text-zen-cream transition-opacity hover:opacity-90 sm:w-auto"
            >
              התחל לתעד בחינם
            </Link>
            <Link
              href="/about"
              className="w-full rounded-md border border-zen-charcoal/15 px-7 py-3 text-sm font-semibold text-zen-charcoal transition-colors hover:border-zen-sage hover:text-zen-sage sm:w-auto"
            >
              קרא עוד על המוטו
            </Link>
          </div>
        </div>
      </section>

      {/* Ledger divider */}
      <div className="mx-auto max-w-6xl px-6">
        <div className="border-t border-zen-line" />
      </div>

      {/* Value pillars */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-3">
          {[
            {
              title: "תיעוד מדויק",
              text: "כל עסקה מתועדת אוטומטית, עם תמונות, הערות וחישובי סיכון-תשואה.",
            },
            {
              title: "ניתוח עם AI",
              text: "ZEN Bot מנתח את ההיסטוריה שלך ומזהה דפוסים שמעכבים אותך.",
            },
            {
              title: "עקביות לאורך זמן",
              text: "מבט על ההתקדמות שלך כסוחר - לא רק על העסקה הבודדת.",
            },
          ].map((item) => (
            <div key={item.title} className="border-t-2 border-zen-sage pt-5">
              <h3 className="font-display text-lg text-zen-charcoal">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zen-text/70">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zen-charcoal">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-zen-cream/60 md:flex-row">
          <img src="/logo.svg" alt="ZenStock" className="h-7 w-auto opacity-80" />
          <p>© {new Date().getFullYear()} ZenStock. כל הזכויות שמורות.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-zen-sage transition-colors">
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