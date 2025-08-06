/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Coins } from 'lucide-react';
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
  console.log(project.isApproved, project.isPresale, !project.isApproved && !project.isPresale)
   const { walletAddress } = useConnectWallet();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Coins className="w-5 h-5 text-green-600" />
          <span>Mint Credits</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(!project.tokenUri || project.tokenUri === "" || typeof project.tokenUri === "undefined") ? (
          <div className="text-center text-sm text-gray-500">
            Minting is currently disabled. Awaiting to set token URI.
          </div>
        ) : (
          <>
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
                disabled={!project.isApproved && !project.isPresale}
              />
            </div>
            <Label>Minted tCO<sub>2</sub>: {Number(mintedCredits).toLocaleString()}</Label>
            <br />
            <Label>Current Bal tCO<sub>2</sub>: {Number(mintBalance).toLocaleString()}</Label>
            <br />
            <Label>RUSD: {Number(rusdBalance).toLocaleString()}</Label>
           {project.proposer.toLowerCase() !== walletAddress.toLowerCase() &&  <Button
              onClick={handleMintETH}
              disabled={isMinting || (!project.isApproved && !project.isPresale) || (Number(project.totalSupply) === Number(project.credits))}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isMinting ? "Minting..." : "Mint with RUSD"}
            </Button>}
             { project.proposer.toLowerCase() === walletAddress.toLowerCase() &&  <Button
              onClick={handleMintForIssuer}
              disabled={isMinting || (!project.isApproved && !project.isPresale)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isMinting ? "Minting..." : "Mint as issuer"}
            </Button>
}
            {!project.isApproved && !project.isPresale && (
              <p className="text-sm text-gray-500">
                Minting is currently disabled for this project. Project is awaiting approval.
              </p>
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