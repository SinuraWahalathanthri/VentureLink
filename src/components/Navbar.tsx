import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[999] bg-card/95 backdrop-blur-[12px] border-b flex items-center justify-between px-8 h-16">
      <Link to="/" className="flex items-center gap-2.5 cursor-pointer">
        <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
          V
        </div>
        <span className="font-serif text-xl text-vl-green-800">
          Venture<span className="text-primary">Link</span>
        </span>
      </Link>

      <div className="flex items-center gap-8">
        <Link to="/" className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors">
          Discover
        </Link>
        <a href="#how-it-works" className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors">
          How It Works
        </a>
        <a href="#why-invest" className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors">
          Why VentureLink
        </a>
        <Link to="/sme/register" className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors">
          Register SME
        </Link>
      </div>

      <div className="flex gap-2.5">
        {currentUser ? (
          <>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate("/investor/dashboard")}>
              My Portfolio
            </Button>
            <Button size="sm" className="rounded-full" onClick={() => signOut()}>
              Sign Out
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate("/auth")}>
              Log In
            </Button>
            <Button size="sm" className="rounded-full" onClick={() => navigate("/sme/register")}>
              List Your SME
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
