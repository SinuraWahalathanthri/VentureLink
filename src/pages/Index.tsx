import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCampaigns, type SMEData } from "@/lib/api";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import SearchBar from "@/components/landing/SearchBar";
import SMECard from "@/components/landing/SMECard";
import AuthModal from "@/components/landing/AuthModal";

export default function Index() {
  const navigate = useNavigate();
  const [smeData, setSmeData] = useState<SMEData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [stage, setStage] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCampaigns();
      setSmeData(data);
    } catch (err) {
      setError("Failed to load campaigns. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = smeData.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.industry.toLowerCase().includes(search.toLowerCase()) &&
        !s.location.toLowerCase().includes(search.toLowerCase())) return false;
    if (industry && s.industry !== industry) return false;
    if (stage && s.stage !== stage) return false;
    if (location && s.location !== location) return false;
    if (size) {
      if (size === "Under LKR 10M" && s.goal >= 10e6) return false;
      if (size === "LKR 10M–100M" && (s.goal < 10e6 || s.goal > 100e6)) return false;
      if (size === "LKR 100M–500M" && (s.goal < 100e6 || s.goal > 500e6)) return false;
      if (size === "Over LKR 500M" && s.goal < 500e6) return false;
    }
    return true;
  });

  return (
    <>
      <Navbar />
      <HeroSection />
      <SearchBar
        searchQuery={search} onSearchChange={setSearch}
        industry={industry} onIndustryChange={setIndustry}
        size={size} onSizeChange={setSize}
        stage={stage} onStageChange={setStage}
        location={location} onLocationChange={setLocation}
      />

      {/* SME Listings */}
      <section className="sme-listings-section py-20">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="flex items-baseline justify-between mb-10">
            <div>
              <h2 className="text-[1.85rem] font-extrabold font-serif text-vl-green-800 tracking-tight">Latest SME Opportunities</h2>
              <p className="text-[13.5px] text-muted-foreground mt-1.5 italic">Verified businesses seeking investment partners</p>
            </div>
            <span className="text-[13px] text-vl-green-600 font-medium">
              Showing {filtered.length} SME{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="loading-spinner" />
              <p className="text-muted-foreground mt-4">Loading investment opportunities...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-destructive mb-4 block">warning</span>
              <p className="text-lg text-destructive mb-2">{error}</p>
              <button onClick={loadCampaigns} className="text-primary font-semibold hover:underline">Retry</button>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-7">
              {filtered.map((sme) => (
                <SMECard key={sme.id} sme={sme} onClick={() => navigate(`/campaigns/${sme.id}`)} />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No SMEs match your filters. Try adjusting your search.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center mb-14 max-w-[600px] mx-auto">
            <h2 className="text-[2rem] font-extrabold text-foreground mb-3 tracking-tight">How It Works</h2>
            <p className="text-[15px] text-muted-foreground">
              Start investing in high-growth potential businesses with our transparent, three-step process.
            </p>
          </div>
          <div className="flex flex-col gap-5">
            {[
              { num: "1", title: "Discover Verified Opportunities", desc: "Browse our curated selection of Sri Lankan SMEs. Every business goes through a rigorous vetting process." },
              { num: "2", title: "Express Your Interest", desc: "Found a business you believe in? Submit a commitment of interest with your intended amount." },
              { num: "3", title: "Connect and Grow", desc: "The business owner will review your commitment and reach out directly to finalize the terms." },
            ].map((step) => (
              <div
                key={step.num}
                className="step-item flex items-center gap-7 bg-white border border-border rounded-2xl p-7 shadow-vl max-[768px]:flex-col max-[768px]:text-center"
              >
                <div className="w-[60px] h-[60px] flex-shrink-0 rounded-2xl flex items-center justify-center font-extrabold text-[1.5rem] text-white bg-gradient-to-br from-primary to-emerald-600 shadow-lg">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{step.title}</h3>
                  <p className="text-[14px] text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why VentureLink */}
      <section id="why-invest" className="py-24 bg-muted/40">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center mb-14 max-w-[600px] mx-auto">
            <h2 className="text-[2rem] font-extrabold text-foreground mb-3 tracking-tight">Why VentureLink?</h2>
            <p className="text-[15px] text-muted-foreground">We bridge the gap between ambitious Sri Lankan entrepreneurs and global capital.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "insights",       title: "Data-Driven Insights",  desc: "Access detailed financial records, growth metrics, and investor pitch decks for every SME." },
              { icon: "verified_user",  title: "Vetted Listings",       desc: "Every business undergoes a robust verification process so you can invest with confidence." },
              { icon: "handshake",      title: "Direct Connection",     desc: "No middlemen, no hidden fees. Communicate directly with founders to finalize terms." },
            ].map((f) => (
              <div key={f.title} className="feature-card bg-white rounded-2xl border border-border shadow-vl p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 text-primary">
                  <span className="material-symbols-outlined text-[26px]">{f.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white/60 px-8 py-10 text-center text-[13px]">
        <div className="text-xl font-extrabold text-white mb-2 tracking-tight">VentureLink</div>
        <p>Connecting Sri Lanka's entrepreneurs with visionary investors.</p>
        <p className="mt-3 text-[11px] opacity-50">© 2026 VentureLink. All rights reserved.</p>
      </footer>

      <AuthModal open={showAuth} onOpenChange={setShowAuth} />

    </>
  );
}
