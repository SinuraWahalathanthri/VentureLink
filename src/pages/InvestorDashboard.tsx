import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyCommitments, fetchCampaigns, updateCommitment, deleteCommitment, fmtLKR, type Commitment, type SMEData } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";

export default function InvestorDashboard() {
  const { currentUser, getToken, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [campaignMap, setCampaignMap] = useState<Record<string, SMEData>>({});
  const [loading, setLoading] = useState(true);
  const [totalVal, setTotalVal] = useState(0);

  // Modal state
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentCommit, setCurrentCommit] = useState<Commitment | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMessage, setEditMessage] = useState("");

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate("/auth");
      return;
    }
    if (currentUser) loadData();
  }, [currentUser, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const [data, campaigns] = await Promise.all([
        fetchMyCommitments(token),
        fetchCampaigns(),
      ]);
      const sorted = data
        .map((d) => ({ ...d, investmentAmountLkr: Number(parseFloat(String(d.investmentAmountLkr || 0)).toFixed(2)) }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setCommitments(sorted);
      setTotalVal(sorted.reduce((sum, c) => sum + c.investmentAmountLkr, 0));
      // Build a lookup map so the edit modal can access campaign limits
      const map: Record<string, SMEData> = {};
      campaigns.forEach((c) => { map[c.id] = c; });
      setCampaignMap(map);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (c: Commitment) => {
    setCurrentCommit(c);
    setEditAmount(String(c.investmentAmountLkr));
    setEditMessage(c.message || "");
    setEditOpen(true);
  };

  const openDelete = (c: Commitment) => {
    setCurrentCommit(c);
    setDeleteOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!currentCommit) return;
    const newAmount = parseFloat(editAmount);
    if (!newAmount || newAmount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    const campaign = campaignMap[currentCommit.campaignId];
    if (campaign) {
      if (newAmount < campaign.minInvest) {
        toast({ title: `Minimum investment is ${fmtLKR(campaign.minInvest)}`, variant: "destructive" });
        return;
      }
      const maxAllowed = campaign.goal - campaign.committed + currentCommit.investmentAmountLkr;
      if (newAmount > maxAllowed) {
        toast({
          title: `Amount exceeds campaign capacity by ${fmtLKR(newAmount - maxAllowed)}`,
          description: "Your investment would push this campaign past 100% funded.",
          variant: "destructive",
        });
        return;
      }
    }
    try {
      const token = await getToken();
      if (!token) return;
      const delta = Number(newAmount.toFixed(2)) - currentCommit.investmentAmountLkr;
      await updateCommitment(token, currentCommit.campaignId, currentCommit.id, {
        newAmount: Number(newAmount.toFixed(2)),
        message: editMessage,
        delta,
      });
      setEditOpen(false);
      loadData();
      toast({ title: "Commitment updated" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!currentCommit) return;
    try {
      const token = await getToken();
      if (!token) return;
      await deleteCommitment(token, currentCommit.campaignId, currentCommit.id);
      setDeleteOpen(false);
      loadData();
      toast({ title: "Commitment deleted" });
    } catch (err) {
      console.error(err);
    }
  };

  const statusColor = (status: string) => {
    if (status === "accepted") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "rejected") return "bg-red-50 text-red-700 border-red-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <>
      <Navbar />

      {/* Header */}
      <div className="pt-[100px] pb-10 px-8 bg-card border-b">
        <div className="max-w-[1200px] mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-[2rem] font-serif text-vl-green-900 flex items-center gap-2">
              <User className="w-8 h-8" /> Investor Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Track and manage your committed investments</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Total Portfolio Value</div>
            <div className="text-2xl font-bold text-primary">{fmtLKR(totalVal)}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto mt-10 px-8 pb-16">
        <div className="bg-card rounded-card border overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center">
            <h3 className="text-[1.1rem] font-serif">My Active Commitments</h3>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">SME Campaign</TableHead>
                  <TableHead className="font-semibold">Committed Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <div className="loading-spinner" />
                      <div className="mt-2.5 text-muted-foreground">Loading your portfolio...</div>
                    </TableCell>
                  </TableRow>
                ) : commitments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      You haven't made any commitments yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  commitments.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-vl-green-800">{c.campaignName || "Unknown Campaign"}</TableCell>
                      <TableCell className="font-semibold">LKR {Number(c.investmentAmountLkr).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusColor(c.status)}`}>
                          {c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : "Pending"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Pending"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          <Button variant="outline" size="sm" className="rounded-full" onClick={() => openEdit(c)}>Edit</Button>
                          <Button variant="destructive" size="sm" className="rounded-full" onClick={() => openDelete(c)}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-card max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-serif">Edit Commitment</DialogTitle>
            <DialogDescription>
              {currentCommit?.campaignName
                ? `Updating your commitment to ${currentCommit.campaignName}`
                : "Update your investment details."}
            </DialogDescription>
          </DialogHeader>

          {/* Current commitment banner */}
          {currentCommit && (
            <div className="bg-accent/60 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current commitment</span>
              <span className="font-bold text-primary text-base">
                {fmtLKR(currentCommit.investmentAmountLkr)}
              </span>
            </div>
          )}

          {(() => {
            const campaign = currentCommit ? campaignMap[currentCommit.campaignId] : null;
            const numAmount = parseFloat(editAmount) || 0;
            const alreadyOwned = currentCommit?.investmentAmountLkr ?? 0;
            const minInvest = campaign?.minInvest ?? 0;
            const maxAllowed = campaign ? Math.max(0, campaign.goal - campaign.committed + alreadyOwned) : Infinity;

            const belowMin = numAmount > 0 && minInvest > 0 && numAmount < minInvest;
            const aboveMax = maxAllowed !== Infinity && numAmount > maxAllowed;
            const hasError = belowMin || aboveMax;

            const amountErrorMsg = belowMin
              ? `Minimum investment is ${fmtLKR(minInvest)}`
              : aboveMax
              ? `Maximum allowed is ${fmtLKR(maxAllowed)} (would exceed 100% funded)`
              : null;

            const currentPct = campaign && campaign.goal > 0
              ? Math.min(100, Math.round(((campaign.committed - alreadyOwned) / campaign.goal) * 100))
              : 0;
            const projectedPct = campaign && campaign.goal > 0
              ? Math.min(100, Math.round(((campaign.committed - alreadyOwned + numAmount) / campaign.goal) * 100))
              : 0;

            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>New Investment Amount (LKR)</Label>
                  <Input
                    type="number"
                    step="any"
                    min={minInvest || undefined}
                    max={maxAllowed !== Infinity ? maxAllowed : undefined}
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className={`rounded-full ${hasError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {amountErrorMsg ? (
                    <p className="text-xs text-destructive flex items-center gap-1 pl-1">
                      <span>⚠</span> {amountErrorMsg}
                    </p>
                  ) : campaign && minInvest > 0 ? (
                    <p className="text-[11px] text-muted-foreground pl-1">
                      Range: {fmtLKR(minInvest)} – {fmtLKR(maxAllowed)}
                    </p>
                  ) : null}
                </div>

                {/* Live projected funding bar */}
                {numAmount > 0 && !hasError && campaign && (
                  <div className="bg-muted/60 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Projected funding after update</span>
                      <span className="font-semibold text-primary">{projectedPct}%</span>
                    </div>
                    <div className="h-2 bg-vl-green-50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-vl-green-200 transition-all duration-300"
                        style={{ width: `${projectedPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Before: {currentPct}%</span>
                      <span>Goal: {fmtLKR(campaign.goal)}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    className="rounded-2xl"
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full rounded-full"
                  onClick={handleSaveEdit}
                  disabled={hasError}
                >
                  Save Changes
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-card">
          <DialogHeader>
            <DialogTitle className="font-serif">Delete Commitment</DialogTitle>
            <DialogDescription>Are you sure you want to retract this commitment? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2.5 mt-4">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 rounded-full" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
