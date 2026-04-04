import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  industry: string;
  onIndustryChange: (val: string) => void;
  size: string;
  onSizeChange: (val: string) => void;
  stage: string;
  onStageChange: (val: string) => void;
  location: string;
  onLocationChange: (val: string) => void;
}

const industries = [
  "Agriculture & Food", "Technology", "Tourism & Hospitality", "Manufacturing",
  "Retail & E-commerce", "Healthcare", "Apparel & Fashion", "Construction", "Education", "Fisheries",
];

const sizes = ["Under LKR 10M", "LKR 10M–100M", "LKR 100M–500M", "Over LKR 500M"];
const stages = ["Startup", "Established"];
const locations = ["Colombo", "Kandy", "Galle", "Jaffna", "Negombo", "Trincomalee", "Matara", "Kurunegala", "Anuradhapura"];

export default function SearchBar({
  searchQuery, onSearchChange, industry, onIndustryChange,
  size, onSizeChange, stage, onStageChange, location, onLocationChange,
}: SearchBarProps) {
  return (
    <section className="bg-card p-10 shadow-vl-md relative z-10">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center gap-3 bg-vl-gray-50 rounded-full py-1.5 px-5 pr-1.5 mb-5 border-2 border-transparent focus-within:border-primary transition-colors">
          <Search className="w-[18px] h-[18px] text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by business name, industry, or location..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-[15px] px-0"
          />
          <Button className="rounded-full whitespace-nowrap px-5">Search</Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <FilterSelect value={industry} onChange={onIndustryChange} placeholder="All Industries" options={industries} />
          <FilterSelect value={size} onChange={onSizeChange} placeholder="All Investment Sizes" options={sizes} />
          <FilterSelect value={stage} onChange={onStageChange} placeholder="All Stages" options={stages} />
          <FilterSelect value={location} onChange={onLocationChange} placeholder="All Locations" options={locations} />
        </div>
      </div>
    </section>
  );
}

function FilterSelect({ value, onChange, placeholder, options }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 min-w-[160px] py-2.5 px-4 rounded-full border-[1.5px] border-border bg-card font-sans text-[13px] text-muted-foreground cursor-pointer outline-none transition-colors focus:border-primary"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
