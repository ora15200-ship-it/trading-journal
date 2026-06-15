export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-emerald-400">יומן מסחר</h1>
        <div className="flex gap-4 text-sm text-gray-400">
          <span className="text-white font-medium">דשבורד</span>
          <span className="hover:text-white cursor-pointer">טריידים</span>
          <span className="hover:text-white cursor-pointer">סטטיסטיקות</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">סה"כ טריידים</p>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Win Rate</p>
            <p className="text-3xl font-bold text-emerald-400">0%</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">רווח כולל</p>
            <p className="text-3xl font-bold text-emerald-400">$0</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Profit Factor</p>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">הטריידים שלי</h2>
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              + טרייד חדש
            </button>
          </div>
          <div className="text-center text-gray-500 py-16">
            <p className="text-lg">עדיין אין טריידים</p>
            <p className="text-sm mt-2">לחץ על "טרייד חדש" כדי להתחיל</p>
          </div>
        </div>
      </main>
    </div>
  )
}
