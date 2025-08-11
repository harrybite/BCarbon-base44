import PropTypes from 'prop-types';

const ApproveModal = ({ 
  show, 
  onClose, 
  onApprove, 
  creditAmount, 
  setCreditAmount, 
  isApproving, 
  maxCreditAmount, 
  governancePresaleMintPrice, 
  setGovernancePresaleMintPrice, 
  project 
}) => {
  if (!show) return null;

  const totalEmissionReductions = Number(project.emissionReductions);
  const alreadyApprovedCredits = Number(project.credits);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Approve Project & Issue Credits</h2>
        
        {/* Project Overview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Project Overview</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Emission Reductions:</span>
              <div className="font-semibold text-blue-700">
                {totalEmissionReductions.toLocaleString()} tCO₂
              </div>
            </div>
            <div>
              <span className="text-gray-600">Already Approved:</span>
              <div className="font-semibold text-green-700">
                {alreadyApprovedCredits.toLocaleString()} tCO₂
              </div>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Available for Approval:</span>
              <div className="font-semibold text-amber-700">
                {maxCreditAmount.toLocaleString()} tCO₂
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Credit Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credit Amount to Approve (tCO₂)
            </label>
            <input
              type="number"
              min="1"
              max={maxCreditAmount}
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent ${
                Number(creditAmount) > maxCreditAmount 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-green-500'
              }`}
              placeholder="Enter credit amount"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              disabled={isApproving}
            />
            <div className="flex justify-between items-center mt-1">
              <p className={`text-xs ${
                Number(creditAmount) > maxCreditAmount 
                  ? 'text-red-600' 
                  : 'text-gray-500'
              }`}>
                Maximum available: {maxCreditAmount.toLocaleString()} tCO₂
              </p>
              <button
                type="button"
                onClick={() => setCreditAmount(maxCreditAmount)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                disabled={isApproving}
              >
                Use Max
              </button>
            </div>
            {Number(creditAmount) > maxCreditAmount && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Amount exceeds available credits
              </p>
            )}
          </div>

          {/* Mint Price Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mint Price per Credit (RUSD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter mint price"
              value={governancePresaleMintPrice}
              onChange={(e) => setGovernancePresaleMintPrice(e.target.value)}
              disabled={isApproving}
            />
            <p className="text-xs text-gray-500 mt-1">
              Price that users will pay per credit
            </p>
          </div>

          {/* Summary */}
          {creditAmount && governancePresaleMintPrice && Number(creditAmount) <= maxCreditAmount && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Approval Summary</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-blue-700">Credits to approve:</span>
                  <span className="font-semibold">{Number(creditAmount).toLocaleString()} tCO₂</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Price per credit:</span>
                  <span className="font-semibold">{governancePresaleMintPrice} RUSD</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-1">
                  <span className="text-blue-700 font-medium">Total project value:</span>
                  <span className="font-bold text-blue-800">
                    {(Number(creditAmount) * Number(governancePresaleMintPrice)).toLocaleString()} RUSD
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
            onClick={onClose}
            disabled={isApproving}
          >
            Cancel
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={onApprove}
            disabled={
              !creditAmount || 
              !governancePresaleMintPrice || 
              Number(creditAmount) > maxCreditAmount ||
              isApproving
            }
          >
            {isApproving ? "Approving..." : "Approve & Issue Credits"}
          </button>
        </div>
      </div>
    </div>
  );
};

ApproveModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  setGovernancePresaleMintPrice: PropTypes.func.isRequired,
  governancePresaleMintPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onApprove: PropTypes.func.isRequired,
  creditAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setCreditAmount: PropTypes.func.isRequired,
  isApproving: PropTypes.bool.isRequired,
  maxCreditAmount: PropTypes.number.isRequired,
  project: PropTypes.shape({
    emissionReductions: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    credits: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    projectMintPrice: PropTypes.number,
  }).isRequired,
};

export default ApproveModal;