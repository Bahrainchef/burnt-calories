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
      {/* Dark gradient overlay */}
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

        {/* Headline */}
        <h1
          className="mb-5 leading-tight"
          style={{
            fontSize: "clamp(2rem, 5vw, 2.75rem)",
            fontWeight: 300,
            fontStyle: "italic",
            color: "#f5f0e8",
            letterSpacing: "-0.01em",
          }}
        >
          Food as medicine.<br />
          Performance as purpose.
        </h1>

        {/* Subheading */}
        <p
          className="leading-relaxed mb-10"
          style={{ fontSize: "clamp(0.9rem, 2vw, 1.05rem)", color: "#b8a882", fontWeight: 300 }}
        >
          Where culinary craft meets longevity science.
          <br />
          Nutrition built around the rich flavours of the Gulf —
          <br />
          <span style={{ color: "#d4b87a" }}>za&apos;atar, saffron, freekeh, pomegranate</span> —
          <br />
          designed to fuel a longer, stronger, more vibrant life.
        </p>

        {/* Three pillars */}
        <div className="flex flex-col gap-5 mb-12 text-left w-full max-w-lg">
          {[
            {
              icon: "🌿",
              title: "Eat for longevity",
              body: "Anti-inflammatory whole foods that protect, repair and energise at a cellular level.",
            },
            {
              icon: "🔥",
              title: "Perform at your peak",
              body: "Precision macros and protein timing built around your training and your goals.",
            },
            {
              icon: "✨",
              title: "Live with intention",
              body: "Food that tastes extraordinary, looks beautiful and makes you feel unstoppable.",
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="flex gap-4 items-start">
              <span style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }}>{icon}</span>
              <p style={{ fontSize: "0.9rem", color: "#c8b896", lineHeight: 1.6, margin: 0 }}>
                <span style={{ color: "#f0e8d8", fontWeight: 500 }}>{title}</span>
                {" — "}
                {body}
              </p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-200 hover:scale-105 hover:brightness-110"
            style={{
              background: "#E8621A",
              color: "#fff",
              boxShadow: "0 0 32px rgba(232,98,26,0.45)",
            }}
          >
            Build my plan
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200 hover:scale-105"
            style={{
              background: "rgba(245,240,232,0.08)",
              color: "#f0e8d8",
              border: "1px solid rgba(245,240,232,0.18)",
              backdropFilter: "blur(4px)",
            }}
          >
            Explore recipes
          </Link>
        </div>

        <p className="text-xs" style={{ color: "#5a4f3a" }}>
          burntcalories.com
        </p>
      </div>
    </main>
  );
}
