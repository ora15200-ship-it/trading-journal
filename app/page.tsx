import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold mb-4 text-emerald-400">
          יומן ההשקעות שלי
        </h1>
        <p className="text-gray-400 text-xl mb-12">
          נהל את הטריידים שלך בצורה חכמה
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/portfolios"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            כניסה לתיקים שלי
          </Link>
        </div>
      </div>
    </main>
  )
}