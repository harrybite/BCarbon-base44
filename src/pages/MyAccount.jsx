import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Briefcase, ShoppingBag } from "lucide-react";
import IssuerTab from "../components/account/IssuerTab";
import BuyerTab from "../components/account/BuyerTab";
import WalletConnection from "../components/wallet/WalletConnection";

export default function MyAccount() {
  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (err) {
          console.error("Wallet check failed:", err);
        }
      }
    };
    checkWallet();
  }, []);

  if (!walletAddress) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <WalletConnection />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
              <p className="text-gray-600">Manage your projects, credits, and account settings</p>
            </div>
          </div>
        </div>

        {/* Tab View */}
        <Tabs defaultValue="issuer" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="issuer" className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4" />
              <span>Project Owned</span>
            </TabsTrigger>
            <TabsTrigger value="buyer" className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Credit Buyer</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="issuer">
            <IssuerTab walletAddress={walletAddress} />
          </TabsContent>
          <TabsContent value="buyer">
            <BuyerTab walletAddress={walletAddress} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
