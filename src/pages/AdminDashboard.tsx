import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Building2, HandCoins, Settings, Users, Bell, Search, LogOut, TrendingUp, TrendingDown, AlertTriangle, ChevronRight } from "lucide-react";
import "@/styles/admin.css";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Building2, label: "Campaigns", id: "campaigns", badge: 3 },
  { icon: HandCoins, label: "Commitments", id: "commitments" },
  { icon: Users, label: "Users", id: "users" },
  { icon: Settings, label: "Settings", id: "settings" },
];

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="flex min-h-screen bg-vl-gray-50 font-dm-sans">
      {/* Sidebar */}
      <aside className="w-[240px] bg-card border-r fixed top-0 left-0 h-screen z-50 flex flex-col">
        <div className="p-5 pb-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">V</span>
            </div>
            <div>
              <div className="text-base font-semibold text-foreground tracking-tight">VentureLink</div>
              <div className="text-[10px] text-primary font-medium tracking-wider uppercase">Admin Portal</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase px-2.5 pt-3 pb-1.5">
            Main
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-full text-[13.5px] mb-0.5 transition-colors ${
                activePage === item.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.badge && (
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  activePage === item.id ? "bg-white/30" : "bg-destructive text-destructive-foreground"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-full bg-muted">
            <div className="w-[30px] h-[30px] bg-primary rounded-full flex items-center justify-center text-[11px] font-semibold text-primary-foreground flex-shrink-0">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">Super Admin</div>
              <div className="text-[10px] text-muted-foreground">Administrator</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-[240px] flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="bg-card border-b px-7 h-[58px] flex items-center gap-4 sticky top-0 z-40">
          <h1 className="text-base font-semibold text-foreground flex-1 capitalize">{activePage}</h1>
          <div className="flex items-center gap-2 bg-muted rounded-full px-3.5 py-1.5 text-[13px] text-muted-foreground min-w-[200px]">
            <Search className="w-3.5 h-3.5" />
            Search...
          </div>
          <button className="w-[34px] h-[34px] rounded-full bg-muted flex items-center justify-center relative hover:bg-accent transition-colors">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] bg-destructive rounded-full border-2 border-card" />
          </button>
        </header>

        <div className="p-7 flex-1">
          {activePage === "dashboard" && <DashboardPage />}
          {activePage === "campaigns" && <CampaignsPage />}
          {activePage === "commitments" && <CommitmentsPage />}
          {activePage === "users" && <UsersPage />}
          {activePage === "settings" && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}

function DashboardPage() {
  const metrics = [
    { label: "Total Campaigns", value: "24", change: "+3 this month", up: true, color: "green" as const },
    { label: "Active Investors", value: "1,847", change: "+12.5%", up: true, color: "blue" as const },
    { label: "Total Committed", value: "LKR 2.4B", change: "+8.3%", up: true, color: "amber" as const },
    { label: "Pending Reviews", value: "7", change: "3 urgent", up: false, color: "red" as const },
  ];

  const colorClasses = {
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        {metrics.map((m) => (
          <Card key={m.label} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center mb-3.5 ${colorClasses[m.color]}`}>
                {m.color === "green" && <Building2 className="w-4 h-4" />}
                {m.color === "blue" && <Users className="w-4 h-4" />}
                {m.color === "amber" && <HandCoins className="w-4 h-4" />}
                {m.color === "red" && <AlertTriangle className="w-4 h-4" />}
              </div>
              <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
              <div className="text-[26px] font-semibold text-foreground leading-none tracking-tight">{m.value}</div>
              <div className={`text-[11px] mt-1.5 flex items-center gap-1 ${m.up ? "text-emerald-600" : "text-destructive"}`}>
                {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {m.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="text-[15px] font-semibold">Recent Campaigns</h3>
          <Button variant="ghost" size="sm" className="text-xs">View All <ChevronRight className="w-3 h-3 ml-1" /></Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-semibold">Lanka Organics</TableCell>
              <TableCell>Agriculture & Food</TableCell>
              <TableCell>LKR 25M</TableCell>
              <TableCell><Badge className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge></TableCell>
              <TableCell className="text-muted-foreground">Jan 15, 2026</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">TechIsland Labs</TableCell>
              <TableCell>Technology</TableCell>
              <TableCell>LKR 50M</TableCell>
              <TableCell><Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge></TableCell>
              <TableCell className="text-muted-foreground">Jan 12, 2026</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Ceylon Spice Co</TableCell>
              <TableCell>Agriculture & Food</TableCell>
              <TableCell>LKR 15M</TableCell>
              <TableCell><Badge className="bg-purple-50 text-purple-700 border-purple-200">Published</Badge></TableCell>
              <TableCell className="text-muted-foreground">Jan 10, 2026</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function CampaignsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-serif text-vl-green-800">Campaign Management</h2>
        <Button className="rounded-full">+ New Campaign</Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead>Committed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                Campaign data loads from your backend API
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function CommitmentsPage() {
  return (
    <div>
      <h2 className="text-xl font-serif text-vl-green-800 mb-6">All Commitments</h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Investor</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                Commitment data loads from your backend API
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function UsersPage() {
  return (
    <div>
      <h2 className="text-xl font-serif text-vl-green-800 mb-6">User Management</h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                User data loads from your backend API
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function SettingsPage() {
  return (
    <div>
      <h2 className="text-xl font-serif text-vl-green-800 mb-6">Settings</h2>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5">Platform Name</label>
            <Input defaultValue="VentureLink" className="rounded-full max-w-md" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5">Admin Email</label>
            <Input defaultValue="admin@venturelink.lk" className="rounded-full max-w-md" />
          </div>
          <Button className="rounded-full">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
