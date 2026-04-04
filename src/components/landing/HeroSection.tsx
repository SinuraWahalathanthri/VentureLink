import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center px-8 pt-[120px] pb-[60px] text-center relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(23,52,4,0.82) 0%, rgba(59,109,17,0.7) 50%, rgba(99,153,34,0.6) 100%), url('/hero-bg.png') center/cover no-repeat`,
      }}
    >
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center bottom, rgba(99,153,34,0.3) 0%, transparent 70%)" }} />

      <div className="relative z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 bg-white/15 border border-white/30 backdrop-blur-lg rounded-full px-4 py-1.5 text-[13px] text-white/90 mb-6">
          <span className="w-2 h-2 bg-[#7CFC00] rounded-full animate-pulse-dot" />
          Sri Lanka's #1 SME Investment Platform
        </div>

        <h1 className="text-[clamp(2.4rem,5vw,4rem)] text-primary-foreground max-w-[800px] mb-4 font-serif">
          Invest in <em className="text-vl-green-100 not-italic">Sri Lanka's</em>
          <br />Boldest Businesses
        </h1>

        <p className="text-lg text-white/85 max-w-[560px] mb-10">
          Connect with verified, high-potential SMEs across the island. Become an early backer and grow together.
        </p>

        <div className="flex gap-3">
          <Button size="lg" className="rounded-full text-base px-8 py-3.5">
            Explore Opportunities
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full text-base px-8 py-3.5 
             border-white text-white 
             bg-transparent 
             hover:bg-white/10 hover:text-white"
          >
            List Your Business
          </Button>
        </div>

        <div className="flex gap-12 mt-12">
          {[
            { num: "247", lbl: "SMEs Listed" },
            { num: "LKR 2.4B", lbl: "Committed" },
            { num: "1,800+", lbl: "Investors" },
            { num: "25", lbl: "Districts" },
          ].map((s) => (
            <div key={s.lbl} className="text-center">
              <div className="text-[2rem] font-bold text-primary-foreground font-serif">{s.num}</div>
              <div className="text-xs text-white/70 uppercase tracking-wider">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
