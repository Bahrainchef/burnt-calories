import Link from "next/link";

export default function Home() {
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: "url('/hero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center 40%",
      }}
    >
      {/* Dark gradient overlay: heavy top → clear middle (wheat) → heavy bottom */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,6,3,0.88) 0%, rgba(8,6,3,0.45) 30%, rgba(8,6,3,0.20) 52%, rgba(8,6,3,0.60) 75%, rgba(8,6,3,0.92) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <img
            src="/logo-transparent.png"
            alt="Burnt Calories"
            style={{ maxWidth: 320, width: "100%", display: "block", filter: "contrast(1.1) brightness(1.05)" }}
          />
        </div>

        <p className="text-lg leading-relaxed mb-12" style={{ color: "#c8b896" }}>
          Science-backed nutrition for a longer, stronger life.
          <br />
          154 whole-food ingredients. 55 chef-crafted recipes.
          <br />
          Built around the flavours of the Gulf.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {[
            "Macro calculator",
            "Recipe library",
            "Meal builder",
            "Ingredient database",
            "Client management",
            "Workout protocols",
          ].map((f) => (
            <span
              key={f}
              className="text-xs px-3 py-1 rounded-full"
              style={{
                background: "rgba(232,98,26,0.12)",
                color: "#E8621A",
                border: "1px solid rgba(232,98,26,0.22)",
              }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/app"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-200 hover:scale-105 hover:brightness-110"
          style={{
            background: "#E8621A",
            color: "#fff",
            boxShadow: "0 0 32px rgba(232,98,26,0.45)",
          }}
        >
          Open platform
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <p className="mt-6 text-xs" style={{ color: "#5a4f3a" }}>
          burntcalories.com
        </p>
      </div>
    </main>
  );
}
