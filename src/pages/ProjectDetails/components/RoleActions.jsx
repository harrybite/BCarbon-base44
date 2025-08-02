/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';

const RoleActions = ({ 
  isOwner, 
  isVVB, 
  project, 
  onOpenApproveModal, 
  onOpenPresaleApproveModal,
  onValidate, 
  onVerify 
}) => {
  return (
    <div className="mb-6 mt-3">
      {isOwner ? (
        <>
          <Button
            className="w-full bg-green-700 hover:bg-green-800 mb-4"
            onClick={onOpenPresaleApproveModal}
            disabled={ project.presaleAmount > 0}
          >
            {project.presaleAmount > 0 ? 'Presale Approved' : 'Approve Presale Credits'}
          </Button>
          <Button
            className="w-full bg-blue-700 hover:bg-blue-800 mb-4 mt-3"
            onClick={onOpenApproveModal}
            disabled={!(project.isValidated && project.isVerified) || project.isApproved}
          >
            {project.isApproved ? 'Approved ' : 'Approve and Issue Credits'}
          </Button>
          
        
          
          {!(project.isValidated && project.isVerified) && (
            <div className="text-sm text-gray-500 mb-2">
              {!project.isValidated
                ? "Approval is disabled: Project must be validated first."
                : !project.isVerified
                  ? "Approval is disabled: Project must be verified after validation."
                  : null
              }
            </div>
          )}
        </>
      ) : isVVB ? (
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <Button
              className="bg-yellow-700 hover:bg-yellow-800 w-full"
              onClick={onValidate}
              disabled={project.isValidated}
            >
              Validate
            </Button>
            {project.isValidated && (
              <div className="text-sm text-gray-500 mt-1">
                Validation is already completed.
              </div>
            )}
          </div>
          <div className="flex-1">
            <Button
              className="bg-green-700 hover:bg-green-800 w-full"
              onClick={onVerify}
              disabled={!project.isValidated || project.isVerified}
            >
              Verify
            </Button>
            {!project.isValidated && (
              <div className="text-sm text-gray-500 mt-1">
                Verification is disabled: Validation is pending.
              </div>
            )}
            {project.isValidated && project.isVerified && (
              <div className="text-sm text-gray-500 mt-1">
                Verification is already completed.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

RoleActions.propTypes = {
  isOwner: PropTypes.bool.isRequired,
  isVVB: PropTypes.bool.isRequired,
  project: PropTypes.shape({
    isValidated: PropTypes.bool,
    isVerified: PropTypes.bool,
    isApproved: PropTypes.bool,
    presaleAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onOpenApproveModal: PropTypes.func.isRequired,
  onOpenPresaleApproveModal: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired,
  onVerify: PropTypes.func.isRequired,
};

export default RoleActions;