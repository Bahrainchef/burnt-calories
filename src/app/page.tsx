import Link from "next/link";

export default function Home() {
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden grain"
      style={{ background: "linear-gradient(180deg, #0f0e0b 0%, #1a1508 40%, #2c1f06 70%, #3d2a07 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 60%, rgba(232,98,26,0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        {/* Logo mark */}
        <div className="mb-8">
          <svg width="56" height="64" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 26 Q7 18 11 12 Q9 20 13 22Z" fill="#4A7C3F" />
            <path d="M14 2 Q8 10 9 18 Q10 26 14 28 Q18 26 19 18 Q20 10 14 2Z" fill="#E8621A" />
            <path d="M14 8 Q11 14 12 20 Q13 25 14 26 Q16 24 16 20 Q17 14 14 8Z" fill="#F5A623" />
          </svg>
        </div>

        {/* Wordmark */}
        <h1 className="text-5xl font-bold tracking-tight mb-3" style={{ color: "#f5f0e8" }}>
          <span style={{ color: "#E8621A" }}>Burnt</span> Calories
        </h1>

        <p
          className="text-sm font-medium tracking-[0.18em] uppercase mb-8"
          style={{ color: "#8a7a5a" }}
        >
          Nutrition &amp; Performance
        </p>

        <p className="text-lg leading-relaxed mb-12" style={{ color: "#c8b896" }}>
          Personalised macros. 154 ingredients. 55 performance recipes.
          <br />
          Built around the ZSF protocol.
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
<!-- deploy test Sat 23 May 2026 17:02:48 +03 -->
