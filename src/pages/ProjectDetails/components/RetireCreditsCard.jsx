/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Recycle, AlertCircle, Star } from 'lucide-react';

const RetireCreditsCard = ({ 
  project, 
  retireAmount, 
  setRetireAmount, 
  handleRetire, 
  handleMaxRetire,
  isRetiring, 
  allowedRetire,
  retiredBalance,
  retireNftImage,
  fallbackImage
}) => {
  
  const showReason = (project) => {
    if (project.isPresale) {
      if (Number(project.presaleAmount) === 0) {
        return "Retiring is currently disabled. Presale projects cannot retire credits until presale is approved.";
      }
      // If presale is approved (presaleAmount > 0), check other conditions
      if (!project.isApproved) {
        return "Retiring is currently disabled. Project is awaiting approval.";
      }
    } 
    else if (!project.isApproved && !project.isPresale) {
      return "Retiring is currently disabled. Project is awaiting approval.";
    }
    
    if (!project.tokenUri || project.tokenUri === "" || typeof project.tokenUri === "undefined") {
      return "Retiring is currently disabled. Token URI not available.";
    }
    
    return null;
  };

  // Enhanced logic for retiring - for presale projects, allow retiring only if presale is approved AND project is approved
  const canRetire = () => {
    if (project.isPresale) {
      return Number(project.presaleAmount) > 0 && project.isApproved && allowedRetire > 0;
    }
    return project.isApproved && allowedRetire > 0;
  };

  const disabledReason = showReason(project);
  const isRetireAllowed = canRetire();

  return (
    <Card className={`${!isRetireAllowed ? "opacity-50" : ""}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Recycle className="w-5 h-5 text-orange-600" />
          <span>Retire Credits</span>
          {project.isPresale && (
            <Star className="w-4 h-4 text-purple-600" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show appropriate warning based on showReason logic */}
        {disabledReason ? (
          <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            {retireNftImage && (
              <div className="w-full bg-black flex items-center justify-center mb-4" style={{ height: "380px" }}>
                <img
                  src={retireNftImage || fallbackImage}
                  alt="Retire NFT"
                  className="object-fill h-full w-full"
                />
              </div>
            )}
            <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-sm text-yellow-800 font-medium">
              Retiring is currently disabled
            </div>
            <div className="text-xs text-yellow-700 mt-1">
              {disabledReason}
            </div>
            
            {/* Show presale status for presale projects */}
            {project.isPresale && (
              <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-center space-x-2">
                  <Star className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-purple-700 font-medium">
                    Presale Project - {Number(project.presaleAmount) > 0 
                      ? `Approved for ${Number(project.presaleAmount).toLocaleString()} RUSD`
                      : 'Pending Approval'
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Presale Status Banner - Show for approved presale projects */}
            {project.isPresale && Number(project.presaleAmount) > 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Star className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-800">
                    Presale Project - Approved
                  </span>
                </div>
                <p className="text-xs text-purple-700">
                  Presale approved for {Number(project.presaleAmount).toLocaleString()} RUSD
                </p>
              </div>
            )}

            {retireNftImage && (
              <div className="w-full bg-black flex items-center justify-center" style={{ height: "380px" }}>
                <img
                  src={retireNftImage || fallbackImage}
                  alt="Retire NFT"
                  className="object-fill h-full w-full"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="retireAmount">Amount to Retire</Label>
              <div className="flex space-x-2">
                <Input
                  id="retireAmount"
                  type="text"
                  step="1"
                  min="1"
                  placeholder="Enter amount"
                  value={retireAmount}
                  onChange={(e) => setRetireAmount(e.target.value)}
                  disabled={!isRetireAllowed || isRetiring}
                  className="flex-1 appearance-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="px-3"
                  onClick={handleMaxRetire}
                  disabled={!isRetireAllowed || isRetiring}
                >
                  Max
                </Button>
              </div>
            </div>
            
            <div className="space-y-1">
              <Label>Retired tCO<sub>2</sub>: {Number(retiredBalance).toLocaleString()}</Label><br />
              <Label>Allowed retired tCO<sub>2</sub>: {Number(allowedRetire).toLocaleString()}</Label>
            </div>
            
            <Button
              onClick={handleRetire}
              disabled={!isRetireAllowed || isRetiring || allowedRetire <= 0}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isRetiring ? "Retiring..." : "Retire Credits"}
            </Button>
            
            <p className="text-sm text-gray-500">
              Retiring credits permanently removes them from circulation.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

RetireCreditsCard.propTypes = {
  project: PropTypes.shape({
    tokenUri: PropTypes.string,
    isApproved: PropTypes.bool,
    isPresale: PropTypes.bool,
    presaleAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  retireAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setRetireAmount: PropTypes.func.isRequired,
  handleRetire: PropTypes.func.isRequired,
  handleMaxRetire: PropTypes.func.isRequired,
  isRetiring: PropTypes.bool.isRequired,
  allowedRetire: PropTypes.number.isRequired,
  retiredBalance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  retireNftImage: PropTypes.string,
  fallbackImage: PropTypes.string.isRequired,
};

RetireCreditsCard.defaultProps = {
  retireNftImage: '',
};

export default RetireCreditsCard;