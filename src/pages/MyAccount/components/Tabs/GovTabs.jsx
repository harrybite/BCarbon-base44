/* eslint-disable react/prop-types */
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Users, Settings, Activity, BarChart3 } from "lucide-react";

const GovTabs = ({ activeTab = "overview" }) => {
  const renderPlatformOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Users</p>
                <p className="text-2xl font-bold text-purple-900">2,847</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Projects</p>
                <p className="text-2xl font-bold text-green-900">156</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Credits Issued</p>
                <p className="text-2xl font-bold text-blue-900">1.2M</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Platform Health</p>
                <p className="text-2xl font-bold text-orange-900">98%</p>
              </div>
              <Globe className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Platform Analytics</h3>
          <div className="text-center py-12">
            <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Comprehensive platform analytics coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUserManagement = () => (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">User Management</h3>
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">User management interface coming soon...</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSystemSettings = () => (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">System Settings</h3>
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">System configuration interface coming soon...</p>
        </div>
      </CardContent>
    </Card>
  );

  switch (activeTab) {
    case 'users':
      return renderUserManagement();
    case 'settings':
      return renderSystemSettings();
    default:
      return renderPlatformOverview();
  }
};

export default GovTabs;