import 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2 } from 'lucide-react';

const PresaleApproveModal = ({ 
  show, 
  onClose, 
  onApprove, 
  setGovernancePresaleMintPrice, 
  governancePresaleMintPrice,
  creditAmount, 
  setCreditAmount, 
  isApproving, 
  maxCreditAmount, 
  project 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Approve Presale Credits</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isApproving}
            className="hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Presale Credit Amount (Max: {maxCreditAmount} tCO₂)
          </label>
          <input
            type="number"
            min="1"
            max={maxCreditAmount}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            placeholder="Enter presale credit amount"
            value={creditAmount}
            onChange={e => setCreditAmount(e.target.value)}
            disabled={isApproving}
          />
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500">
              Total emission reductions: {Number(project.emissionReductions)} tCO₂
            </p>
            {/* <p className="text-xs text-gray-500">
              Maximum presale amount: {maxCreditAmount} tCO₂ (50% limit)
            </p> */}
            <p className="text-xs text-green-600">
              Remaining for main approval: {Number(project.emissionReductions) - Number(creditAmount || 0)} tCO₂
            </p>
          </div>
        </div>


        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Presale Mint Price (Max: {project.projectMintPrice} RUSD)
          </label>
          <input
            type="number"
            min="1"
            max={project.projectMintPrice}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            placeholder="Enter presale mint price"
            value={governancePresaleMintPrice}
            onChange={e => {
              if(Number(e.target.value) > Number(project.projectMintPrice)) {
                return
              }
              setGovernancePresaleMintPrice(e.target.value)
            }}
            disabled={isApproving}
          />
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Presale Approval</h3>
              <p className="text-sm text-green-700 mt-1">
                This will issue credits for presale before full project approval. 
                Credits will be available for advance purchase.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
            onClick={onClose}
            disabled={isApproving}
          >
            Cancel
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            onClick={onApprove}
            disabled={
              !creditAmount || 
              isApproving || 
              Number(creditAmount) <= 0
            }
          >
            {isApproving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Approving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Presale Credits</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

PresaleApproveModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  setGovernancePresaleMintPrice: PropTypes.func.isRequired,
  governancePresaleMintPrice: PropTypes.number.isRequired,
  onApprove: PropTypes.func.isRequired,
  creditAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setCreditAmount: PropTypes.func.isRequired,
  isApproving: PropTypes.bool.isRequired,
  maxCreditAmount: PropTypes.number.isRequired,
  project: PropTypes.shape({
    emissionReductions: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    projectMintPrice: PropTypes.number,
  }).isRequired,
};

export default PresaleApproveModal;