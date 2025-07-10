import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GovernanceTab({ onExecuteGovernance }) {
  const [formData, setFormData] = React.useState({
    tokenURI: "",
    maxPerWallet: "",
    treasuryAddress: "",
    stopMinting: false
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (action) => {
    setIsSubmitting(true);
    setError("");

    try {
      let params = {};
      
      switch(action) {
        case 'setTokenURI':
          if (!formData.tokenURI) {
            setError("Token URI is required");
            return;
          }
          params = { tokenURI: formData.tokenURI };
          break;
        case 'setMaxPerWallet':
          if (!formData.maxPerWallet) {
            setError("Max per wallet amount is required");
            return;
          }
          params = { maxPerWallet: formData.maxPerWallet };
          break;
        case 'updateTreasury':
          if (!formData.treasuryAddress) {
            setError("Treasury address is required");
            return;
          }
          params = { treasuryAddress: formData.treasuryAddress };
          break;
        case 'stopMinting':
          params = {};
          break;
      }

      await onExecuteGovernance(action, params);
      setSuccess(`${action} executed successfully!`);
      
      // Reset form
      setFormData({
        tokenURI: "",
        maxPerWallet: "",
        treasuryAddress: "",
        stopMinting: false
      });
    } catch (error) {
      setError(error.message || `Failed to execute ${action}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Contract Governance</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Manage BCO2 contract settings and parameters
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Token URI */}
            <div className="space-y-3">
              <Label htmlFor="tokenURI">Token URI</Label>
              <Input
                id="tokenURI"
                type="text"
                placeholder="https://..."
                value={formData.tokenURI}
                onChange={(e) => handleInputChange('tokenURI', e.target.value)}
              />
              <Button
                onClick={() => handleSubmit('setTokenURI')}
                disabled={isSubmitting}
                className="w-full"
                variant="outline"
              >
                Update Token URI
              </Button>
            </div>

            {/* Max Per Wallet */}
            <div className="space-y-3">
              <Label htmlFor="maxPerWallet">Max Per Wallet</Label>
              <Input
                id="maxPerWallet"
                type="number"
                placeholder="1000"
                value={formData.maxPerWallet}
                onChange={(e) => handleInputChange('maxPerWallet', e.target.value)}
              />
              <Button
                onClick={() => handleSubmit('setMaxPerWallet')}
                disabled={isSubmitting}
                className="w-full"
                variant="outline"
              >
                Update Max Per Wallet
              </Button>
            </div>

            {/* Treasury Address */}
            <div className="space-y-3">
              <Label htmlFor="treasuryAddress">Treasury Address</Label>
              <Input
                id="treasuryAddress"
                type="text"
                placeholder="0x..."
                value={formData.treasuryAddress}
                onChange={(e) => handleInputChange('treasuryAddress', e.target.value)}
              />
              <Button
                onClick={() => handleSubmit('updateTreasury')}
                disabled={isSubmitting}
                className="w-full"
                variant="outline"
              >
                Update Treasury
              </Button>
            </div>

            {/* Stop Minting */}
            <div className="space-y-3">
              <Label>Emergency Controls</Label>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-red-600 border-red-200">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Danger Zone
                </Badge>
              </div>
              <Button
                onClick={() => handleSubmit('stopMinting')}
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Shield className="w-4 h-4 mr-2" />
                Stop All Minting
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}