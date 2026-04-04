import { useState } from "react";
import { type SMEData, fmtLKR } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  MapPin,
  Users,
  FileText,
  TrendingUp,
  Download,
  Shield,
  Calculator,
  Briefcase,
  Sparkles,
  Bookmark,
  BarChart3,
} from "lucide-react";

interface DetailPageProps {
  sme: SMEData;
  onBack: () => void;
  onCommit: () => void;
}

export default function DetailPage({ sme, onBack, onCommit }: DetailPageProps) {
  const pct = sme.goal > 0 ? Math.round((sme.committed / sme.goal) * 100) : 0;
  const impliedValuation =
    sme.equity > 0 ? (sme.goal / sme.equity) * 100 : 0;

  // Equity calculator state
  const [calcAmount, setCalcAmount] = useState("");
  const calcNum = parseFloat(calcAmount) || 0;
  const calcEquity =
    sme.goal > 0 ? ((calcNum / sme.goal) * sme.equity).toFixed(2) : "0";
  const calcOwnership =
    sme.goal > 0 ? ((calcNum / sme.goal) * sme.equity).toFixed(2) : "0";

  const docs = [
    { label: "Pitch Deck", sub: "PDF", url: sme.docUrls.pitchDeck, icon: "bar_chart" },
    { label: "Financial Statements", sub: "PDF", url: sme.docUrls.financials, icon: "description" },
    { label: "Business Registration", sub: "PDF", url: sme.docUrls.registration, icon: "assignment" },
    { label: "Bank Statement", sub: "PDF", url: sme.docUrls.bankStatement, icon: "account_balance" },
  ];

  return (
    <div className="detail-page pt-16">
      {/* ─── Hero Banner ─── */}
      <div
        className="detail-hero"
        style={{ background: `linear-gradient(135deg, ${sme.color}dd, ${sme.color}88)` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-[1200px] mx-auto px-8 pb-8 pt-6 flex flex-col justify-end h-full">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onBack} className="detail-pill-btn">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Listings
            </button>
            <span className="detail-pill-status">
              <span className="w-2 h-2 bg-[#7CFC00] rounded-full animate-pulse-dot" />
              Open for Investment
            </span>
          </div>
          <h1 className="text-[2rem] font-extrabold text-white tracking-tight mb-1">
            {sme.name}
          </h1>
          <p className="text-[15px] text-white/75 mb-3">{sme.tagline}</p>
          <div className="flex flex-wrap gap-2">
            {sme.location && (
              <span className="detail-hero-tag">
                <MapPin className="w-3 h-3" /> {sme.location}
              </span>
            )}
            {sme.industry && (
              <span className="detail-hero-tag">
                <Briefcase className="w-3 h-3" /> {sme.industry}
              </span>
            )}
            {sme.stageRaw && (
              <span className="detail-hero-tag">
                <Bookmark className="w-3 h-3" /> {sme.stageRaw}
              </span>
            )}
            {sme.employees > 0 && (
              <span className="detail-hero-tag">
                <Users className="w-3 h-3" /> {sme.employees} Employees
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Content Grid ─── */}
      <div className="max-w-[1200px] mx-auto px-8 py-10 grid grid-cols-[1fr_360px] gap-8 items-start max-[900px]:grid-cols-1">
        {/* ===== LEFT COLUMN ===== */}
        <div className="space-y-0">
          {/* Business Overview */}
          <DetailSection icon={<FileText className="w-5 h-5" />} title="Business Overview">
            <p className="mb-4">{sme.description}</p>
            {sme.problem && (
              <p className="mb-4">
                <strong className="text-foreground">Problem & Solution:</strong>{" "}
                {sme.problem}
              </p>
            )}
            {sme.regNo && (
              <p className="text-[13px] mb-4">
                <strong className="text-foreground">Registration No:</strong>{" "}
                <span className="font-mono text-muted-foreground">{sme.regNo}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {sme.industry && (
                <span className="detail-content-tag">{sme.industry}</span>
              )}
              {sme.stageRaw && (
                <span className="detail-content-tag">{sme.stageRaw}</span>
              )}
            </div>
          </DetailSection>

          {/* Products & Services */}
          {sme.products && (
            <DetailSection icon={<Sparkles className="w-5 h-5" />} title="Products & Services">
              <p>{sme.products}</p>
            </DetailSection>
          )}

          {/* Financials */}
          <DetailSection icon={<BarChart3 className="w-5 h-5" />} title="Financials">
            <div className="grid grid-cols-2 gap-5">
              {[
                { label: "Annual Revenue", value: sme.revenue },
                { label: "Net Profit", value: sme.profit },
                { label: "Operating Expenses", value: sme.expenses },
                { label: "Team Size", value: `${sme.employees} staff` },
              ].map((m) => (
                <div key={m.label} className="detail-metric">
                  <div className="detail-metric-label">{m.label}</div>
                  <div className="detail-metric-value">{m.value}</div>
                </div>
              ))}
            </div>
          </DetailSection>

          {/* Funding Details */}
          <DetailSection icon={<Shield className="w-5 h-5" />} title="Funding Details">
            <div className="grid grid-cols-2 gap-5 mb-6">
              {[
                { label: "Funding Goal", value: fmtLKR(sme.goal) },
                { label: "Equity Offered", value: `${sme.equity}%` },
                { label: "Min. Investment", value: fmtLKR(sme.minInvest) },
                { label: "Implied Valuation", value: fmtLKR(impliedValuation) },
              ].map((m) => (
                <div key={m.label} className="detail-metric">
                  <div className="detail-metric-label">{m.label}</div>
                  <div className="detail-metric-value">{m.value}</div>
                </div>
              ))}
            </div>

            {sme.useOfFunds.length > 0 && (
              <div className="mt-2">
                <div className="text-[13px] font-semibold text-foreground mb-3">Use of Funds:</div>
                <div className="flex flex-col gap-2.5">
                  {sme.useOfFunds.map((f) => (
                    <div key={f.label} className="flex items-center gap-3">
                      <span className="text-[13px] text-muted-foreground min-w-[120px]">
                        {f.label}
                      </span>
                      <div className="flex-1 h-[7px] bg-vl-green-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-vl-green-200 rounded-full transition-all"
                          style={{ width: `${f.pct}%` }}
                        />
                      </div>
                      <span className="text-[13px] font-semibold text-primary min-w-[36px] text-right">
                        {f.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DetailSection>

          {/* Growth Strategy */}
          {sme.growthPlan && (
            <DetailSection icon={<TrendingUp className="w-5 h-5" />} title="Growth Strategy">
              <p>{sme.growthPlan}</p>
            </DetailSection>
          )}

          {/* Documents */}
          <DetailSection icon={<FileText className="w-5 h-5" />} title="Documents">
            <div className="flex flex-col gap-3">
              {docs.map((doc) => (
                <div
                  key={doc.label}
                  className="detail-doc-row"
                >
                  <div className="flex items-center gap-3">
                    <div className="detail-doc-icon text-vl-green-800">
                      <span className="material-symbols-outlined text-[20px]">{doc.icon}</span>
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-foreground">{doc.label}</div>
                      <div className="text-[11px] text-muted-foreground uppercase">{doc.sub}</div>
                    </div>
                  </div>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail-doc-download"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Not available</span>
                  )}
                </div>
              ))}
            </div>
          </DetailSection>

          {/* Founder */}
          <DetailSection icon={<Users className="w-5 h-5" />} title="Founder">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-vl-green-100 flex items-center justify-center text-xl font-bold text-vl-green-800 shrink-0 border-2 border-vl-green-200/40">
                {sme.ownerInitials}
              </div>
              <div>
                <div className="text-[16px] font-bold text-foreground">{sme.owner}</div>
                <div className="text-[13px] text-muted-foreground mt-0.5">{sme.ownerRole}</div>
                <div className="flex gap-2 mt-2">
                  <span className="detail-founder-badge detail-founder-badge--verified">
                    ✓ Verified
                  </span>
                  {sme.location && (
                    <span className="detail-founder-badge detail-founder-badge--location">
                      📍 Sri Lankan
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DetailSection>
        </div>

        {/* ===== RIGHT SIDEBAR ===== */}
        <div className="space-y-5 max-[900px]:order-first" style={{ position: "sticky", top: 80 }}>
          {/* Investment Opportunity */}
          <div className="detail-sidebar-card text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground mb-4">
              <BarChart3 className="w-3.5 h-3.5" /> Investment Opportunity
            </div>
            <div className="text-[2rem] font-extrabold text-primary leading-tight">{fmtLKR(sme.goal)}</div>
            <div className="text-[14px] text-muted-foreground mb-4">
              for {sme.equity}% Equity
            </div>

            <hr className="border-border/60 my-4" />

            {/* Funding Progress */}
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
              <TrendingUp className="w-3.5 h-3.5" /> Funding Progress
            </div>
            <div className="text-[2.2rem] font-extrabold text-primary leading-tight">{pct}%</div>
            <div className="text-[13px] text-muted-foreground mb-3">
              {fmtLKR(sme.committed)} of {fmtLKR(sme.goal)} committed
            </div>
            <div className="sme-card-progress-track mb-4">
              <div className="sme-card-progress-bar" style={{ width: `${pct}%` }} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div>
                <div className="detail-metric-label">Min Investment</div>
                <div className="text-sm font-bold text-foreground">{fmtLKR(sme.minInvest)}</div>
              </div>
              <div>
                <div className="detail-metric-label">Deadline</div>
                <div className="text-sm font-bold text-vl-amber-400">{sme.deadline}</div>
              </div>
              <div>
                <div className="detail-metric-label">Est. Year</div>
                <div className="text-sm font-bold text-foreground">{sme.yearEstablished || "N/A"}</div>
              </div>
              <div>
                <div className="detail-metric-label">Valuation</div>
                <div className="text-sm font-bold text-foreground">{fmtLKR(impliedValuation)}</div>
              </div>
            </div>
          </div>

          {/* Equity Calculator */}
          <div className="detail-sidebar-card-dark">
            <div className="flex items-center gap-2 text-white/90 text-sm font-semibold mb-3">
              <Calculator className="w-4 h-4" /> Equity Calculator
            </div>
            <label className="text-xs text-white/60 mb-1.5 block">Your Investment Amount (LKR)</label>
            <Input
              type="number"
              value={calcAmount}
              onChange={(e) => setCalcAmount(e.target.value)}
              placeholder={`e.g. ${sme.minInvest > 0 ? sme.minInvest.toLocaleString() : "1,000,000"}`}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-lg mb-3 focus-visible:ring-white/30"
            />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1">Equity %</div>
                <div className="text-lg font-bold text-white">{calcEquity}%</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1">Ownership</div>
                <div className="text-lg font-bold text-white">{calcOwnership}%</div>
              </div>
            </div>
            <div className="text-[10px] text-white/40 text-center italic">
              Based on company valuation
            </div>
          </div>

          {/* CTA */}
          <div className="detail-sidebar-cta">
            <h3 className="text-[16px] font-bold text-white mb-1.5">Ready to Invest?</h3>
            <p className="text-[12px] text-white/65 mb-1 leading-relaxed">
              Express your interest in this business opportunity.
            </p>
            <p className="text-[12px] text-white/65 mb-4 leading-relaxed">
              No payment is collected on this platform.
            </p>
            <Button
              onClick={onCommit}
              variant="secondary"
              className="w-full rounded-full font-bold py-3 text-[14px] text-vl-green-800 hover:bg-white"
            >
              Commit to Invest →
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="detail-disclaimer">
            <strong className="flex items-center gap-1 mb-1">
              ⚠ Disclaimer
            </strong>
            This platform does not handle financial transactions. Commitments are expressions of interest only.
            Please conduct your own due diligence before investing.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-component ─── */
function DetailSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="detail-section">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="text-primary">{icon}</span>
        <h2 className="text-[1.3rem] font-extrabold text-foreground tracking-tight">{title}</h2>
      </div>
      <div className="text-[14px] text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}
