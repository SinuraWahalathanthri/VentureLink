import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import InvestorDashboard from "./pages/InvestorDashboard.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import SMEOwnerPage from "./pages/SMEOwnerPage.tsx";
import CampaignDetail from "./pages/CampaignDetail.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/investor/dashboard" element={<InvestorDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/sme/register" element={<SMEOwnerPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
