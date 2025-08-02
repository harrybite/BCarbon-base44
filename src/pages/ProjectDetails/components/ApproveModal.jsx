import PropTypes from 'prop-types';

const ApproveModal = ({ show, onClose, onApprove, creditAmount, setCreditAmount, isApproving, maxCreditAmount }) => {
  return (
    show && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
          <h2 className="text-xl font-bold mb-4">Enter Credit Amount to Approve</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credit Amount (Max: {maxCreditAmount} tCO₂)
            </label>
            <input
              type="number"
              min="1"
              max={maxCreditAmount}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              placeholder="Enter credit amount"
              value={creditAmount}
              onChange={e => setCreditAmount(e.target.value)}
              disabled={isApproving}
            />
            <p className="text-xs text-gray-500 mt-1">
              Available emission reductions: {maxCreditAmount} tCO₂
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              onClick={onClose}
              disabled={isApproving}
            >
              Cancel
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onApprove}
              disabled={!creditAmount || isApproving || Number(creditAmount) <= 0 || Number(creditAmount) > maxCreditAmount}
            >
              {isApproving ? "Approving..." : "Approve & Issue Credits"}
            </button>
          </div>
        </div>
      </div>
    )
  );
};

ApproveModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  creditAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setCreditAmount: PropTypes.func.isRequired,
  isApproving: PropTypes.bool.isRequired,
  maxCreditAmount: PropTypes.number.isRequired,
};

export default ApproveModal;