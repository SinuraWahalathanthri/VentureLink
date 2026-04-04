import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchCampaigns,
  fetchCampaignCommitment,
  type SMEData,
  type Commitment,
} from "@/lib/api";
import Navbar from "@/components/Navbar";
import DetailPage from "@/components/landing/DetailPage";
import CommitModal from "@/components/landing/CommitModal";
import AuthModal from "@/components/landing/AuthModal";
import { useAuth } from "@/contexts/AuthContext";

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, getToken } = useAuth();

  const [sme, setSme] = useState<SMEData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showCommit, setShowCommit] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [existingCommitment, setExistingCommitment] = useState<Commitment | null>(null);

  // Load the campaign by id
  const loadCampaign = useCallback(async () => {
    setLoading(true);
    try {
      const all = await fetchCampaigns();
      const found = all.find((c) => c.id === id) ?? null;
      if (!found) setNotFound(true);
      setSme(found);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  // Called when the investor clicks "Commit to Invest"
  const handleCommit = async () => {
    if (!currentUser) {
      setShowAuth(true);
      return;
    }
    if (!sme) return;

    try {
      const token = await getToken();
      if (token) {
        const existing = await fetchCampaignCommitment(token, sme.id);
        setExistingCommitment(existing && existing.id ? existing : null);
      } else {
        setExistingCommitment(null);
      }
    } catch {
      setExistingCommitment(null);
    }
    setShowCommit(true);
  };

  // After a successful commit, re-fetch so the funding bar reflects the change
  const handleSuccess = () => {
    loadCampaign();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-40 flex flex-col items-center gap-4 text-muted-foreground">
          <div className="loading-spinner" />
          <p>Loading campaign…</p>
        </div>
      </>
    );
  }

  if (notFound || !sme) {
    return (
      <>
        <Navbar />
        <div className="pt-40 text-center text-muted-foreground">
          <p className="text-2xl font-serif mb-4">Campaign not found</p>
          <button
            onClick={() => navigate("/")}
            className="text-primary font-semibold hover:underline"
          >
            ← Back to listings
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* The detail view is always the background — modal overlays it correctly */}
      <DetailPage
        sme={sme}
        onBack={() => navigate("/")}
        onCommit={handleCommit}
      />

      <CommitModal
        sme={sme}
        open={showCommit}
        onOpenChange={setShowCommit}
        onSuccess={handleSuccess}
        existingCommitment={existingCommitment}
      />

      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </>
  );
}
