function App() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">
          Dora 🌏
        </h1>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Profile
        </button>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-8">

        <div className="text-center mb-10">
          <h2 className="text-5xl font-bold">
            Your AI Travel Companion
          </h2>

          <p className="text-gray-600 mt-4">
            Food • Exploration • Transport • Translation
          </p>
        </div>

        {/* Search Box */}
        <div className="max-w-3xl mx-auto mb-10">

          {/* Quick Actions */}
          <div>
            <h3 className="text-2xl font-bold mb-6">
              Quick Actions
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg cursor-pointer">
                🍜 Food Discovery
              </div>

              <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg cursor-pointer">
                🗺 Explore
              </div>

              <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg cursor-pointer">
                🚆 Transport
              </div>

              <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg cursor-pointer">
                🌏 Translate
              </div>

            </div>
          </div>

          {/* Trending */}
          <div className="mt-12">

            <h3 className="text-2xl font-bold mb-6">
              Trending Destinations
            </h3>

            <div className="grid md:grid-cols-4 gap-4">

              <div className="bg-white rounded-xl p-6 shadow">
                <h4 className="font-bold">Japan 🇯🇵</h4>
                <p className="text-sm text-gray-500">
                  Culture, food & city life
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow">
                <h4 className="font-bold">South Korea 🇰🇷</h4>
                <p className="text-sm text-gray-500">
                  K-culture & street food
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow">
                <h4 className="font-bold">Thailand 🇹🇭</h4>
                <p className="text-sm text-gray-500">
                  Beaches & night markets
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow">
                <h4 className="font-bold">Italy 🇮🇹</h4>
                <p className="text-sm text-gray-500">
                  History & cuisine
                </p>
              </div>

            </div>
          </div>

          <input
            type="text"
            placeholder="Where are you travelling?"
            className="w-full border rounded-xl p-4 shadow-sm mt-10"
          />
        </div>

      </main>
    </div>
  );
}

export default App;


