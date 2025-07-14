/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

import {
  Home,
  TreePine,
  TrendingUp,
  Settings,
  Wallet,
  Leaf,
  BadgeCheck,
  ChevronRight,
  Menu,
  User
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useContractInteraction } from "@/components/contract/ContractInteraction";
import { useConnectWallet } from "@/context/walletcontext";

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
export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const { ConnectWallet, walletAddress, setWalletAddress } = useConnectWallet();
  const { initializeProvider } = useContractInteraction();
  const [update, setUpdate] = useState(0);

  useEffect(() => {
    const checkWallet = async () => {
      if (window.ethereum) {
        try {
          initializeProvider();
          if (typeof window !== "undefined" && window?.ethereum) {
            try {
              const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
              if (accounts.length > 0) {
                setWalletAddress(accounts[0]);
              }
            } catch (err) {
              console.error("Wallet check failed:", err);
            }
          }
        } catch (err) {
          console.error("Error checking wallet:", err);
        }
      }
    };
    checkWallet();
  }, [update]);

   const checkWalletoutSide = async () => {
     if (typeof window !== "undefined" && window.ethereum) {
       try {
         initializeProvider();
         const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
         if (accounts.length > 0) {
           setWalletAddress(accounts[0]);
         }
       } catch (err) {
         console.error("Wallet connection failed:", err);
       }
     }
   };


  // const connectWallet = async () => {
  //   if (window.ethereum) {
  //     try {
  //       const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  //       setWalletConnected(true);
  //       setWalletAddress(accounts[0]);
  //     } catch (err) {
  //       console.error("Error connecting wallet:", err);
  //     }
  //   }
  // };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress("");
  };

  const formatAddress = (addr) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`;

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
                <Leaf className="w-6 h-6 text-white" />
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
                <Link
                  key={title}
                  to={url}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${location.pathname === url
                      ? "bg-green-100 text-green-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{title}</span>
                </Link>
              ))}
            </nav>

            {/* Wallet */}
            <div className="flex items-center space-x-4">
              {walletAddress ? (
                <>
                  {/* <Badge className="bg-green-100 text-green-700 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Connected
                  </Badge> */}
                  <Button
                    variant="outline"
                    onClick={disconnectWallet}
                    className="hidden sm:flex items-center space-x-2"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>{formatAddress(walletAddress)}</span>
                  </Button>
                </>
              ) : (
                <Button
                  onClick={()=>checkWalletoutSide()}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
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
                    {navigationItems.map(({ title, url, icon: Icon, description }) => (
                      <Link
                        key={title}
                        to={url}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${location.pathname === url
                            ? "bg-green-100 text-green-700"
                            : "text-gray-600 hover:bg-gray-50"
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5" />
                          <div>
                            <span className="font-medium">{title}</span>
                            <p className="text-xs text-gray-500">{description}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
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
