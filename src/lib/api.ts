const API_BASE = "http://localhost:5000/api";

export const INDUSTRY_COLORS: Record<string, string> = {
  Technology: "#185FA5",
  "Agriculture & Food": "#3B6D11",
  "Tourism & Hospitality": "#854F0B",
  Manufacturing: "#6B21A8",
  "Retail & E-commerce": "#B91C1C",
  Healthcare: "#0F6E56",
  "Apparel & Fashion": "#993556",
  Construction: "#78716C",
  Education: "#1E40AF",
  Fisheries: "#0369A1",
};

export function fmtLKR(n: number): string {
  if (n >= 1e9) return "LKR " + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "LKR " + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "LKR " + (n / 1e3).toFixed(0) + "K";
  return "LKR " + n.toLocaleString();
}

export function getInitials(name: string): string {
  if (!name) return "NA";
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function mapStage(stage: string): string {
  if (!stage) return "Startup";
  const s = stage.toLowerCase();
  if (s.includes("established") || s.includes("growth") || s.includes("mature"))
    return "Established";
  return "Startup";
}

export function gradientForColor(c: string): string {
  return `linear-gradient(135deg, ${c}cc, ${c}88)`;
}

export interface SMEData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  problem: string;
  industry: string;
  location: string;
  district: string;
  stage: string;
  stageRaw: string;
  owner: string;
  ownerRole: string;
  ownerInitials: string;
  ownerEmail: string;
  ownerUid: string;
  color: string;
  goal: number;
  equity: number;
  committed: number;
  minInvest: number;
  deadline: string;
  employees: number;
  revenue: string;
  profit: string;
  expenses: string;
  products: string;
  growthPlan: string;
  yearEstablished: string;
  regNo: string;
  useOfFunds: { label: string; pct: number }[];
  tags: string[];
  verified: boolean;
  docUrls: {
    pitchDeck: string;
    financials: string;
    registration: string;
    bankStatement: string;
  };
}

export function mapCampaignToCard(data: any): SMEData {
  const fin = data.financials || {};
  const docs = data.documents || {};
  return {
    id: data.id,
    name: data.businessName || "Unnamed Business",
    tagline: data.tagline || "",
    description: data.description || "",
    problem: data.problemSolution || "",
    industry: data.industry || "Other",
    location: data.city || data.district || "",
    district: data.district || "",
    stage: mapStage(data.stage),
    stageRaw: data.stage || "",
    owner: data.ownerName || "",
    ownerRole: "Founder & CEO",
    ownerInitials: getInitials(data.ownerName),
    ownerEmail: data.ownerEmail || "",
    ownerUid: data.ownerUid || "",
    color: INDUSTRY_COLORS[data.industry] || "#3B6D11",
    goal: data.fundingGoalLkr || 0,
    equity: data.equityOfferedPct || 0,
    committed: data.committedLkr || 0,
    minInvest: data.minInvestmentLkr || 0,
    deadline: data.deadline || "TBD",
    employees: fin.employees || 0,
    revenue: fin.revenueLkr ? fmtLKR(fin.revenueLkr) + "/yr" : "N/A",
    profit: fin.profitLkr ? fmtLKR(fin.profitLkr) + "/yr" : "Pre-profit",
    expenses: fin.opexLkr ? fmtLKR(fin.opexLkr) + "/yr" : "N/A",
    products: data.products || "",
    growthPlan: data.growthPlan || "",
    yearEstablished: data.yearEstablished || "",
    regNo: data.regNo || "",
    useOfFunds: (data.useOfFunds || []).map((f: any) => ({
      label: f.category || "Other",
      pct: f.percent || 0,
    })),
    tags: [data.industry, data.stage].filter(Boolean),
    verified: true,
    docUrls: {
      pitchDeck: docs.pitchDeckUrl || "",
      financials: docs.financialsUrl || "",
      registration: docs.registrationUrl || "",
      bankStatement: docs.bankStatementUrl || "",
    },
  };
}

export interface Commitment {
  id: string;
  campaignId: string;
  campaignName: string;
  investmentAmountLkr: number;
  status: string;
  message?: string;
  createdAt: number | null;
  investorUid: string;
  ownerUid: string;
  ownerEmail: string;
}

// API functions
export async function fetchCampaigns(): Promise<SMEData[]> {
  const response = await fetch(`${API_BASE}/campaigns`);
  if (!response.ok) throw new Error("Failed to fetch campaigns");
  const data = await response.json();
  return data.map((d: any) => mapCampaignToCard(d));
}

export async function fetchMyCommitments(token: string): Promise<Commitment[]> {
  const response = await fetch(`${API_BASE}/commitments/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch commitments");
  return response.json();
}

export async function fetchCampaignCommitment(
  token: string,
  campaignId: string,
): Promise<any> {
  const response = await fetch(
    `${API_BASE}/commitments/campaign/${campaignId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!response.ok) throw new Error("Failed to fetch commitment");
  return response.json();
}

export async function createCommitment(
  token: string,
  data: {
    amount: number;
    message: string;
    campaignId: string;
    campaignName: string;
    ownerUid: string;
    ownerEmail: string;
  },
): Promise<void> {
  const response = await fetch(`${API_BASE}/commitments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create commitment");
}

export async function updateCommitment(
  token: string,
  campaignId: string,
  commitmentId: string,
  data: { newAmount: number; message: string; delta: number },
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/commitments/${campaignId}/${commitmentId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    },
  );
  if (!response.ok) throw new Error("Failed to update commitment");
}

export async function deleteCommitment(
  token: string,
  campaignId: string,
  commitmentId: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/commitments/${campaignId}/${commitmentId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!response.ok) throw new Error("Failed to delete commitment");
}

export async function createUser(
  token: string,
  data: { name: string; email: string; phone: string },
): Promise<void> {
  const response = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create user");
}
