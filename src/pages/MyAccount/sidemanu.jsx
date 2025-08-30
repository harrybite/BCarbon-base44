/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { 
  User, 
  Briefcase, 
  ShoppingBag, 
  BadgeCheck, 
  FileText, 
  UserCircle, 
  Wallet, 
  Shield, 
  Calendar,
  Settings,
  Package,
  TrendingUp,
  Award,
  Bell,
  CreditCard,
  BarChart3,
  Globe,
  CheckCircle2,
  Clock,
  Target,
  Leaf,
  Building,
  Users,
  Zap,
  Activity
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserInfo } from "@/context/userInfo";

const SideMenuAccount = ({ children, activeSection, setActiveSection }) => {
  const { userInfo } = useUserInfo();

  // Get role-specific menu items
  const getMenuItems = () => {
    if (!userInfo?.roles) return [];

    const baseItems = [
      {
        id: 'overview',
        label: 'Account Overview',
        icon: User,
        description: 'Your account summary',
        roles: ['user', 'issuer', 'gov', 'validation', 'verification']
      },
      {
        id: 'holdings',
        label: 'My tCO₂ Holdings',
        icon: ShoppingBag,
        description: 'Carbon credits you own',
        roles: ['user', 'issuer', 'gov', 'validation', 'verification']
      }
    ];

    const roleSpecificItems = [
      // User specific
      {
        id: 'certificates',
        label: 'My Certificates',
        icon: BadgeCheck,
        description: 'Retirement certificates',
        roles: ['user']
      },
      {
        id: 'portfolio',
        label: 'Portfolio Analytics',
        icon: BarChart3,
        description: 'Investment insights',
        roles: ['user']
      },

      // Issuer specific
      {
        id: 'create-project',
        label: 'Create Project',
        icon: Briefcase,
        description: 'Submit new carbon project',
        roles: ['issuer', 'gov']
      },
      {
        id: 'my-projects',
        label: 'My Projects',
        icon: Building,
        description: 'Manage your projects',
        roles: ['issuer', 'gov']
      },
      {
        id: 'withdrawal-requests',
        label: 'Withdrawal Requests',
        icon: FileText,
        description: 'Revenue withdrawal status',
        roles: ['issuer']
      },
      {
        id: 'project-analytics',
        label: 'Project Analytics',
        icon: Activity,
        description: 'Project performance metrics',
        roles: ['issuer', 'gov']
      },

      // Validation/Verification specific
      {
        id: 'validation-queue',
        label: 'Validation Queue',
        icon: CheckCircle2,
        description: 'Projects pending validation',
        roles: ['validation', 'gov']
      },
      {
        id: 'verification-history',
        label: 'Verification History',
        icon: Clock,
        description: 'Past verification activities',
        roles: ['verification', 'gov']
      },
      {
        id: 'vvb-analytics',
        label: 'VVB Analytics',
        icon: Target,
        description: 'Validation/Verification statistics',
        roles: ['validation', 'verification', 'gov']
      },

      // Gov specific
      {
        id: 'platform-overview',
        label: 'Platform Overview',
        icon: Globe,
        description: 'System-wide statistics',
        roles: ['gov']
      },
      {
        id: 'user-management',
        label: 'User Management',
        icon: Users,
        description: 'Manage platform users',
        roles: ['gov']
      },
      {
        id: 'system-settings',
        label: 'System Settings',
        icon: Settings,
        description: 'Platform configuration',
        roles: ['gov']
      },

      // Common advanced features
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        description: 'Alerts and updates',
        roles: ['user', 'issuer', 'gov', 'validation', 'verification']
      },
      {
        id: 'payment-methods',
        label: 'Payment Methods',
        icon: CreditCard,
        description: 'Manage payment options',
        roles: ['user', 'issuer']
      }
    ];

    return [...baseItems, ...roleSpecificItems].filter(item => 
      item.roles.some(role => userInfo.roles.includes(role))
    );
  };

  // Get role-specific styling
  const getRoleInfo = () => {
    if (!userInfo?.roles || userInfo.roles.length === 0) return { 
      color: 'gray', 
      badge: 'User', 
      description: 'General User',
      gradient: 'from-gray-500 to-gray-600',
      bgGradient: 'from-gray-50 to-gray-100'
    };
    
    const primaryRole = userInfo.roles[0];
    
    switch (primaryRole) {
      case 'issuer':
        return { 
          color: 'blue', 
          badge: 'Project Issuer', 
          description: 'Create and manage carbon credit projects',
          gradient: 'from-blue-500 to-blue-600',
          bgGradient: 'from-blue-50 to-blue-100'
        };
      case 'user':
        return { 
          color: 'green', 
          badge: 'Carbon Credit Holder', 
          description: 'Buy, hold, and retire carbon credits',
          gradient: 'from-green-500 to-green-600',
          bgGradient: 'from-green-50 to-green-100'
        };
      case 'gov':
        return { 
          color: 'purple', 
          badge: 'Governance', 
          description: 'Platform governance and administration',
          gradient: 'from-purple-500 to-purple-600',
          bgGradient: 'from-purple-50 to-purple-100'
        };
      case 'validation':
        return { 
          color: 'orange', 
          badge: 'Validation Body', 
          description: 'Validate carbon credit projects',
          gradient: 'from-orange-500 to-orange-600',
          bgGradient: 'from-orange-50 to-orange-100'
        };
      case 'verification':
        return { 
          color: 'teal', 
          badge: 'Verification Body', 
          description: 'Verify carbon credit project implementation',
          gradient: 'from-teal-500 to-teal-600',
          bgGradient: 'from-teal-50 to-teal-100'
        };
      default:
        return { 
          color: 'gray', 
          badge: 'User', 
          description: 'General platform user',
          gradient: 'from-gray-500 to-gray-600',
          bgGradient: 'from-gray-50 to-gray-100'
        };
    }
  };

  const menuItems = getMenuItems();
  const roleInfo = getRoleInfo();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      
      {/* Side Menu */}
      <div className="w-80 bg-white border-r border-gray-200 shadow-xl">
        
        {/* User Profile Header */}
        <div className={`bg-gradient-to-r ${roleInfo.bgGradient} p-6 border-b border-gray-200`}>
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 bg-gradient-to-br ${roleInfo.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
              <UserCircle className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">
                {userInfo?.name || userInfo?.email || 'User Account'}
              </h2>
              <div className="flex flex-wrap gap-1 mt-1">
                {userInfo?.roles?.map(role => (
                  <Badge key={role} className={`bg-${roleInfo.color}-100 text-${roleInfo.color}-800 border-${roleInfo.color}-200 text-xs capitalize`}>
                    {role}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">{roleInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-4">
          <nav className="space-y-2 px-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-start space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? `bg-gradient-to-r ${roleInfo.bgGradient} border-l-4 border-${roleInfo.color}-500 shadow-sm` 
                      : 'hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    isActive 
                      ? `bg-${roleInfo.color}-100 text-${roleInfo.color}-600` 
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`font-medium transition-colors ${
                      isActive ? `text-${roleInfo.color}-900` : 'text-gray-900'
                    }`}>
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          
          {/* Content Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              {(() => {
                const activeItem = menuItems.find(item => item.id === activeSection);
                const Icon = activeItem?.icon || User;
                return (
                  <>
                    <div className={`w-12 h-12 bg-gradient-to-br ${roleInfo.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {activeItem?.label || 'Account Overview'}
                      </h1>
                      <p className="text-gray-600">
                        {activeItem?.description || 'Manage your account settings and data'}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Dynamic Content */}
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideMenuAccount;