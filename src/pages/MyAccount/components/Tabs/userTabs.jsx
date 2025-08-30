/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, Award, BarChart3 } from "lucide-react";

const UserTabs = ({ activeTab = "portfolio" }) => {
  const renderPortfolioAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Holdings</p>
                <p className="text-2xl font-bold text-green-900">1,250 tCO₂</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Credits Retired</p>
                <p className="text-2xl font-bold text-blue-900">850 tCO₂</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Certificates</p>
                <p className="text-2xl font-bold text-purple-900">12</p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Portfolio Performance</h3>
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Advanced portfolio analytics coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return renderPortfolioAnalytics();
};

export default UserTabs;