/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CheckCircle2, AlertCircle, PersonStanding, TreePine } from 'lucide-react';

const ProjectHeader = ({ project, onOpenHoldersModal }) => {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <TreePine className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {project.metadata?.name}
            </h1>
          </div>
        </div>

        <div className="mt-2 sm:mt-0 sm:ml-auto flex flex-wrap gap-2">
          {project.isPresale && Number(project.presaleAmount) > 0 ? (
            <Badge className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700 border-green-200">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              In Presale
            </Badge>
          ) : project.isPresale && Number(project.presaleAmount) === 0 ? (
            <Badge className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-700 border-yellow-200">
              <AlertCircle className="w-4 h-4 mr-1" />
              Presale Approval Pending
            </Badge>
          ) : null}

        {  !project.isPresale && <>
          {project.isApproved ? (
            <Badge className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700 border-green-200">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Approved
            </Badge>
          ) : (
            <Badge className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-700 border-yellow-200">
              <AlertCircle className="w-4 h-4 mr-1" />
              Pending Approval
            </Badge>
          )}
          </>
}
          <Badge className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700 border-green-200">
            <DollarSign className="w-4 h-4 mr-1" />
            Total RUSD Collected {Number(project.totalSupply) * Number(project.projectMintPrice)}
          </Badge>

          <Badge
            className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700 border-green-200 cursor-pointer hover:bg-green-200 transition-colors"
            onClick={onOpenHoldersModal}
          >
            <PersonStanding className="w-4 h-4 mr-1" />
            Holders
          </Badge>
        </div>
      </div>
    </div>
  );
};

ProjectHeader.propTypes = {
  project: PropTypes.shape({
    metadata: PropTypes.shape({
      name: PropTypes.string,
    }),
    isPresale: PropTypes.bool,
    presaleAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isApproved: PropTypes.bool,
    totalSupply: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    projectMintPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onOpenHoldersModal: PropTypes.func.isRequired,
};

export default ProjectHeader;