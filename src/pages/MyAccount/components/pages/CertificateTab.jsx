/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '@/components/contract/ContractInteraction';
import { useConnectWallet } from '@/context/walletcontext';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Award, 
  Calendar, 
  User, 
  TreePine, 
  ExternalLink,
  FileText,
  CheckCircle2,
  Clock,
  MapPin,
  Eye,
  Download,
  Share2,
  Loader2,
  Package,
  Wallet,
  ChevronRight,
  Building,
  Leaf,
  Target,

} from 'lucide-react';

const CertificatesTab = () => {
  const { getRetirementCertificatesForAllProject } = useContractInteraction();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [update, setUpdate] = useState(0);
  const [expandedProjects, setExpandedProjects] = useState(new Set());

  const { walletAddress } = useConnectWallet();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!walletAddress) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const count = await getRetirementCertificatesForAllProject();
        console.log('User retirement certificates count:', count);
        setProjects(count || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      }
      setLoading(false);
    };
    
    if (walletAddress) {
      fetchUserProjects();
    }
  }, [walletAddress, update]);

  // Helper function to trim address
  const trimAddress = (addr) => {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  // Toggle project expansion
  const toggleProject = (index) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedProjects(newExpanded);
  };

  // Calculate total certificates and tonnes
  const totalCertificates = projects.reduce((sum, project) => sum + project.certificates.length, 0);
  const totalTonnes = projects.reduce((sum, project) => 
    sum + project.certificates.reduce((certSum, cert) => certSum + Number(cert.tonnesRetired || 0), 0), 0
  );

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto">
        
        {/* Wallet Connection Check */}
        {!walletAddress && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Wallet Not Connected</h3>
                  <p className="text-red-700">Please connect your wallet to view your retirement certificates.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        {walletAddress && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-900">{totalCertificates}</div>
                    <div className="text-sm text-green-700">Total Certificates</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TreePine className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-900">{totalTonnes.toLocaleString()}</div>
                    <div className="text-sm text-blue-700">Total tCO₂ Retired</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-900">{projects.length}</div>
                    <div className="text-sm text-purple-700">Projects Retired From</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Certificates</h3>
              <p className="text-gray-600">Fetching your retirement certificates...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && walletAddress && (
          <Card className="border-gray-200">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No Retirement Certificates</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  You haven't retired any carbon credits yet. When you retire credits, your certificates will appear here.
                </p>
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <a href="/projects">
                    <TreePine className="w-4 h-4 mr-2" />
                    Browse Project
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects List */}
        {!loading && projects.length > 0 && (
          <div className="space-y-6">
            {projects.map((project, i) => (
              <Card key={i} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Project Header */}
                <CardHeader 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all"
                  onClick={() => toggleProject(i)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Building className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-white mb-1">
                          Carbon Project
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-blue-100">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm cursor-help">
                                {trimAddress(project.projectAddress)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-mono">{project.projectAddress}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Badge variant="secondary" className="bg-white/20 text-white border-0">
                            {project.certificates.length} Certificate{project.certificates.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <ChevronRight 
                      className={`w-6 h-6 transition-transform duration-200 ${
                        expandedProjects.has(i) ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                </CardHeader>

                {/* Certificates Grid - Collapsible */}
                {expandedProjects.has(i) && (
                  <CardContent className="p-6 bg-gray-50">
                    {project.certificates.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No certificates found for this project.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {project.certificates.map((cert, j) => (
                          <Card 
                            key={j} 
                            className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md hover:scale-[1.02]"
                            onClick={() =>
                              navigate("/ValidateCertificate", {
                                state: {
                                  projectAddress: project.projectAddress,
                                  account: cert.owner,
                                  certificateIndex: j,
                                  certificateId: cert.certificateId
                                }
                              })
                            }
                          >
                            <CardContent className="p-5">
                              {/* Certificate Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Award className="w-5 h-5 text-green-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900 text-sm">Certificate #{j + 1}</h4>
                                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs mt-1">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Verified
                                    </Badge>
                                  </div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                              </div>

                              {/* Certificate Details */}
                              <div className="space-y-3">
                                {/* Certificate ID */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="text-xs text-gray-500 mb-1">Certificate ID</div>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="font-mono text-sm text-gray-900 cursor-help truncate">
                                        {cert.certificateId || "Pending"}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-mono">{cert.certificateId || "Pending"}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>

                                {/* Owner */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="text-xs text-gray-500">Owner</span>
                                  </div>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="font-mono text-sm text-gray-900 cursor-help">
                                        {trimAddress(cert.owner)}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-mono">{cert.owner}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>

                                {/* Tonnes Retired */}
                                <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                                  <div className="flex items-center space-x-2">
                                    <TreePine className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-700">Retired</span>
                                  </div>
                                  <span className="text-lg font-bold text-green-800">
                                    {Number(cert.tonnesRetired || 0).toLocaleString()} <span className="text-sm">tCO₂</span>
                                  </span>
                                </div>

                                {/* Retirement Date */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-xs text-gray-500">Retired At</span>
                                  </div>
                                  <span className="text-sm text-gray-900">
                                    {cert.retireTimestamp
                                      ? new Date(Number(cert.retireTimestamp) * 1000).toLocaleDateString()
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>

                              {/* Action Indicator */}
                              <div className="mt-4 pt-3 border-t border-gray-100">
                                <div className="flex items-center text-blue-600 text-sm group-hover:text-blue-700">
                                  <Eye className="w-4 h-4 mr-2" />
                                  <span>View Certificate Details</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default CertificatesTab;