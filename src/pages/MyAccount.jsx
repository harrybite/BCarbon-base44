/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Briefcase, ShoppingBag, BadgeCheck } from "lucide-react";
import IssuerTab from "../components/account/IssuerTab";
import BuyerTab from "../components/account/BuyerTab";
import WalletConnection from "../components/wallet/WalletConnection";
import { useConnectWallet } from "@/context/walletcontext";
import CertificatesTab from "@/components/account/CertificateTab";
import MyProjects from "@/components/account/Myproject";
import { useNavigate } from 'react-router-dom';
import { useContractInteraction } from "@/components/contract/ContractInteraction";
import {  useToast } from "@/components/ui/use-toast";


export default function MyAccount() {

  const { walletAddress } = useConnectWallet();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);
  const [isVVB, setIsVVB] = useState(false);
  const { checkIsOwner, checkAuthorizedVVB } = useContractInteraction();

    useEffect(() => {
    // Check wallet connection
    if (!walletAddress || walletAddress === '0x0000000000000000000000000000000000000000') {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet.',
        variant: 'destructive',
      });
      return;
    }
    // Check owner and authorized VVB
    const checkAccess = async () => {
      try {
        const isOwner = await checkIsOwner();
        const isVVB = await checkAuthorizedVVB();
        console.log('isOwner:', isOwner, 'isVVB:', isVVB);
        if (isOwner || isVVB) {
          toast({
            title: 'Access Denied',
            description: 'You are not the owner or an authorized VVB. Redirecting to Administration.',
            variant: 'destructive',
          });
          navigate('/Administration');
        }
      } catch (err) {
        // If check fails, treat as not authorized
        toast({
          title: 'Access Check Failed',
          description: 'Unable to verify access. Redirecting to Administration.',
          variant: 'destructive',
        });
        navigate('/Administration');
      }
    };
    checkAccess();
  }, [walletAddress]);


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
              <p className="text-gray-600">Manage your projects, tCO₂ credits, and retirement certificates</p>
            </div>
          </div>
        </div>

        {/* Tab View */}
        <Tabs defaultValue="issuer" className="space-y-6">
         <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="issuer" className="flex items-center space-x-2">
          <Briefcase className="w-4 h-4" />
          <span>Create Project</span>
        </TabsTrigger>

        <TabsTrigger value="myproject" className="flex items-center space-x-2">
          <Briefcase className="w-4 h-4" />
          <span>My Project</span>
        </TabsTrigger>

        <TabsTrigger value="buyer" className="flex items-center space-x-2">
          <ShoppingBag className="w-4 h-4" />
          <span>My tCO<sub>2</sub> Holdings</span>
        </TabsTrigger>
        <TabsTrigger value="certificate" className="flex items-center space-x-2">
          <BadgeCheck className="w-4 h-4" />
          <span> Certificates</span>
        </TabsTrigger>
      </TabsList>

          <TabsContent value="issuer">
            <IssuerTab walletAddress={walletAddress} />
          </TabsContent>
           <TabsContent value="myproject">
            <MyProjects/>
          </TabsContent>
          <TabsContent value="buyer">
            <BuyerTab walletAddress={walletAddress} />
          </TabsContent>
          <TabsContent value="certificate">
            <CertificatesTab  />
          </TabsContent>
          
        </Tabs>
      </div>
    </div>
  );
}
