/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useConnectWallet } from "@/context/walletcontext";
import { useNavigate } from 'react-router-dom';
import { useContractInteraction } from "@/components/contract/ContractInteraction";
import { useToast } from "@/components/ui/use-toast";
import { jwtDecode } from "jwt-decode";
import WalletConnection from "../components/wallet/WalletConnection";
import SideMenuAccount from "./sidemanu";

// Import all the tab components
import IssuerTab from "../components/account/IssuerTab";
import BuyerTab from "../components/account/BuyerTab";
import CertificatesTab from "@/components/account/CertificateTab";
import MyProjects from "@/components/account/Myproject";
import MyRequest from "@/components/account/MyRequest";

// Import UI components
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Target, 
  Globe, 
  Users, 
  Settings,
  Bell,
  CreditCard,
  Activity,
  TrendingUp,
  DollarSign,
  Package,
  Award,
  Wallet,
  Calendar,
  Shield
} from "lucide-react";

export default function MyAccount() {
  const { walletAddress } = useConnectWallet();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
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
        setIsOwner(isOwner);
        setIsVVB(isVVB);
        
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

  let userInfo = null;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    try {
      userInfo = jwtDecode(token);
    } catch (e) {
      userInfo = null;
    }
  }

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <AccountOverview userInfo={userInfo} walletAddress={walletAddress} />;
      case 'holdings':
        return <BuyerTab walletAddress={walletAddress} />;
      case 'certificates':
        return <CertificatesTab />;
      case 'portfolio':
        return <PortfolioAnalytics />;
      case 'create-project':
        return <IssuerTab walletAddress={walletAddress} />;
      case 'my-projects':
        return <MyProjects />;
      case 'withdrawal-requests':
        return <MyRequest />;
      case 'project-analytics':
        return <ProjectAnalytics />;
      case 'validation-queue':
        return <ValidationQueue />;
      case 'verification-history':
        return <VerificationHistory />;
      case 'vvb-analytics':
        return <VVBAnalytics />;
      case 'platform-overview':
        return <PlatformOverview />;
      case 'user-management':
        return <UserManagement />;
      case 'system-settings':
        return <SystemSettings />;
      case 'notifications':
        return <NotificationsPanel />;
      case 'payment-methods':
        return <PaymentMethods />;
      default:
        return <AccountOverview userInfo={userInfo} walletAddress={walletAddress} />;
    }
  };

  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <WalletConnection />
      </div>
    );
  }

  return (
    <SideMenuAccount activeSection={activeSection} setActiveSection={setActiveSection}>
      {renderContent()}
    </SideMenuAccount>
  );
}

// Account Overview Component
const AccountOverview = ({ userInfo, walletAddress }) => {
  const getRoleInfo = () => {
    if (!userInfo) return { 
      color: 'gray', 
      badge: 'User', 
      gradient: 'from-gray-500 to-gray-600'
    };
    
    switch (userInfo.role) {
      case 'issuer':
        return { 
          color: 'blue', 
          badge: 'Project Issuer', 
          gradient: 'from-blue-500 to-blue-600'
        };
      case 'user':
        return { 
          color: 'green', 
          badge: 'Carbon Credit Holder', 
          gradient: 'from-green-500 to-green-600'
        };
      case 'gov':
        return { 
          color: 'purple', 
          badge: 'Governance', 
          gradient: 'from-purple-500 to-purple-600'
        };
      case 'vvb':
        return { 
          color: 'orange', 
          badge: 'VVB Authority', 
          gradient: 'from-orange-500 to-orange-600'
        };
      default:
        return { 
          color: 'gray', 
          badge: 'User', 
          gradient: 'from-gray-500 to-gray-600'
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Status</p>
                <p className="text-2xl font-bold text-green-900">Online</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Wallet Status</p>
                <p className="text-2xl font-bold text-blue-900">Connected</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Account Type</p>
                <p className="text-2xl font-bold text-purple-900">{roleInfo.badge}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Member Since</p>
                <p className="text-2xl font-bold text-orange-900">{new Date().getFullYear()}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Details */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="text-lg text-gray-900">{userInfo?.email || 'Not provided'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Role</label>
                <div className="text-lg text-gray-900 capitalize">{userInfo?.role || 'User'}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address</label>
                <div className="text-lg text-gray-900 font-mono">
                  {walletAddress ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}` : 'Not connected'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Network</label>
                <div className="text-lg text-gray-900">BSC Testnet</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userInfo?.role === 'user' && (
              <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <span className="font-medium text-green-800">Trade Credits</span>
              </button>
            )}
            {userInfo?.role === 'issuer' && (
              <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                <Package className="w-6 h-6 text-blue-600" />
                <span className="font-medium text-blue-800">Create Project</span>
              </button>
            )}
            <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
              <Bell className="w-6 h-6 text-purple-600" />
              <span className="font-medium text-purple-800">View Notifications</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Placeholder components for other sections
const PortfolioAnalytics = () => (
  <Card className="border-0 shadow-lg">
    <CardContent className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Portfolio Analytics</h2>
      <p className="text-gray-600">Coming soon - Advanced portfolio analytics and insights.</p>
    </CardContent>
  </Card>
);

const ProjectAnalytics = () => (
  <Card className="border-0 shadow-lg">
    <CardContent className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Analytics</h2>
      <p className="text-gray-600">Coming soon - Detailed project performance metrics.</p>
    </CardContent>
  </Card>
);

const ValidationQueue = () => (
  <Card className="border-0 shadow-lg">
    <CardContent className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Validation Queue</h2>
      <p className="text-gray-600">Coming soon - Projects pending validation.</p>
    </CardContent>
  </Card>
);

const VerificationHistory = () => (
  <Card className="border-0 shadow-lg">
    <CardContent className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification History</h2>
      <p className="text-gray-600">Coming soon - Past validation activities.</p>
    </CardContent>
  </Card>
);

const VVBAnalytics = () => (
  <Card className="border-0 shadow-lg">
    <CardContent className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">VVB Analytics</h2>
      <p className="text-gray-600">Coming soon - Validation statistics and metrics.</p>
    </CardContent>
  </Card>
);

const PlatformOverview = () => (
  <Card className="border-0 shadow-lg">
    <CardContent className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Overview</h2>
      <p className="text-gray-600">Coming soon - System-wide statistics and insights.</p>
    </CardContent>
  </Card>
);

const UserManagement = () => (
  <Card className="border-0 shadow-lg">
    <CardContent className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">User Management</h2>
      <p className="text-gray-600">Coming soon - Manage platform users and permissions.</p>
    </CardContent>
  </Card>
);

const SystemSettings = () => (
  <Card className="border-0 shadow-lg">
    <CardContent className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">System Settings</h2>
      <p className="text-gray-600">Coming soon - Platform configuration options.</p>
    </CardContent>
  </Card>
);

const NotificationsPanel = () => (
  <Card className="border-0 shadow-lg">
    <CardContent className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Notifications</h2>
      <p className="text-gray-600">Coming soon - Alerts and system notifications.</p>
    </CardContent>
  </Card>
);

const PaymentMethods = () => (
  <Card className="border-0 shadow-lg">
    <CardContent className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Methods</h2>
      <p className="text-gray-600">Coming soon - Manage payment options and billing.</p>
    </CardContent>
  </Card>
);