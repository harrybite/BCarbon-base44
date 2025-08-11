/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const ProjectOverview = ({ project }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span>Project Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {project.credits ? Number(project.credits).toLocaleString() : '0'} tCO<sub>2</sub>
            </div>
            <div className="text-sm text-gray-600">Total Supply</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-700">
              {project.totalSupply ? Number(project.totalSupply).toLocaleString() : '0'} tCO<sub>2</sub>
            </div>
            <div className="text-sm text-gray-600">Minted Supply</div>
          </div>
          {project.isPresale ? <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-600 disabled">
              Retire is disabled for presale projects
            </div>
            {/* <div className="text-sm text-gray-600">Total Retired</div> */}
          </div>: 
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {project.totalRetired ? Number(project.totalRetired).toLocaleString() : '0'} tCO<sub>2</sub>
            </div>
            <div className="text-sm text-gray-600">Total Retired</div>
          </div>}
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {project.projectMintPrice ? `${project.projectMintPrice} RUSD` : '0 RUSD'}
            </div>
            <div className="text-sm text-gray-600">Mint Price</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

ProjectOverview.propTypes = {
  project: PropTypes.shape({
    credits: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalSupply: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalRetired: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    projectMintPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isPresale: PropTypes.bool,
  }).isRequired,
};

export default ProjectOverview;