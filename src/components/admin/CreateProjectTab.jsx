import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";

export default function CreateProjectTab({ onCreateProject }) {
  const [formData, setFormData] = React.useState({
    certificateId: "",
    mintPrice: "",
    treasury: "",
    defaultIsPermanent: false,
    defaultValidity: "",
    defaultVintage: "",
    methodology: "",
    batchNumber: "",
    repoLink: "",
    nonRetiredURI: "",
    retiredURI: ""
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
    
    if (!formData.certificateId || !formData.mintPrice || !formData.treasury) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onCreateProject(formData);
      setSuccess("Project created successfully!");
      
      // Reset form
      setFormData({
        certificateId: "",
        mintPrice: "",
        treasury: "",
        defaultIsPermanent: false,
        defaultValidity: "",
        defaultVintage: "",
        methodology: "",
        batchNumber: "",
        repoLink: "",
        nonRetiredURI: "",
        retiredURI: ""
      });
    } catch (error) {
      setError(error.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="w-5 h-5 text-green-600" />
          <span>Create New Carbon Credit Project</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Create a new carbon credit project that can be listed for approval
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

          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="certificateId">Certificate ID *</Label>
                <Input
                  id="certificateId"
                  type="text"
                  placeholder="e.g., VCS-001"
                  value={formData.certificateId}
                  onChange={(e) => handleInputChange('certificateId', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mintPrice">Mint Price (ETH) *</Label>
                <Input
                  id="mintPrice"
                  type="number"
                  step="0.001"
                  placeholder="0.01"
                  value={formData.mintPrice}
                  onChange={(e) => handleInputChange('mintPrice', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="treasury">Treasury Address *</Label>
                <Input
                  id="treasury"
                  type="text"
                  placeholder="0x..."
                  value={formData.treasury}
                  onChange={(e) => handleInputChange('treasury', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="methodology">Methodology</Label>
                <Input
                  id="methodology"
                  type="text"
                  placeholder="e.g., VM0007"
                  value={formData.methodology}
                  onChange={(e) => handleInputChange('methodology', e.target.value)}
                />
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="vintage">Vintage Year</Label>
                <Input
                  id="vintage"
                  type="text"
                  placeholder="2024"
                  value={formData.defaultVintage}
                  onChange={(e) => handleInputChange('defaultVintage', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validity">Validity Period</Label>
                <Input
                  id="validity"
                  type="text"
                  placeholder="e.g., 10 years"
                  value={formData.defaultValidity}
                  onChange={(e) => handleInputChange('defaultValidity', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number</Label>
                <Input
                  id="batchNumber"
                  type="text"
                  placeholder="BATCH-001"
                  value={formData.batchNumber}
                  onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPermanent"
                  checked={formData.defaultIsPermanent}
                  onCheckedChange={(checked) => handleInputChange('defaultIsPermanent', checked)}
                />
                <Label htmlFor="isPermanent">Permanent Carbon Reduction</Label>
              </div>
            </div>
          </div>

          {/* Links and URIs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Documentation & Metadata</h3>
            
            <div className="space-y-2">
              <Label htmlFor="repoLink">Repository Link</Label>
              <Input
                id="repoLink"
                type="url"
                placeholder="https://github.com/..."
                value={formData.repoLink}
                onChange={(e) => handleInputChange('repoLink', e.target.value)}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nonRetiredURI">Non-Retired Token URI</Label>
                <Input
                  id="nonRetiredURI"
                  type="url"
                  placeholder="https://metadata.example.com/active.json"
                  value={formData.nonRetiredURI}
                  onChange={(e) => handleInputChange('nonRetiredURI', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retiredURI">Retired Token URI</Label>
                <Input
                  id="retiredURI"
                  type="url"
                  placeholder="https://metadata.example.com/retired.json"
                  value={formData.retiredURI}
                  onChange={(e) => handleInputChange('retiredURI', e.target.value)}
                />
              </div>
            </div>
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
                Creating Project...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}