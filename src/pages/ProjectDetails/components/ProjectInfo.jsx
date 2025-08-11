/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  IdCard, 
  User, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  DockIcon, 
  CoinsIcon, 
  LockOpen, 
  GitBranch, 
  Locate 
} from 'lucide-react';

const ProjectInfo = ({ project, methodology }) => {
  
  const formatLocations = (locationData) => {
    if (!locationData) return [];
    try {
      const locations = JSON.parse(locationData);
      return Array.isArray(locations) ? locations : [locations];
    } catch {
      return [locationData];
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center">
            <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
              <IdCard className="w-4 h-4 text-gray-400 mr-2" />
              Project ID:
            </span>
            <span className="font-semibold flex-grow text-right">{project.projectId}</span>
          </div>
          
          <div className="flex items-center">
            <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
              <IdCard className="w-4 h-4 text-gray-400 mr-2" />
              Certificate ID:
            </span>
            <span className="font-semibold flex-grow text-right">
              {project.isApproved ? (project.certificateId === '' ? "..." : project.certificateId) : "To be issued after approval from governance"}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
              <User className="w-4 h-4 text-gray-400 mr-2" />
              Owner address:
            </span>
            <span className="font-semibold flex-grow text-right">
              <a
                href={`https://testnet.bscscan.com/address/${project.proposer}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
                title={project.proposer}
              >
                <span className="block sm:hidden truncate">
                  {project.proposer ? `${project.proposer.slice(0, 6)}...${project.proposer.slice(-4)}` : "N/A"}
                </span>
                <span className="hidden sm:inline">
                  {project.proposer || "N/A"}
                </span>
              </a>
            </span>
          </div>

          <div className="flex items-start">
            <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
              <DockIcon className="w-4 h-4 text-gray-400 mr-2" />
              Methodology:
            </span>
            <span className="font-semibold flex-grow text-right whitespace-pre-wrap">
              {methodology[Number(project.methodology)] || "Unknown"}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
              <CoinsIcon className="w-4 h-4 text-gray-400 mr-2" />
              Emission Reduction Goal:
            </span>
            <span className="font-semibold flex-grow text-right">{Number(project.emissionReductions)} tCO<sub>2</sub></span>
          </div>
          
          <div className="flex items-center">
            <span className="font-medium text-gray-700 w-[140px] sm:w-[200px] flex items-center">
              <CoinsIcon className="w-4 h-4 text-gray-400 mr-2" />
              Approved Credits tCO<sub>2</sub>
            </span>
            <span className="font-semibold flex-grow text-right">
              {Number(project.credits) > 0 ? Number(project.credits) : "To be issued after approval from governance"}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              Listing date:
            </span>
            <span className="font-semibold flex-grow text-right">
              {new Date(Number(project.listingTimestamp) * 1000).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
              <LockOpen className="w-4 h-4 text-gray-400 mr-2" />
              Permanent:
            </span>
            <span className="font-semibold flex-grow text-right">
              <Badge variant={project.defaultIsPermanent ? "default" : "outline"}>
                {project.defaultIsPermanent ? "Yes" : "No"}
              </Badge>
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
              <GitBranch className="w-4 h-4 text-gray-400 mr-2" />
              Project CA:
            </span>
            <span className="font-semibold flex-grow text-right">
              <a
                href={`https://testnet.bscscan.com/address/${project.projectContract}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
                title={project.projectContract}
              >
                <span className="block sm:hidden truncate">
                  {project.projectContract ? `${project.projectContract.slice(0, 6)}...${project.projectContract.slice(-4)}` : "N/A"}
                </span>
                <span className="hidden sm:inline">
                  {project.projectContract || "N/A"}
                </span>
              </a>
            </span>
          </div>

          {project.defaultVintage && (
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                Vintage Date:
              </span>
              <span className="font-semibold flex-grow text-right">
                {new Date(Number(project.defaultVintage) * 1000).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {project.projectDetails && (
            <div className="flex items-start">
              <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
                <AlertCircle className="w-4 h-4 text-gray-400 mr-2" />
                Document Link:
              </span>
              <span className="font-semibold flex-grow text-right whitespace-pre-line">{project.projectDetails}</span>
            </div>
          )}
          
          <div className="flex items-start">
            <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-start">
              <Locate className="w-4 h-4 text-gray-400 mr-2" />
              Locations:
            </span>
            <div className="font-semibold flex-grow text-right">
              {formatLocations(project.location).map((loc, index) => (
                <p key={index} className="truncate sm:truncate cursor-help" title={loc}>
                  {loc.length > 30 ? `${loc.substring(0, 30)}...` : loc}
                </p>
              ))}
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
              <CheckCircle2 className="w-4 h-4 text-gray-400 mr-2" />
              Validity:
            </span>
            <span className="font-semibold flex-grow text-right">
              {Number(project.defaultValidity) === 0 ? '100+ years' : `${Number(project.defaultValidity)} years`}
            </span>
          </div>

          {/* <div className="flex items-center" >
            <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
              <CheckCircle2 className="w-4 h-4 text-gray-400 mr-2" />
              Total claimed by issuer:
            </span>
            <span className="font-semibold flex-grow text-right">
               {Number(project.totalClaimed).toLocaleString()} RUSD
            </span>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
};

ProjectInfo.propTypes = {
  project: PropTypes.shape({
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalClaimed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isApproved: PropTypes.bool,
    certificateId: PropTypes.string,
    proposer: PropTypes.string,
    methodology: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    emissionReductions: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isValidated: PropTypes.bool,
    credits: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    listingTimestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    defaultIsPermanent: PropTypes.bool,
    projectContract: PropTypes.string,
    defaultVintage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    projectDetails: PropTypes.string,
    location: PropTypes.string,
    defaultValidity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  methodology: PropTypes.object.isRequired,
};

export default ProjectInfo;