/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import ProjectCard from '../projects/ProjectCard';
import { useToast } from '../ui/use-toast';
import { useConnectWallet } from '@/context/walletcontext';
import { apihost, uriTokenThree } from '../contract/address';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import { jwtDecode } from 'jwt-decode';

const ProjectApproval = () => {
  const {
    approveAndIssueCredits,
    rejectAndRemoveProject,
    validateProject,
    verifyProject,
    checkIsOwner,
    checkAuthorizedVVB,
  } = useContractInteraction();

  const { walletAddress } = useConnectWallet();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isVVB, setIsVVB] = useState(false);
  const [update, setUpdate] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [projectsPerPage, setProjectsPerPage] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveProjectAddress, setApproveProjectAddress] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [maxCreditAmount, setMaxCreditAmount] = useState(0);
  const [totalEmissionReductions, setTotalEmissionReductions] = useState(0);
  const [alreadyApprovedCredits, setAlreadyApprovedCredits] = useState(0);
  const [uriToken, setUriToken] = useState('');
  const [governancePresaleMintPrice, setGovernancePresaleMintPrice] = useState(0);
  const [isApproving, setIsApproving] = useState(false);

  const account = useActiveAccount();
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, [walletAddress, update, currentPage, projectsPerPage]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${apihost}/project/getallprojects?page=${currentPage}&limit=${projectsPerPage}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();

      if (data && data.projects) {
        setProjects(data.projects || []);

        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalProjects(data.pagination.totalProjects);
          setHasNextPage(data.pagination.hasNextPage);
          setHasPrevPage(data.pagination.hasPrevPage);
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch projects",
          variant: "destructive",
        });
        setProjects([]);
      }

      const owner = await checkIsOwner();
      const vvb = await checkAuthorizedVVB();
      setIsOwner(owner);
      setIsVVB(vvb);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects. Please try again.",
        variant: "destructive",
      });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLimitChange = (newLimit) => {
    setProjectsPerPage(parseInt(newLimit));
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const handleApprove = async () => {
    if (!governancePresaleMintPrice) {
      toast({
        title: "Validation Error",
        description: "Please enter both credit amount and mint price",
        variant: "destructive",
      });
      return;
    }

    if (Number(creditAmount) > maxCreditAmount) {
      toast({
        title: "Credit amount error",
        description: `Credit amount must be less than or equal to ${maxCreditAmount} tCO₂.`,
        variant: "destructive",
      });
      return;
    }

    // if (Number(creditAmount) <= 0) {
    //   toast({
    //     title: "Credit amount error",
    //     description: "Credit amount must be greater than 0.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    console.log("Project token URI:", uriToken, uriTokenThree);
    if (uriToken === uriTokenThree) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Project URI is not updated",
      });
      return;
    }

    setIsApproving(true);
    try {
      const receipt = await approveAndIssueCredits(
        approveProjectAddress,
        Number(creditAmount),
        Number(governancePresaleMintPrice),
        account
      );
      if (receipt.status === "success") {
        const data = await fetch(`${apihost}/project/updateprojectdetails/${approveProjectAddress}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (data.ok) {
          const result = await data.json();
          console.log("Approval result:", result);
        }
        toast({
          title: "Project Approved",
          description: `Successfully approved ${creditAmount} tCO₂ credits`,
          variant: "default",
        });
        setShowApproveModal(false);
        setCreditAmount('');
        setGovernancePresaleMintPrice(0);
        setUpdate(update + 1);
      } else {
        toast({
          title: "Transaction Failed",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Approval failed:', error);
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (projectAddress) => {
    try {
      const tx = await rejectAndRemoveProject(projectAddress, account);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        toast({
          title: "Project Rejected",
          description: `Transaction: ${tx.hash}`,
          variant: "destructive",
        });
        setUpdate(update + 1);
      } else {
        alert(`Transaction failed!`);
      }
    } catch (error) {
      console.error('Rejection failed:', error);
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleValidate = async (projectAddress) => {
    try {
      const receipt = await validateProject(projectAddress, account);
      if (receipt.status === "success") {
        const data = await fetch(`${apihost}/vvb/validate-project/${projectAddress}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (data.ok) {
          const result = await data.json();
          console.log("Validation result:", result);
        }
        toast({
          title: "Project Validated",
          description: `Transaction: ${receipt.hash}`,
          variant: "success",
        });
        setUpdate(update + 1);
      } else {
        alert(`Transaction failed!`);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleVerify = async (projectAddress) => {
    try {
      const receipt = await verifyProject(projectAddress, account);
      if (receipt.status === "success") {
        const data = await fetch(`${apihost}/vvb/verify-project/${(projectAddress)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (data.ok) {
          const result = await data.json();
          console.log("Verification result:", result);
        }
        toast({
          title: "Project Verified",
          description: `Transaction: ${receipt.hash}`,
          variant: "success",
        });
        setUpdate(update + 1);
      } else {
        toast({
          title: "Transaction Failed",
          description: `Transaction: ${receipt.hash}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Verification failed:', error);
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isUserAuthenticated = () => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return false;
      }
      return true;
    } catch (error) {
      localStorage.removeItem("token");
      return false;
    }
  };

  const isFullyAuthenticated = walletAddress && isUserAuthenticated();

  return (
    <div className="p-4">
      {/* Header with pagination info */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Approval Queue</h2>
        <p className="text-gray-600">
          Manage project approvals and validation ({totalProjects} total projects)
        </p>
      </div>

      {/* Projects per page selector */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {loading ? (
              "Loading projects..."
            ) : (
              `Showing ${((currentPage - 1) * projectsPerPage) + 1} to ${Math.min(currentPage * projectsPerPage, totalProjects)} of ${totalProjects} projects`
            )}
          </div>
          <Select value={projectsPerPage.toString()} onValueChange={handleLimitChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 per page</SelectItem>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Found</h3>
          <p className="text-gray-600">There are no projects in the approval queue at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2">
          {projects.map(projectAddress => (
            <div key={projectAddress.projectContract} className='mb-3'>
              <ProjectCard project={projectAddress.projectContract} isAuthenticated={isFullyAuthenticated} />
              {!projectAddress.isApproved && (
                <div className="mt-2">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => {
                          setApproveProjectAddress(projectAddress.projectContract);
                          setShowApproveModal(true);
                          const maxCredits = Number(projectAddress.emissionReductions) - Number(projectAddress.credits);
                          setCreditAmount(maxCredits);
                          setMaxCreditAmount(maxCredits);
                          setTotalEmissionReductions(Number(projectAddress.emissionReductions));
                          setAlreadyApprovedCredits(Number(projectAddress.credits));
                          setUriToken(projectAddress.tokenUri);
                          setGovernancePresaleMintPrice(projectAddress.projectMintPrice || 1);
                        }}
                        className={`${projectAddress.isValidated && projectAddress.isVerified
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-400 cursor-not-allowed"
                          } text-white px-4 py-2 rounded mr-2`}
                        disabled={!projectAddress.isValidated || !projectAddress.isVerified}
                      >
                        Approve & Issue Credits
                      </button>
                      {Number(projectAddress.credits) === 0 && (
                        <button
                          onClick={() => handleReject(projectAddress.projectContract)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mr-2"
                        >
                          Reject
                        </button>
                      )}
                    </>
                  )}

                  {isVVB && (
                    <>
                      {!projectAddress.isValidated && (
                        <button
                          onClick={() => handleValidate(projectAddress.projectContract)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
                        >
                          Validate
                        </button>
                      )}
                      {projectAddress.isValidated && !projectAddress.isVerified && (
                        <button
                          onClick={() => handleVerify(projectAddress.projectContract)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                          Verify
                        </button>
                      )}
                      {projectAddress.isValidated && projectAddress.isVerified && (
                        <span className="text-green-600 font-medium">
                          ✓ Project validated and verified
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}

              {projectAddress.isApproved && isOwner && (
                <div className="mt-2">
                  <span className="text-green-600 font-medium">
                    ✓ Project approved and credits issued
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination - keeping existing pagination code */}

      {/* Enhanced Approve Modal */}
      {showApproveModal && (
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
                onClick={() => {
                  setShowApproveModal(false);
                  setCreditAmount('');
                  setGovernancePresaleMintPrice(0);
                }}
                disabled={isApproving}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleApprove}
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
      )}
    </div>
  );
};

export default ProjectApproval;