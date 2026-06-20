import Link from "next/link";

const values = [
  { title: "איפוק", text: "לא לרדוף אחרי השוק, אלא לחכות להזדמנויות הנכונות." },
  { title: "משמעת", text: "לדבוק בתוכנית ולהימנע מהחלטות רגשיות." },
  { title: "חשיבה", text: "לפעול מתוך נתונים, למידה וניסיון." },
  { title: "סבלנות", text: "להבין שבניית הון היא מרתון ולא ספרינט." },
  { title: "צמיחה מתמדת", text: "להשתפר בכל יום, גם כמשקיעים וגם כבני אדם." },
];

const roadmap = [
  "יומן מסחר",
  "מעקב השקעות לטווח ארוך",
  "עוזר AI פיננסי",
  "מערכת לימוד והתפתחות",
  "תכנון פיננסי ומטרות",
  "ניתוח טעויות והרגלי מסחר",
  "קהילה של משקיעים וסוחרים",
];

export default function AboutPage() {
  return (
    <main className="bg-zen-cream text-zen-text">
      {/* Navbar */}
      <header className="bg-zen-charcoal">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <img src="/logo.svg" alt="ZenStock" className="h-9 w-auto" />
          <nav className="hidden items-center gap-8 text-sm font-medium text-zen-cream/80 md:flex">
            <Link href="/about" className="text-zen-sage">
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

      {/* Intro */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="mb-4 text-sm font-medium tracking-wide text-zen-sage">החזון שלנו</p>
        <h1 className="font-display text-4xl leading-tight text-zen-charcoal md:text-5xl">
          לא רק מסחר.
          <br />
          <span className="text-zen-sage">דרך חשיבה.</span>
        </h1>
      </section>

      <div className="mx-auto max-w-4xl px-6">
        <div className="border-t border-zen-line" />
      </div>

      {/* Meaning of the name */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="font-display text-2xl text-zen-charcoal">משמעות השם</h2>
        <p className="mt-4 text-base leading-relaxed text-zen-text/70 md:text-lg">
          ZenStock מורכב משתי מילים: <span className="font-medium text-zen-charcoal">Zen</span> מייצג
          איפוק, סבלנות, בהירות מחשבתית, משמעת ושליטה עצמית. <span className="font-medium text-zen-charcoal">Stock</span>{" "}
          מייצג את עולם ההשקעות, המסחר והצמיחה הפיננסית.
        </p>
        <p className="mt-4 text-base leading-relaxed text-zen-text/70 md:text-lg">
          החיבור בין שתי המילים יוצר תפיסה שלפיה הצלחה בשוק ההון אינה מבוססת על מזל או ריגוש רגעי,
          אלא על קבלת החלטות שקולה, חשיבה לטווח ארוך ומשמעת עצמית.
        </p>
      </section>

      <div className="mx-auto max-w-4xl px-6">
        <div className="border-t border-zen-line" />
      </div>

      {/* Vision */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="font-display text-2xl text-zen-charcoal">החזון</h2>
        <p className="mt-4 text-base leading-relaxed text-zen-text/70 md:text-lg">
          ZenStock נבנה כדי לעזור לאנשים לקבל החלטות פיננסיות טובות יותר. אנחנו מאמינים שהצלחה
          בשוק ההון אינה נמדדת במספר העסקאות שבוצעו, אלא ביכולת לשמור על איפוק, ללמוד מטעויות
          ולפעול מתוך תהליך מסודר ועקבי.
        </p>
        <p className="mt-4 text-base leading-relaxed text-zen-text/70 md:text-lg">
          ZenStock שואפת להיות הרבה יותר מיומן מסחר - מערכת פיננסית שלמה שמלווה אותך מהעסקה
          הבודדת ועד להתפתחות שלך כסוחר וכמשקיע.
        </p>
      </section>

      <div className="mx-auto max-w-4xl px-6">
        <div className="border-t border-zen-line" />
      </div>

      {/* Values */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="font-display text-2xl text-zen-charcoal">הערכים שמובילים אותנו</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {values.map((v) => (
            <div key={v.title} className="border-t-2 border-zen-sage pt-4">
              <h3 className="font-display text-lg text-zen-charcoal">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zen-text/70">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6">
        <div className="border-t border-zen-line" />
      </div>

      {/* Mission */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="mb-3 text-sm font-medium tracking-wide text-zen-sage">המשימה</p>
        <p className="font-display text-xl leading-relaxed text-zen-charcoal md:text-2xl">
          לעזור למשקיעים ולסוחרים להפוך לגרסה טובה יותר של עצמם - באמצעות טכנולוגיה, נתונים
          ובינה מלאכותית.
        </p>
      </section>

      {/* Slogan */}
      <section className="bg-zen-charcoal py-20 text-center">
        <p className="font-display text-2xl text-zen-cream md:text-3xl">
          Master Your Mind. Master Your Money.
        </p>
        <p className="mt-4 text-sm text-zen-cream/50">
          Patience. Discipline. Clarity. · Think Better. Invest Better.
        </p>
      </section>

      {/* Long-term vision */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center font-display text-2xl text-zen-charcoal">
          לאן אנחנו הולכים
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-zen-text/60">
          בטווח הארוך, ZenStock תהפוך למרכז פיננסי אישי חכם שמרכז במקום אחד את כל מה שצריך
          כדי לצמוח כסוחר וכמשקיע.
        </p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {roadmap.map((item) => (
            <li
              key={item}
              className="border-b border-zen-line py-2 text-sm text-zen-text/80"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-display text-2xl text-zen-charcoal md:text-3xl">
          More than trading.
          <br />
          <span className="text-zen-sage">A state of mind.</span>
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-md bg-zen-charcoal px-7 py-3 text-sm font-semibold text-zen-cream transition-opacity hover:opacity-90"
        >
          הצטרף בחינם
        </Link>
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