/* eslint-disable react/prop-types */
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, Target, FileCheck } from "lucide-react";

const ValidatorTabs = ({ activeTab = "queue" }) => {
  const renderValidationQueue = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-blue-900">12</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Validated</p>
                <p className="text-2xl font-bold text-green-900">156</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Success Rate</p>
                <p className="text-2xl font-bold text-purple-900">92%</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">This Month</p>
                <p className="text-2xl font-bold text-orange-900">24</p>
              </div>
              <FileCheck className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Projects Pending Validation</h3>
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Validation queue interface coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Validation Analytics</h3>
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Advanced validation analytics coming soon...</p>
        </div>
      </CardContent>
    </Card>
  );

  switch (activeTab) {
    case 'analytics':
      return renderAnalytics();
    default:
      return renderValidationQueue();
  }
};

export default ValidatorTabs;