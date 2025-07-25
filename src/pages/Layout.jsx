/* eslint-disable no-unused-vars */
import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { jwtDecode } from "jwt-decode";

import {
  Home,
  TreePine,
  TrendingUp,
  Settings,
  Leaf,
  ChevronRight,
  Menu,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ConnectButton, useConnect } from "thirdweb/react";
import { thirdwebclient } from "@/thirwebClient";
import { createWallet } from "thirdweb/wallets";
import { bscTestnet } from "thirdweb/chains"
import { useConnectWallet } from "@/context/walletcontext";
import { apihost } from "@/components/contract/address";



const navigationItems = [
  {
    title: "Home",
    url: createPageUrl("Home"),
    icon: Home,
    description: "Platform overview"
  },
  {
    title: "Projects",
    url: createPageUrl("Projects"),
    icon: TreePine,
    description: "Carbon credit projects"
  },
  {
    title: "Trade",
    url: createPageUrl("Trade"),
    icon: TrendingUp,
    description: "Trade carbon credits"
  },
  // {
  //   title: "Validate",
  //   url: createPageUrl("ValidateCertificate"),
  //   icon: BadgeCheck,
  //   description: "Validate BCO₂ Retirement Certificates on chain"
  // },
  {
    title: "My Account",
    url: createPageUrl("MyAccount"),
    icon: User,
    description: "Manage your projects and BCO₂ assets"
  },
  {
    title: "Administration",
    url: createPageUrl("Administration"),
    icon: Settings,
    description: "Admin controls"
  }
];

// eslint-disable-next-line react/prop-types, no-unused-vars
export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { walletAddress } = useConnectWallet();
  const [pendingUrl, setPendingUrl] = useState(null);
  const { connect, } = useConnect();

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  // Handler to trigger wallet connect and redirect
  const handleNavClick = (url) => {
    if (!walletAddress) {
      connect(async () => {
        // instantiate wallet
        const wallet = createWallet("io.metamask");
        // connect wallet
        await wallet.connect({
          thirdwebclient,
          chain: bscTestnet
        });
        // return the wallet
        return wallet;
      })
      setPendingUrl(url);
    } else {
      navigate(url);
    }
  };

  // Listen for wallet connection and redirect if pending
  useEffect(() => {
    if (walletAddress && pendingUrl) {
      navigate(pendingUrl);
      setPendingUrl(null);
    }
  }, [walletAddress, pendingUrl, navigate]);

  // Poll token validation every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${apihost}/api/protected`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.status === 401) {
          // Token invalid or expired
          localStorage.removeItem("token");
          navigate("/login");
        }
      } catch (err) {
        // Network or server error, treat as logout
        localStorage.removeItem("token");
        navigate("/login");
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [navigate]);


  // Get user info from token
  let userInfo = null;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    try {
      userInfo = jwtDecode(token);
    } catch (e) {
      userInfo = null;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Theme Variables */}
      <style>{`
        :root {
          --primary-green: #16a34a;
          --secondary-green: #22c55e;
          --accent-blue: #3b82f6;
          --dark-green: #15803d;
          --light-green: #dcfce7;
        }
      `}</style>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <img
                  src="https://i.postimg.cc/mkJMjhYT/BCO2-Logo-01.png"
                  alt="BCO2 Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  BCO<sub className="text-sm">2</sub>
                </h1>
                <p className="text-xs text-gray-500">Decentralized Carbon Credits</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map(({ title, url, icon: Icon }) => (
                <button
                  key={title}
                  onClick={() => handleNavClick(url)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${location.pathname === url
                      ? "bg-green-100 text-green-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{title}</span>
                </button>
              ))}
            </nav>

            {/* Wallet & User Dropdown */}
            <div className="flex items-center space-x-4 relative">
              <ConnectButton
                client={thirdwebclient}
                wallets={[
                  createWallet("io.metamask"),
                ]}
                chain={bscTestnet}
                data-testid="tw-connect-btn"
              />
              {userInfo ? (
                <div
                  className="relative"
                  ref={userMenuRef}
                >
                  <button
                    className="flex items-center px-4 py-2 rounded-lg bg-green-100 text-green-700 font-medium transition-all duration-200 focus:outline-none hover:bg-green-200"
                    style={{ minWidth: 90 }}
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-haspopup="true"
                    aria-expanded={userMenuOpen}
                  >
                    <span className="mr-2">
                      {userInfo.role === "user" && "Isuer"}
                      {userInfo.role === "vvb" && "VVB"}
                      {userInfo.role === "gov" && "Gov"}
                    </span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`transition-all duration-200 ease-in-out ${userMenuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"} absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg z-50`}
                    style={{ minWidth: 220 }}
                  >
                    <div className="px-4 py-3 text-gray-700 text-sm border-b flex items-center gap-2">
                      <User className="w-4 h-4 text-green-600" />
                      <span className="truncate">{userInfo.email || userInfo.walletAddress}</span>
                    </div>
                    <button
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 text-sm transition-colors"
                      onClick={() => {
                        localStorage.removeItem("token");
                        setUserMenuOpen(false);
                        navigate("/login");
                      }}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="hidden md:inline-flex"
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
              )}
              {/* Mobile Nav */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col space-y-4 mt-8">
                    {/* Mobile Login Button */}
                    <Button
                      variant="outline"
                      className="mb-2"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/login");
                      }}
                    >
                      Login
                    </Button>
                    {navigationItems.map(({ title, url, icon: Icon, description }) => (
                      <button
                        key={title}
                        onClick={() => {
                          handleNavClick(url);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${location.pathname === url
                            ? "bg-green-100 text-green-700"
                            : "text-gray-600 hover:bg-gray-50"
                          }`}
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5" />
                          <div>
                            <span className="font-medium">{title}</span>
                            <p className="text-xs text-gray-500">{description}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2">
              <Leaf className="w-5 h-5 text-green-600" />
              <p className="text-gray-600">
                BCO<sub>2</sub> - Decentralized Carbon Credits Platform
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <p className="text-sm text-gray-500">Powered by MaalChain & Web3</p>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
