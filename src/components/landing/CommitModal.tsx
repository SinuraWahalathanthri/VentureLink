import { useState, useEffect } from "react";
import { type SMEData, type Commitment, fmtLKR, createCommitment, updateCommitment } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";

interface CommitModalProps {
  sme: SMEData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** If provided, the modal will be in edit mode for this existing commitment */
  existingCommitment?: Commitment | null;
}

export default function CommitModal({ sme, open, onOpenChange, onSuccess, existingCommitment }: CommitModalProps) {
  const isEditMode = !!existingCommitment;
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const { toast } = useToast();

  // Pre-fill fields when switching to edit mode or changing commitment
  useEffect(() => {
    if (existingCommitment) {
      setAmount(String(existingCommitment.investmentAmountLkr));
      setMessage(existingCommitment.message || "");
    } else {
      setAmount("");
      setMessage("");
    }
  }, [existingCommitment, open]);

  if (!sme) return null;

  // --- Validation derived values ---
  const numAmount = parseFloat(amount) || 0;

  // In edit mode, the investor is replacing their old commitment, so add it back
  // to the remaining capacity before checking.
  const alreadyOwned = isEditMode ? (existingCommitment?.investmentAmountLkr ?? 0) : 0;
  const remaining = Math.max(0, sme.goal - sme.committed + alreadyOwned);
  const maxAllowed = remaining; // cannot go beyond 100% funded

  const belowMin = numAmount > 0 && numAmount < sme.minInvest;
  const aboveMax = numAmount > maxAllowed;
  const hasError = belowMin || aboveMax;

  const amountErrorMsg = belowMin
    ? `Minimum investment is ${fmtLKR(sme.minInvest)}`
    : aboveMax
    ? `Maximum you can invest is ${fmtLKR(maxAllowed)} (campaign would exceed 100% funded)`
    : null;

  // Projected funding bar
  const projectedCommitted = sme.committed - alreadyOwned + numAmount;
  const projectedPct = sme.goal > 0 ? Math.min(100, Math.round((projectedCommitted / sme.goal) * 100)) : 0;
  const currentPct = sme.goal > 0 ? Math.min(100, Math.round(((sme.committed - alreadyOwned) / sme.goal) * 100)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!numAmount || numAmount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    if (belowMin) {
      toast({ title: `Minimum investment is ${fmtLKR(sme.minInvest)}`, variant: "destructive" });
      return;
    }
    if (aboveMax) {
      toast({ title: `Amount exceeds campaign capacity by ${fmtLKR(numAmount - maxAllowed)}`, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast({ title: "Please sign in first", variant: "destructive" });
        return;
      }

      if (isEditMode && existingCommitment) {
        const delta = Number(numAmount.toFixed(2)) - existingCommitment.investmentAmountLkr;
        await updateCommitment(token, existingCommitment.campaignId, existingCommitment.id, {
          newAmount: Number(numAmount.toFixed(2)),
          message,
          delta,
        });
        toast({ title: "Commitment updated successfully!" });
      } else {
        await createCommitment(token, {
          amount: Number(numAmount.toFixed(2)),
          message,
          campaignId: sme.id,
          campaignName: sme.name,
          ownerUid: sme.ownerUid,
          ownerEmail: sme.ownerEmail,
        });
        toast({ title: "Commitment submitted successfully!" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-card max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-vl-green-800 flex items-center gap-2">
            {isEditMode && <Pencil className="w-5 h-5 text-primary" />}
            {isEditMode ? `Edit Commitment — ${sme.name}` : `Commit to ${sme.name}`}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Your current commitment: ${fmtLKR(existingCommitment!.investmentAmountLkr)}. Update the amount or message below.`
              : `Express your investment interest. Min: ${fmtLKR(sme.minInvest)}`}
          </DialogDescription>
        </DialogHeader>

        {isEditMode && existingCommitment && (
          <div className="bg-accent/60 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current commitment</span>
            <span className="font-bold text-primary text-base">
              {fmtLKR(existingCommitment.investmentAmountLkr)}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="space-y-2">
            <Label>{isEditMode ? "New Investment Amount (LKR)" : "Investment Amount (LKR)"}</Label>
            <Input
              type="number"
              step="any"
              min={sme.minInvest}
              max={maxAllowed}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min ${fmtLKR(sme.minInvest)}`}
              className={`rounded-full ${hasError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              required
            />
            {/* Inline validation error */}
            {amountErrorMsg && (
              <p className="text-xs text-destructive flex items-center gap-1 pl-1">
                <span>⚠</span> {amountErrorMsg}
              </p>
            )}
            {/* Range hint */}
            {!amountErrorMsg && sme.minInvest > 0 && (
              <p className="text-[11px] text-muted-foreground pl-1">
                Range: {fmtLKR(sme.minInvest)} – {fmtLKR(maxAllowed)}
              </p>
            )}
          </div>

          {/* Live projected funding bar */}
          {numAmount > 0 && !hasError && (
            <div className="bg-muted/60 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Projected funding after your investment</span>
                <span className="font-semibold text-primary">{projectedPct}%</span>
              </div>
              <div className="h-2 bg-vl-green-50 rounded-full overflow-hidden">
                {/* Base (already committed, excluding user's old amount) */}
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-vl-green-200 transition-all duration-300"
                  style={{ width: `${projectedPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Before: {currentPct}%</span>
                <span>Goal: {fmtLKR(sme.goal)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Message to Owner (optional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the founder why you want to invest..."
              className="rounded-2xl"
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full rounded-full" disabled={loading || hasError}>
            {loading
              ? isEditMode ? "Saving..." : "Submitting..."
              : isEditMode ? "Save Changes" : "Submit Commitment"}
          </Button>

          <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
            ⚠ This is an expression of interest, not a binding financial commitment. No money will be transferred through this platform.
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
