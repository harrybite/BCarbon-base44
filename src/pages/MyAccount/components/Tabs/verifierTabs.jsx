/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Clock, CheckCircle2, FileCheck } from "lucide-react";

const VerifierTabs = ({ activeTab = "history" }) => {
  const renderVerificationHistory = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-teal-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teal-600">Verified Projects</p>
                <p className="text-2xl font-bold text-teal-900">89</p>
              </div>
              <Shield className="w-8 h-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-900">7</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Approval Rate</p>
                <p className="text-2xl font-bold text-green-900">94%</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">This Quarter</p>
                <p className="text-2xl font-bold text-purple-900">32</p>
              </div>
              <FileCheck className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Verification History</h3>
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Verification history interface coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return renderVerificationHistory();
};

export default VerifierTabs;