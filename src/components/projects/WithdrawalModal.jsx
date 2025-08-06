/* eslint-disable no-useless-escape */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

const WithdrawalModal = ({ 
  show, 
  onClose, 
  onRequestWithdrawal, 
  projectAddress,
  projectBalance,
  isRequesting,
  projectId 
}) => {
  const [amount, setAmount] = useState('');
  const [proof, setProof] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show) {
      // Reset form when modal opens
      setAmount('');
      setProof('');
      setErrors({});
    }
  }, [show]);

  const validateForm = () => {
    const newErrors = {};

    // Validate amount
    if (!amount || amount.trim() === '') {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    } else if (Number(amount) > Number(projectBalance)) {
      newErrors.amount = `Amount cannot exceed project balance (${Number(projectBalance).toLocaleString()} RUSD)`;
    }

    // Validate proof
    if (!proof || proof.trim() === '') {
      newErrors.proof = 'Proof of work is required';
    } else if (proof.trim().length < 10) {
      newErrors.proof = 'Proof must be at least 10 characters long';
    }

    // Optional: Validate if proof looks like a URL
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (proof && !urlPattern.test(proof.trim())) {
      newErrors.proof = 'Please provide a valid URL as proof of work';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onRequestWithdrawal(projectAddress, amount, proof);
    }
  };

  const handleMaxAmount = () => {
    setAmount(projectBalance.toString());
    setErrors(prev => ({ ...prev, amount: '' }));
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 ">
      <div className="bg-white rounded-lg w-full max-w-md shadow-2xl my-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Request Withdrawal</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isRequesting}
            className="hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Project Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Project Information</h3>
                <div className="text-sm text-blue-700 mt-1 space-y-1">
                  <p>Project ID: {projectId}</p>
                  <p>Available Balance: <span className="font-semibold">{Number(projectBalance).toLocaleString()} RUSD</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor="withdrawAmount" className="text-sm font-medium text-gray-700">
              Withdrawal Amount (RUSD) <span className="text-red-500">*</span>
            </Label>
            <div className="mt-1 flex space-x-2">
              <Input
                id="withdrawAmount"
                type="number"
                step="0.01"
                min="0"
                max={projectBalance}
                placeholder="Enter amount to withdraw"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) {
                    setErrors(prev => ({ ...prev, amount: '' }));
                  }
                }}
                disabled={isRequesting}
                className={`flex-1 ${errors.amount ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              />
              <Button
                type="button"
                variant="outline"
                className="px-3"
                onClick={handleMaxAmount}
                disabled={isRequesting}
              >
                Max
              </Button>
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.amount}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Maximum available: {Number(projectBalance).toLocaleString()} RUSD
            </p>
          </div>

          {/* Proof Input */}
          <div>
            <Label htmlFor="workProof" className="text-sm font-medium text-gray-700">
              Proof of Work (URL/Link) <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="workProof"
              rows={4}
              placeholder="Provide a link or detailed description of work completed (e.g., project documentation, reports, deliverables)"
              value={proof}
              onChange={(e) => {
                setProof(e.target.value);
                if (errors.proof) {
                  setErrors(prev => ({ ...prev, proof: '' }));
                }
              }}
              disabled={isRequesting}
              className={`mt-1 ${errors.proof ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.proof && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.proof}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Provide evidence of completed work, project milestones, or deliverables
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Withdrawal requests are subject to review and approval. Ensure your proof of work 
                  is comprehensive and verifiable before submitting.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isRequesting}
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isRequesting || !amount || !proof}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 flex items-center space-x-2"
          >
            {isRequesting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Requesting...</span>
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                <span>Request Withdrawal</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

WithdrawalModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onRequestWithdrawal: PropTypes.func.isRequired,
  projectAddress: PropTypes.string.isRequired,
  projectBalance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isRequesting: PropTypes.bool.isRequired,
  projectId: PropTypes.string.isRequired,
};

export default WithdrawalModal;