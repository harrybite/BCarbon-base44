/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, FileCheck } from "lucide-react";
import { useContractInteraction } from "../components/contract/ContractInteraction";
// import { useIsMobile } from "../components/useIsMobile";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConnectWallet } from "@/context/walletcontext";
import { keccak256, toUtf8Bytes } from "ethers"; // for hash

export default function ValidateCertificate() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const state = location.state || {};
  const [formData, setFormData] = useState({
    projectAddress: state.projectAddress || "",
    account: state.account || "",
    certificateIndex: state.certificateIndex !== undefined ? state.certificateIndex : "",
    certificateId: state.certificateId || "",
    certificateHash: state.certificateId
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { walletAddress } = useConnectWallet();

  const { validateRetirementCertificate } = useContractInteraction();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setIsSubmitting(true);

    // if (!formData.account || !formData.certificateIndex || !formData.certificateHash) {
    //   setError("All fields are required");
    //   setIsSubmitting(false);
    //   return;
    // }

    if (!/^(0x)?[0-9a-fA-F]{40}$/.test(formData.account)) {
      setError("Invalid account address");
      setIsSubmitting(false);
      return;
    }

    if (!/^\d+$/.test(formData.certificateIndex)) {
      setError("Certificate index must be a non-negative integer");
      setIsSubmitting(false);
      return;
    }

    if (!/^(0x)?[0-9a-fA-F]{64}$/.test(formData.certificateHash)) {
      setError("Invalid certificate hash");
      setIsSubmitting(false);
      return;
    }

    try {
      const { isValidCert, tonnesRetired } = await validateRetirementCertificate(
        formData.projectAddress,
        formData.account,
        parseInt(formData.certificateIndex),
        formData.certificateHash
      );
      console.log("Validation result:", isValidCert, tonnesRetired);
      setResult({ isValidCert, tonnesRetired: tonnesRetired.toString() });
    } catch (err) {
      setError(err.message || "Failed to validate certificate");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update certificateHash if certificateId changes
  useEffect(() => {
    if (formData.certificateId) {
      setFormData((prev) => ({
        ...prev,
        certificateHash: formData.certificateId
      }));
    }
  }, [formData.certificateId]);

  return (

    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Validate Retirement Certificate</h1>
              <p className="text-gray-600">Verify the authenticity of a carbon credit retirement certificate</p>
            </div>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-green-600" />
              <span>Certificate Validation</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Enter the account address, certificate index, and hash to validate
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form
              onSubmit={(e) => handleSubmit(e)}
              className={isMobile ? "space-y-4" : "grid grid-cols-3 gap-4"}
            >

              <div className="space-y-2">
                <Label htmlFor="projectAddress">Project Address</Label>
                <Input
                  id="projectAddress"
                  type="text"
                  value={formData.projectAddress}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account">Account Address</Label>
                <Input
                  id="account"
                  type="text"
                  value={formData.account}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificateIndex">Certificate Index</Label>
                <Input
                  id="certificateIndex"
                  type="number"
                  value={formData.certificateIndex}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificateHash">Certificate Hash</Label>
                <Input
                  id="certificateHash"
                  type="text"
                  value={formData.certificateHash}
                  disabled
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 col-span-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-pulse rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Validating...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 mr-2" />
                    Validate Certificate
                  </>
                )}
              </Button>
            </form>

            {isSubmitting && (
              <div className="animate-pulse space-y-2 mt-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
            )}

            {result && (
              <div className="mt-4 flex space-x-4">
                <Badge
                  className={
                    result.isValidCert
                      ? "bg-green-100 text-green-800 border-green-200 text-2xl cursor-pointer hover:text-white"
                      : "bg-red-100 text-red-800 border-red-200 text-2xl"
                  }
                >
                  <CheckCircle2
                    className={`w-5 h-5 mr-1 ${result.isValidCert ? "text-green-600" : "text-red-600"}`}
                    // No hover classes here
                  />
                  {result.isValidCert ? "Valid" : "Invalid"}
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-2xl cursor-pointer hover:text-white">
                  {result.tonnesRetired} tCO2 Retired
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


// const validateRetirementCertificate = async (account, certificateIndex, certificateHash) => {
//   if (!provider) throw new Error("Provider not initialized");
//   try {
//     const bco2Contract = new Contract(
//       projectAddress, // Assumes projectAddress is available; otherwise, pass as parameter
//       bco2Abi,
//       provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
//     );
//     const [isValidCert, tonnesRetired] = await bco2Contract.validateRetirementCertificate(
//       account,
//       certificateIndex,
//       certificateHash
//     );
//     return { isValidCert, tonnesRetired };
//   } catch (error) {
//     throw new Error(`Failed to validate retirement certificate: ${error.message}`);
//   }
// };
// return {
//   userAddress,
//   isConnected,
//   error,
//   connectWallet,
//   // ... other functions ...
//   validateRetirementCertificate,
//   // ... other functions ...
// };

// const validateRetirementCertificate = async (projectAddress, account, certificateIndex, certificateHash) => {
//   if (!provider) throw new Error("Provider not initialized");
//   try {
//     const bco2Contract = new Contract(
//       projectAddress,
//       bco2Abi,
//       provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
//     );
//     const [isValidCert, tonnesRetired] = await bco2Contract.validateRetirementCertificate(
//       account,
//       certificateIndex,
//       certificateHash
//     );
//     return { isValidCert, tonnesRetired };
//   } catch (error) {
//     throw new Error(`Failed to validate retirement certificate: ${error.message}`);
//   }
// };