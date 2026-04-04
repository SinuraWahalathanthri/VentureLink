import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[999] bg-card/95 backdrop-blur-[12px] border-b">
      <div className="flex items-center justify-between px-4 md:px-8 h-16">
        <Link
          to="/"
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={closeMenu}
        >
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
            V
          </div>
          <span className="font-serif text-xl text-vl-green-800">
            Venture<span className="text-primary">Link</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors"
          >
            Discover
          </Link>
          <a
            href="#how-it-works"
            className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors"
          >
            How It Works
          </a>
          <a
            href="#why-invest"
            className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors"
          >
            Why VentureLink
          </a>
          <Link
            to="/sme/register"
            className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors"
          >
            Register SME
          </Link>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex gap-2.5">
          {currentUser ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => navigate("/investor/dashboard")}
              >
                My Portfolio
              </Button>
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => navigate("/auth")}
              >
                Log In
              </Button>
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => navigate("/sme/register")}
              >
                List Your SME
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-primary"
          onClick={toggleMenu}
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Content */}
      {isOpen && (
        <div className="md:hidden border-t bg-card px-4 py-4 space-y-4 shadow-lg shadow-black/5">
          <div className="flex flex-col gap-4">
            <Link
              to="/"
              className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors"
              onClick={closeMenu}
            >
              Discover
            </Link>
            <a
              href="#how-it-works"
              className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors"
              onClick={closeMenu}
            >
              How It Works
            </a>
            <a
              href="#why-invest"
              className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors"
              onClick={closeMenu}
            >
              Why VentureLink
            </a>
            <Link
              to="/sme/register"
              className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors"
              onClick={closeMenu}
            >
              Register SME
            </Link>
          </div>

          <div className="flex flex-col gap-2.5 pt-4 border-t">
            {currentUser ? (
              <>
                <Button
                  variant="outline"
                  className="w-full rounded-full justify-center"
                  onClick={() => {
                    closeMenu();
                    navigate("/investor/dashboard");
                  }}
                >
                  My Portfolio
                </Button>
                <Button
                  className="w-full rounded-full justify-center"
                  onClick={() => {
                    closeMenu();
                    signOut();
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full rounded-full justify-center"
                  onClick={() => {
                    closeMenu();
                    navigate("/auth");
                  }}
                >
                  Log In
                </Button>
                <Button
                  className="w-full rounded-full justify-center"
                  onClick={() => {
                    closeMenu();
                    navigate("/sme/register");
                  }}
                >
                  List Your SME
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
