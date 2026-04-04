import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Plus, X, Check } from "lucide-react";
import "@/styles/sme.css";

const steps = ["Business Info", "Financials", "Documents", "Review"];

const industries = [
  "Agriculture & Food", "Technology", "Tourism & Hospitality", "Manufacturing",
  "Retail & E-commerce", "Healthcare", "Apparel & Fashion", "Construction", "Education", "Fisheries",
];

const districts = [
  "Colombo", "Kandy", "Galle", "Jaffna", "Negombo", "Trincomalee",
  "Matara", "Kurunegala", "Anuradhapura", "Batticaloa",
];

interface FundRow {
  category: string;
  percent: number;
}

export default function SMEOwnerPage() {
  const { currentUser, getToken } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Business Info
  const [businessName, setBusinessName] = useState("");
  const [tagline, setTagline] = useState("");
  const [industry, setIndustry] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [problemSolution, setProblemSolution] = useState("");
  const [products, setProducts] = useState("");
  const [stage, setStage] = useState("");
  const [yearEstablished, setYearEstablished] = useState("");
  const [regNo, setRegNo] = useState("");
  const [ownerName, setOwnerName] = useState("");

  // Step 2: Financials
  const [fundingGoal, setFundingGoal] = useState("");
  const [equityOffered, setEquityOffered] = useState("");
  const [minInvestment, setMinInvestment] = useState("");
  const [deadline, setDeadline] = useState("");
  const [revenue, setRevenue] = useState("");
  const [profit, setProfit] = useState("");
  const [opex, setOpex] = useState("");
  const [employees, setEmployees] = useState("");
  const [growthPlan, setGrowthPlan] = useState("");
  const [useOfFunds, setUseOfFunds] = useState<FundRow[]>([{ category: "", percent: 0 }]);

  // Step 3: Documents
  const [pitchDeck, setPitchDeck] = useState<File | null>(null);
  const [financialsDoc, setFinancialsDoc] = useState<File | null>(null);
  const [regDoc, setRegDoc] = useState<File | null>(null);
  const [bankStatement, setBankStatement] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  const addFundRow = () => setUseOfFunds([...useOfFunds, { category: "", percent: 0 }]);
  const removeFundRow = (i: number) => setUseOfFunds(useOfFunds.filter((_, idx) => idx !== i));
  const updateFundRow = (i: number, field: "category" | "percent", val: string) => {
    const copy = [...useOfFunds];
    if (field === "percent") copy[i].percent = Number(val);
    else copy[i].category = val;
    setUseOfFunds(copy);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    toast({ title: "Campaign submitted!", description: "Your campaign is pending review." });
    navigate("/");
  };

  const nextStep = () => setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(Math.max(currentStep - 1, 0));

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{
        background: "linear-gradient(160deg, hsl(var(--vl-green-900)) 0%, hsl(var(--vl-green-600)) 55%, hsl(var(--vl-green-400)) 100%)",
      }}
    >
      <Card className="w-full max-w-[560px] rounded-[28px] overflow-hidden shadow-vl-lg">
        {/* Header */}
        <div className="bg-gradient-to-br from-vl-green-800 to-primary px-10 pt-8 pb-6">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-primary-foreground font-bold text-[15px]">
              V
            </div>
            <span className="font-serif text-xl text-primary-foreground">
              Venture<span className="text-vl-green-100">Link</span>
            </span>
          </div>

          {/* Steps */}
          <div className="flex items-center">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold flex-shrink-0 transition-all ${
                  i < currentStep ? "bg-vl-green-100 text-vl-green-800" :
                  i === currentStep ? "bg-primary-foreground text-vl-green-800 shadow-[0_0_0_4px_rgba(255,255,255,0.25)]" :
                  "bg-white/15 text-white/60"
                }`}>
                  {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? "bg-vl-green-100" : "bg-white/20"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {steps.map((s, i) => (
              <span key={s} className={`text-[10px] text-center flex-1 ${i === currentStep ? "text-primary-foreground font-semibold" : "text-white/70"}`}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Body */}
        <CardContent className="p-10">
          {currentStep === 0 && (
            <div>
              <h2 className="text-[1.5rem] font-serif text-vl-green-800 mb-1">Business Information</h2>
              <p className="text-[13px] text-muted-foreground mb-7">Tell us about your business</p>

              <div className="space-y-3.5">
                <FormField label="Business Name" required>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g., Lanka Organics" className="rounded-full" />
                </FormField>
                <FormField label="Owner Name" required>
                  <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Your full name" className="rounded-full" />
                </FormField>
                <FormField label="Tagline">
                  <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One-line description" className="rounded-full" />
                </FormField>
                <div className="grid grid-cols-2 gap-3.5">
                  <FormField label="Industry" required>
                    <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full py-[11px] px-4 rounded-full border-[1.5px] border-border bg-muted font-sans text-sm outline-none focus:border-primary">
                      <option value="">Select...</option>
                      {industries.map((i) => <option key={i}>{i}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Stage">
                    <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full py-[11px] px-4 rounded-full border-[1.5px] border-border bg-muted font-sans text-sm outline-none focus:border-primary">
                      <option value="">Select...</option>
                      <option>Startup</option>
                      <option>Growth</option>
                      <option>Established</option>
                    </select>
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <FormField label="District">
                    <select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full py-[11px] px-4 rounded-full border-[1.5px] border-border bg-muted font-sans text-sm outline-none focus:border-primary">
                      <option value="">Select...</option>
                      {districts.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </FormField>
                  <FormField label="City">
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Colombo" className="rounded-full" />
                  </FormField>
                </div>
                <FormField label="Description" required>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your business..." className="rounded-2xl min-h-[90px]" />
                </FormField>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <h2 className="text-[1.5rem] font-serif text-vl-green-800 mb-1">Financial Details</h2>
              <p className="text-[13px] text-muted-foreground mb-7">Investment terms and financial overview</p>

              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3.5">
                  <FormField label="Funding Goal (LKR)" required>
                    <Input type="number" value={fundingGoal} onChange={(e) => setFundingGoal(e.target.value)} placeholder="25000000" className="rounded-full" />
                  </FormField>
                  <FormField label="Equity Offered (%)" required>
                    <Input type="number" value={equityOffered} onChange={(e) => setEquityOffered(e.target.value)} placeholder="15" className="rounded-full" />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <FormField label="Min Investment (LKR)">
                    <Input type="number" value={minInvestment} onChange={(e) => setMinInvestment(e.target.value)} placeholder="100000" className="rounded-full" />
                  </FormField>
                  <FormField label="Deadline">
                    <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="rounded-full" />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <FormField label="Annual Revenue (LKR)">
                    <Input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} className="rounded-full" />
                  </FormField>
                  <FormField label="Net Profit (LKR)">
                    <Input type="number" value={profit} onChange={(e) => setProfit(e.target.value)} className="rounded-full" />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <FormField label="Operating Expenses (LKR)">
                    <Input type="number" value={opex} onChange={(e) => setOpex(e.target.value)} className="rounded-full" />
                  </FormField>
                  <FormField label="Employees">
                    <Input type="number" value={employees} onChange={(e) => setEmployees(e.target.value)} className="rounded-full" />
                  </FormField>
                </div>

                <FormField label="Use of Funds">
                  <div className="space-y-2.5">
                    {useOfFunds.map((f, i) => (
                      <div key={i} className="grid grid-cols-[1fr_80px_36px] gap-2 items-center">
                        <Input
                          value={f.category}
                          onChange={(e) => updateFundRow(i, "category", e.target.value)}
                          placeholder="e.g., R&D"
                          className="rounded-full text-[13px]"
                        />
                        <Input
                          type="number"
                          value={f.percent || ""}
                          onChange={(e) => updateFundRow(i, "percent", e.target.value)}
                          placeholder="%"
                          className="rounded-full text-[13px]"
                        />
                        <button
                          onClick={() => removeFundRow(i)}
                          className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-destructive hover:bg-red-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" className="rounded-full text-xs" onClick={addFundRow}>
                      <Plus className="w-3 h-3 mr-1" /> Add Row
                    </Button>
                  </div>
                </FormField>

                <FormField label="Growth Plan">
                  <Textarea value={growthPlan} onChange={(e) => setGrowthPlan(e.target.value)} placeholder="How will you use the funds?" className="rounded-2xl min-h-[90px]" />
                </FormField>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-[1.5rem] font-serif text-vl-green-800 mb-1">Documents & Media</h2>
              <p className="text-[13px] text-muted-foreground mb-7">Upload your business documents</p>

              {/* Profile Photo */}
              <div className="mb-5">
                <Label className="text-xs font-semibold uppercase tracking-wide mb-2 block">Profile Photo</Label>
                <label className="flex flex-col items-center p-7 border-2 border-dashed border-border rounded-[20px] cursor-pointer hover:border-primary hover:bg-accent transition-colors">
                  <input type="file" accept="image/*" onChange={handleProfileChange} className="hidden" />
                  {profilePreview ? (
                    <img src={profilePreview} alt="Profile" className="w-20 h-20 rounded-full object-cover mb-2.5" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-2.5">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-[13px] font-semibold text-foreground">Upload Photo</span>
                  <span className="text-[11px] text-muted-foreground">JPG, PNG (max 5MB)</span>
                </label>
              </div>

              {/* Document uploads */}
              <div className="grid grid-cols-2 gap-3">
                <UploadZone label="Pitch Deck" sub="PDF (max 10MB)" file={pitchDeck} onFile={setPitchDeck} />
                <UploadZone label="Financial Docs" sub="PDF or Excel" file={financialsDoc} onFile={setFinancialsDoc} />
                <UploadZone label="Registration Cert" sub="PDF (max 5MB)" file={regDoc} onFile={setRegDoc} />
                <UploadZone label="Bank Statement" sub="PDF (max 5MB)" file={bankStatement} onFile={setBankStatement} />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-[1.5rem] font-serif text-vl-green-800 mb-1">Review & Submit</h2>
              <p className="text-[13px] text-muted-foreground mb-7">Review your campaign details before submission</p>

              <div className="space-y-4">
                <ReviewItem label="Business Name" value={businessName} />
                <ReviewItem label="Industry" value={industry} />
                <ReviewItem label="Location" value={`${city}, ${district}`} />
                <ReviewItem label="Funding Goal" value={`LKR ${Number(fundingGoal).toLocaleString()}`} />
                <ReviewItem label="Equity Offered" value={`${equityOffered}%`} />
                <ReviewItem label="Min Investment" value={`LKR ${Number(minInvestment).toLocaleString()}`} />
                <ReviewItem label="Deadline" value={deadline} />
                <ReviewItem label="Documents" value={`${[pitchDeck, financialsDoc, regDoc, bankStatement].filter(Boolean).length}/4 uploaded`} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t mt-6">
            {currentStep > 0 ? (
              <Button variant="outline" className="rounded-full" onClick={prevStep}>← Back</Button>
            ) : (
              <div />
            )}
            {currentStep < steps.length - 1 ? (
              <Button className="rounded-full" onClick={nextStep}>Continue →</Button>
            ) : (
              <Button className="rounded-full" onClick={handleSubmit}>Submit Campaign 🚀</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function UploadZone({ label, sub, file, onFile }: { label: string; sub: string; file: File | null; onFile: (f: File) => void }) {
  return (
    <label className={`flex flex-col items-center p-6 border-2 border-dashed rounded-[20px] cursor-pointer transition-colors ${
      file ? "border-primary bg-accent border-solid" : "border-border hover:border-primary hover:bg-accent"
    }`}>
      <input type="file" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} className="hidden" />
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2.5 ${
        file ? "bg-vl-green-100 text-primary" : "bg-muted text-muted-foreground"
      }`}>
        {file ? <Check className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
      </div>
      <span className="text-[13px] font-semibold text-foreground mb-0.5">
        {file ? file.name.slice(0, 20) : label}
      </span>
      <span className="text-[11px] text-muted-foreground">{sub}</span>
    </label>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-b-0">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="text-[13px] font-semibold text-foreground">{value || "—"}</span>
    </div>
  );
}
