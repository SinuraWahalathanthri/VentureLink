import { type SMEData, fmtLKR, gradientForColor } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface SMECardProps {
  sme: SMEData;
  onClick: () => void;
}

export default function SMECard({ sme, onClick }: SMECardProps) {
  const pct = sme.goal > 0 ? Math.round((sme.committed / sme.goal) * 100) : 0;

  return (
    <div
      className="sme-card-v2 overflow-hidden cursor-pointer relative group"
      onClick={onClick}
    >
      {/* Header gradient */}
      <div className="relative h-[150px] overflow-hidden rounded-t-[18px]">
        <div className="w-full h-full" style={{ background: gradientForColor(sme.color) }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <span className="sme-card-tag-industry">
            {sme.industry}
          </span>
          <span className={`sme-card-tag-stage ${
            sme.stage === "Startup"
              ? "sme-card-tag-stage--startup"
              : "sme-card-tag-stage--established"
          }`}>
            {sme.stage}
          </span>
        </div>
      </div>

      {/* Owner avatar — overlapping header/body, appears on hover */}
      <div className="absolute top-[120px] left-4 z-10 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out">
        <div className="sme-card-avatar">
          {sme.ownerInitials}
        </div>
      </div>

      {/* Body */}
      <div className="pt-9 px-5 pb-5">
        <h3 className="text-[1.1rem] font-bold text-vl-green-800 mb-0.5 flex items-center gap-1">
          {sme.name}
          {sme.verified && <span className="text-primary text-[14px]">✓</span>}
        </h3>
        <p className="text-[13px] text-muted-foreground mb-2 leading-snug">{sme.tagline}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
          {sme.location}
        </div>

        <hr className="border-border/60 mb-4" />

        {/* Funding info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="sme-card-label">Funding Goal</div>
            <div className="sme-card-value">{fmtLKR(sme.goal)}</div>
          </div>
          <div>
            <div className="sme-card-label">Equity Offered</div>
            <div className="sme-card-value">{sme.equity}%</div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-primary">{fmtLKR(sme.committed)} raised</span>
            <span className="text-muted-foreground font-medium">{pct}%</span>
          </div>
          <div className="sme-card-progress-track">
            <div
              className="sme-card-progress-bar"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-1">
          <span className="text-xs text-muted-foreground">
            Closes <strong className="text-vl-amber-400">{sme.deadline}</strong>
          </span>
          <Button
            size="sm"
            className="sme-card-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            View Details →
          </Button>
        </div>
      </div>
    </div>
  );
}
