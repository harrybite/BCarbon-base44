/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Coins, AlertCircle, Star } from 'lucide-react';
import { useConnectWallet } from '@/context/walletcontext';

const MintCreditsCard = ({ 
  project, 
  mintAmount, 
  setMintAmount, 
  handleMintETH, 
  handleMintForIssuer,
  isMinting, 
  mintNftImage, 
  fallbackImage,
  mintedCredits,
  mintBalance,
  rusdBalance
}) => {
  const { walletAddress } = useConnectWallet();

  // Check if minting is allowed based on presale logic
  const isMintingAllowed = () => {
    // If it's a presale project
    if (project.isPresale) {
      // Allow minting only if presale amount > 0 (presale approved)
      return Number(project.presaleAmount) > 0;
    }
    // For regular projects, allow if approved
    return project.isApproved;
  };

  const getMintingStatusMessage = () => {
    if (project.isPresale) {
      if (Number(project.presaleAmount) === 0) {
        return "Minting is disabled. Presale is pending approval.";
      }
      // if (Number(project.presaleAmount) > 0) {
      //   return `Presale approved! You can mint up to ${Number(project.presaleAmount).toLocaleString()} RUSD worth of credits.`;
      // }
    }
    if (!project.isApproved && !project.isPresale) {
      return "Minting is currently disabled for this project. Project is awaiting approval.";
    }
    return null;
  };

  const canMint = isMintingAllowed();
  const statusMessage = getMintingStatusMessage();
  const isProjectOwner = project.proposer.toLowerCase() === walletAddress.toLowerCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Coins className="w-5 h-5 text-green-600" />
          <span>Mint Credits</span>
          {project.isPresale && (
            <Star className="w-4 h-4 text-purple-600" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(!project.tokenUri || project.tokenUri === "" || typeof project.tokenUri === "undefined") ? (
          <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <div className="text-center text-sm text-gray-500">
              Minting is currently disabled. Awaiting to set token URI.
            </div>
          </div>
        ) : (
          <>
            {/* Presale Status Banner */}
            {project.isPresale && (
              <></>
              // <div className={`p-3 rounded-lg border ${
              //   Number(project.presaleAmount) > 0 
              //     ? 'bg-purple-50 border-purple-200' 
              //     : 'bg-amber-50 border-amber-200'
              // }`}>
              //   <div className="flex items-center space-x-2 mb-1">
              //     <Star className={`w-4 h-4 ${
              //       Number(project.presaleAmount) > 0 ? 'text-purple-600' : 'text-amber-600'
              //     }`} />
              //     <span className={`text-sm font-semibold ${
              //       Number(project.presaleAmount) > 0 ? 'text-purple-800' : 'text-amber-800'
              //     }`}>
              //       Presale Project
              //     </span>
              //   </div>
              //   <p className={`text-xs ${
              //     Number(project.presaleAmount) > 0 ? 'text-purple-700' : 'text-amber-700'
              //   }`}>
              //     {Number(project.presaleAmount) > 0 
              //       ? `Presale approved for ${Number(project.presaleAmount).toLocaleString()} RUSD`
              //       : 'Presale is pending approval'
              //     }
              //   </p>
              // </div>
            )}

            {mintNftImage && (
              <div className="w-full bg-black flex items-center justify-center" style={{ height: "380px" }}>
                <img
                  src={mintNftImage || fallbackImage}
                  alt="Mint NFT"
                  className="object-fill h-full w-full"
                />
              </div>
            )}

            <div>
              <Label htmlFor="mintAmount">Amount to Mint</Label>
              <Input
                id="mintAmount"
                type="number"
                step="1"
                min="1"
                placeholder="Enter amount"
                className="appearance-none"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                disabled={!canMint || isMinting}
              />
            </div>

            <div className="space-y-1">
              <Label>Minted tCO<sub>2</sub>: {Number(mintedCredits).toLocaleString()}</Label><br />
              <Label>Current Bal tCO<sub>2</sub>: {Number(mintBalance).toLocaleString()}</Label><br/>
              <Label>RUSD: {Number(rusdBalance).toLocaleString()}</Label>
            </div>

            {/* Minting Buttons */}
            {!isProjectOwner && (
              <Button
                onClick={handleMintETH}
                disabled={
                  isMinting || 
                  !canMint || 
                  (Number(project.totalSupply) === Number(project.credits))
                }
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isMinting ? "Minting..." : "Mint with RUSD"}
              </Button>
            )}

            {isProjectOwner && (
              <Button
                onClick={handleMintForIssuer}
                disabled={isMinting || !canMint}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isMinting ? "Minting..." : "Mint as issuer"}
              </Button>
            )}

            {/* Status Messages */}
            {statusMessage && (
              <div className={`p-3 rounded-lg border text-sm ${
                project.isPresale && Number(project.presaleAmount) > 0
                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                  : project.isPresale && Number(project.presaleAmount) === 0
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <div className="flex items-start space-x-2">
                  <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    project.isPresale && Number(project.presaleAmount) > 0
                      ? 'text-purple-600'
                      : project.isPresale && Number(project.presaleAmount) === 0
                      ? 'text-amber-600'
                      : 'text-gray-500'
                  }`} />
                  <span>{statusMessage}</span>
                </div>
              </div>
            )}

            {/* Supply Limit Warning */}
            { (project.isApproved || Number(project.presaleAmount) > 0 ) && Number(project.totalSupply) === Number(project.credits) && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-700">
                    Maximum supply reached. No more credits can be minted.
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

MintCreditsCard.propTypes = {
  project: PropTypes.shape({
    tokenUri: PropTypes.string,
    isApproved: PropTypes.bool,
    isPresale: PropTypes.bool,
    proposer: PropTypes.string,
    totalSupply: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    credits: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    presaleAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  mintAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setMintAmount: PropTypes.func.isRequired,
  handleMintETH: PropTypes.func.isRequired,
  handleMintForIssuer: PropTypes.func.isRequired,
  isMinting: PropTypes.bool.isRequired,
  mintNftImage: PropTypes.string,
  fallbackImage: PropTypes.string.isRequired,
  mintedCredits: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  mintBalance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  rusdBalance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

MintCreditsCard.defaultProps = {
  mintNftImage: '',
};

export default MintCreditsCard;