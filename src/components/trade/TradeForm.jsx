import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import useContractInteraction from '../contract/ContractInteraction';

export default function TradeForm({ projects }) {
  const { userAddress, transferCredits } = useContractInteraction();
  const [formData, setFormData] = React.useState({
    projectAddress: "",
    amount: "",
    toAddress: "",
    fromAddress: ""
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.projectAddress || !formData.amount || !formData.toAddress) {
      setError("Please fill in all required fields");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.toAddress)) {
      setError("Please enter a valid Ethereum address");
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { hash } = await transferCredits(formData.projectAddress, formData.toAddress, parseInt(formData.amount));
      await fetch('http://localhost:3001/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: hash, projectAddress: formData.projectAddress, userAddress })
      });
      setSuccess("Trade transaction submitted successfully!");
      setFormData({
        projectAddress: "",
        amount: "",
        toAddress: "",
        fromAddress: ""
      });
    } catch (error) {
      setError(error.message || "Failed to execute trade");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ArrowRight className="w-5 h-5 text-green-600" />
          <span>Trade Carbon Credits</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Transfer non-retired carbon credits to another address
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="project">Select Project</Label>
            <Select
              value={formData.projectAddress}
              onValueChange={(value) => handleInputChange('projectAddress', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.projectAddress} value={project.projectAddress}>
                    {project.metadata?.name} ({project.projectAddress})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount of Credits</Label>
            <Input
              id="amount"
              type="number"
              step="1"
              min="1"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromAddress">From Address (Optional)</Label>
            <Input
              id="fromAddress"
              type="text"
              placeholder="0x... (leave empty for your address)"
              value={formData.fromAddress}
              onChange={(e) => handleInputChange('fromAddress', e.target.value)}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="toAddress">To Address *</Label>
            <Input
              id="toAddress"
              type="text"
              placeholder="0x..."
              value={formData.toAddress}
              onChange={(e) => handleInputChange('toAddress', e.target.value)}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing Transaction...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Execute Trade
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}