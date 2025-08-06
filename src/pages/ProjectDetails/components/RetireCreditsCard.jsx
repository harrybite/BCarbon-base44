/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Recycle, AlertCircle } from 'lucide-react';

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
  // Check if retiring is allowed (project must be approved)
  const canRetire = project.isApproved && allowedRetire > 0;
  
  return (
    <Card className={`${!canRetire ? "opacity-50" : ""}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Recycle className="w-5 h-5 text-orange-600" />
          <span>Retire Credits</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show warning if project is not approved */}
        {!project.isApproved ? (
          <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="w-full bg-black flex items-center justify-center" style={{ height: "180px" }}>
                <img
                  src={retireNftImage || fallbackImage}
                  alt="Retire NFT"
                  className="object-contain h-full w-full"
                />
              </div>
            <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2 mt-2" />
            <div className="text-sm text-yellow-800 font-medium">
              Retiring is currently disabled
            </div>
            <div className="text-xs text-yellow-700 mt-1">
              Project is awaiting approval before credits can be retired
            </div>
          </div>
        ) : (!project.tokenUri || project.tokenUri === "" || typeof project.tokenUri === "undefined") ? (
          <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <div className="text-sm text-gray-600">
              Retiring is currently disabled. Token URI not available.
            </div>
          </div>
        ) : (
          <>
            {retireNftImage && (
              <div className="w-full bg-black flex items-center justify-center" style={{ height: "180px" }}>
                <img
                  src={retireNftImage || fallbackImage}
                  alt="Retire NFT"
                  className="object-contain h-full w-full"
                />
              </div>
            )}
            <div>
              <Label htmlFor="retireAmount">Amount to Retire</Label>
              <div className="flex space-x-2">
                <Input
                  id="retireAmount"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Enter amount"
                  value={retireAmount}
                  onChange={(e) => setRetireAmount(e.target.value)}
                  disabled={!project.isApproved || isRetiring}
                  className="flex-1 appearance-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="px-3"
                  onClick={handleMaxRetire}
                  disabled={!project.isApproved || isRetiring}
                >
                  Max
                </Button>
              </div>
            </div>
            
            <div className="space-y-1">
              <Label>Retired tCO<sub>2</sub>: {Number(retiredBalance).toLocaleString()}</Label>
              <br/>
              <Label>Allowed retired tCO<sub>2</sub>: {Number(allowedRetire).toLocaleString()}</Label>
            </div>
            
            <Button
              onClick={handleRetire}
              disabled={!project.isApproved || isRetiring || allowedRetire <= 0}
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