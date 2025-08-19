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
  User,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ConnectButton, useActiveAccount, useConnect } from "thirdweb/react";
import { thirdwebclient } from "@/thirwebClient";
import { createWallet } from "thirdweb/wallets";
import { bscTestnet } from "thirdweb/chains"
import { useConnectWallet } from "@/context/walletcontext";
import { apihost } from "@/components/contract/address";
import { useContractInteraction } from "@/components/contract/ContractInteraction";

// Base navigation items (always visible - no authentication required)
const publicNavigationItems = [
  {
    title: "Home",
    url: "https://www.bico2.org",
    icon: Home,
    description: "Platform overview",
    public: true,
    external: true
  },
  {
    title: "Projects",
    url: createPageUrl("Projects"),
    icon: TreePine,
    description: "Carbon credit projects",
    public: true,
    external: false
  }
];

// Authenticated navigation items (require login + wallet)
const authenticatedNavigationItems = [
  {
    title: "Trade",
    url: createPageUrl("Trade"),
    icon: TrendingUp,
    description: "Trade carbon credits",
    public: false
  }
];

// Admin/VVB only navigation item
const adminNavigationItem = {
  title: "Administration",
  url: createPageUrl("Administration"),
  icon: Settings,
  description: "Admin controls"
};

// eslint-disable-next-line react/prop-types, no-unused-vars
export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const { walletAddress } = useConnectWallet();
  const [pendingUrl, setPendingUrl] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const { connect, } = useConnect();
  const { checkAuthorizedVVB, checkIsOwner } = useContractInteraction()
  const account = useActiveAccount();

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
  
  // Check if user is authenticated (both wallet + login)
  const isAuthenticated = walletAddress && userInfo;
  
  // Check if user is admin or VVB
  const isAdminOrVVB = userInfo && (userInfo.role === "gov" || userInfo.role === "vvb");

  // Create navigation items based on user authentication and role (removed My Account from here)
  const getNavigationItems = () => {
    let items = [...publicNavigationItems];
    
    // Add authenticated-only items if user is authenticated
    if (isAuthenticated) {
      items = [...items, ...authenticatedNavigationItems];
    }
    
    // Add admin item for admin/VVB roles
    if (isAdminOrVVB) {
      items.push(adminNavigationItem);
    }
    
    return items;
  };

  const navigationItems = getNavigationItems();

  // Close dropdowns if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    if (userMenuOpen || profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen, profileMenuOpen]);

  // Handle account changes - but only after initial load
  useEffect(() => {
    const initTimer = setTimeout(() => {
      setInitialLoad(false);
    }, 2000);

    return () => clearTimeout(initTimer);
  }, []);

  // Only handle account changes after initial load period
  useEffect(() => {
    if (!initialLoad && account?.address !== walletAddress) {
      if (walletAddress && account?.address && account.address !== walletAddress) {
        console.log("Wallet address changed, logging out");
        localStorage.removeItem("token");
        setUserMenuOpen(false);
        setProfileMenuOpen(false);
        navigate("/login");
      }
    }
  }, [account?.address, walletAddress, initialLoad, navigate]);

  // Handler to navigate or trigger authentication
  const handleNavClick = (url, item) => {
    // Handle external links
    if (item.external) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // Allow public pages without authentication
    if (item.public) {
      navigate(url);
      return;
    }
    
    // For protected pages, require authentication
    if (!walletAddress) {
      connect(async () => {
        const wallet = createWallet("io.metamask");
        await wallet.connect({
          thirdwebclient,
          chain: bscTestnet
        });
        return wallet;
      })
      setPendingUrl(url);
    } else if (!userInfo) {
      // Wallet connected but not logged in
      navigate("/login");
    } else {
      // Fully authenticated
      navigate(url);
    }
  };

  // Listen for wallet connection and redirect if pending
  useEffect(() => {
    if (walletAddress && pendingUrl) {
      if (userInfo) {
        navigate(pendingUrl);
        setPendingUrl(null);
      } else {
        navigate("/login");
        setPendingUrl(null);
      }
    }
  }, [walletAddress, pendingUrl, navigate, userInfo]);

  // Poll token validation every 30 seconds
  useEffect(() => {
    if (initialLoad) return;

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
          console.log("Token expired, logging out");
          localStorage.removeItem("token");
          navigate("/login");
        }
      } catch (err) {
        console.log("Network error during token validation:", err.message);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate, initialLoad]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
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
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  <img src="https://www.bico2.org/_next/image?url=%2Fimg%2Flogo.png&w=96&q=75" className="h-7"/>
                </h1>
                <p className="text-xs text-gray-500">Decentralized Carbon Credits</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <button
                  key={item.title}
                  onClick={() => handleNavClick(item.url, item)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    !item.external && location.pathname === item.url
                      ? "bg-green-100 text-green-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.title}</span>
                  {item.external && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  )}
                  {!item.public && !isAuthenticated && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1 rounded">🔒</span>
                  )}
                </button>
              ))}
            </nav>

            {/* Wallet & Profile Section */}
            <div className="flex items-center space-x-3">
              {/* Wallet Connect Button */}
              <ConnectButton
                client={thirdwebclient}
                wallets={[
                  createWallet("io.metamask"),
                ]}
                chain={bscTestnet}
                data-testid="tw-connect-btn"
              />

              {/* Profile Icon (only show when authenticated) */}
              {isAuthenticated && (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    aria-label="My Account"
                  >
                    <UserCircle className="w-6 h-6" />
                  </button>

                  {/* Profile Dropdown */}
                  <div
                    className={`absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 transition-all duration-200 ${
                      profileMenuOpen 
                        ? "opacity-100 scale-100 pointer-events-auto" 
                        : "opacity-0 scale-95 pointer-events-none"
                    }`}
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {userInfo.email || "User"}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {userInfo.role} Account
                          </p>
                          <p className="text-xs text-gray-400 font-mono truncate">
                            {walletAddress && `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate("/MyAccount");
                          setProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 mr-3 text-blue-500" />
                        <div className="text-left">
                          <div className="font-medium">My Account</div>
                          <div className="text-xs text-gray-500">Manage projects & credits</div>
                        </div>
                      </button>

                      {isAdminOrVVB && (
                        <button
                          onClick={() => {
                            navigate("/Administration");
                            setProfileMenuOpen(false);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 mr-3 text-purple-500" />
                          <div className="text-left">
                            <div className="font-medium">Administration</div>
                            <div className="text-xs text-gray-500">Admin controls</div>
                          </div>
                        </button>
                      )}

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={() => {
                          localStorage.removeItem("token");
                          setProfileMenuOpen(false);
                          navigate("/login");
                        }}
                        className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <div className="text-left">
                          <div className="font-medium">Logout</div>
                          <div className="text-xs text-red-400">Sign out of account</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Button (only show when not authenticated) */}
              {!userInfo && (
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
                    {/* User Info in Mobile Menu */}
                    {userInfo && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                            <User className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {userInfo.email || "User"}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {userInfo.role} Account
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!userInfo && (
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
                    )}

                    {/* My Account Link in Mobile Menu */}
                    {userInfo && (
                      <button
                        onClick={() => {
                          navigate("/MyAccount");
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-between p-4 rounded-lg transition-all duration-200 bg-blue-50 text-blue-700"
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                      >
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">My Account</span>
                            </div>
                            <p className="text-xs text-blue-600">Manage your account and BiCO₂ assets</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    {/* Navigation Items */}
                    {navigationItems.map((item) => (
                      <button
                        key={item.title}
                        onClick={() => {
                          handleNavClick(item.url, item);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                          !item.external && location.pathname === item.url
                            ? "bg-green-100 text-green-700"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="w-5 h-5" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{item.title}</span>
                              {item.external && (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{item.description}</p>
                            {!item.public && !isAuthenticated && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1 rounded mt-1 inline-block">Login Required</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ))}

                    {/* Logout in Mobile Menu */}
                    {userInfo && (
                      <button
                        onClick={() => {
                          localStorage.removeItem("token");
                          setMobileMenuOpen(false);
                          navigate("/login");
                        }}
                        className="flex items-center justify-between p-4 rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50"
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="font-medium">Logout</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
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
                BiCO<sub>2</sub> - Decentralized Carbon Credits Platform
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