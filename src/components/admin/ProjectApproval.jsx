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
import { m } from 'framer-motion';

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

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveProjectAddress, setApproveProjectAddress] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [maxCreditAmount, setMaxCreditAmount] = useState(0);
  const [uriToken, setUriToken] = useState('');
  const [governancePresaleMintPrice, setGovernancePresaleMintPrice] = useState(0);

  const account = useActiveAccount()

  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, [walletAddress, update, currentPage, projectsPerPage]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // Fetch projects from backend with pagination
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

        // Update pagination state
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
    setCurrentPage(1); // Reset to first page when changing limit
  };

  // Generate page numbers for pagination
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
    if (!creditAmount || !governancePresaleMintPrice) {
      toast({
        title: "Validation Error",
        description: "Please enter both credit amount and mint price",
        variant: "destructive",
      });
      return;
    }
    // validate credit amount against emission reductions

    if (Number(creditAmount) > maxCreditAmount) {
      toast({
        title: "Credit amount error",
        description: `Credit amount must be less than or equal to ${maxCreditAmount} tCO₂.`,
        variant: "destructive",
      });
      return;
    }

    console.log("Project token URI:", uriToken, uriTokenThree);
    if (uriToken === uriTokenThree) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Project URI is not updated",
      });
      return;
    }

    // // Find the project details to get emissionReductions
    // const project = projects.find(p => p.projectContract === approveProjectAddress);
    // const emissionReductions = Number(project?.emissionReductions ?? 0);

    // if (Number(creditAmount) > Number(emissionReductions)) {
    //   toast({
    //     title: "Credit amount error",
    //     description: "Credit amount must be less than emission reductions.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

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
          description: `Transaction: ${receipt.hash}`,
          variant: "default",
        });
        setShowApproveModal(false);
        setCreditAmount('');
        setGovernancePresaleMintPrice(0);
        setUpdate(update + 1); // Trigger re-fetch of projects
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
        setUpdate(update + 1); // Trigger re-fetch of projects
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
        setUpdate(update + 1); // Trigger re-fetch of projects
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
        setUpdate(update + 1); // Trigger re-fetch of projects
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
      // Check if token is expired
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
              {!projectAddress.isApproved && (  // Only show buttons if not approved
                <div className="mt-2">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => {
                          setApproveProjectAddress(projectAddress.projectContract);
                          setShowApproveModal(true);
                          setCreditAmount(Number(projectAddress.emissionReductions) - Number(projectAddress.credits));
                          setMaxCreditAmount(Number(projectAddress.emissionReductions) - Number(projectAddress.credits));
                          setUriToken(projectAddress.tokenUri);
                          setGovernancePresaleMintPrice(1); // Default mint price
                        }}
                        className={`${projectAddress.isValidated && projectAddress.isVerified
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-400 cursor-not-allowed"
                          } text-white px-4 py-2 rounded mr-2`}
                        disabled={!projectAddress.isValidated || !projectAddress.isVerified}
                      >
                        Approve & Issue Credits
                      </button>
                      {Number(projectAddress.credits) === 0 && <button
                        onClick={() => handleReject(projectAddress.projectContract)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mr-2"
                      >
                        Reject
                      </button>}
                    </>
                  )}

                  {isVVB && (
                    <>
                      {/* Show Validate button if not validated */}
                      {!projectAddress.isValidated && (
                        <button
                          onClick={() => handleValidate(projectAddress.projectContract)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
                        >
                          Validate
                        </button>
                      )}
                      {/* Show Verify button only if validated but not yet verified */}
                      {projectAddress.isValidated && !projectAddress.isVerified && (
                        <button
                          onClick={() => handleVerify(projectAddress.projectContract)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                          Verify
                        </button>
                      )}
                      {/* Show status if both validated and verified */}
                      {projectAddress.isValidated && projectAddress.isVerified && (
                        <span className="text-green-600 font-medium ">
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Pagination Info */}
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * projectsPerPage) + 1} to{' '}
              {Math.min(currentPage * projectsPerPage, totalProjects)} of{' '}
              {totalProjects} projects
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-2">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrevPage}
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {currentPage > 3 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                    >
                      1
                    </Button>
                    {currentPage > 4 && <span className="px-2 text-gray-400">...</span>}
                  </>
                )}

                {getPageNumbers().map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                    className={currentPage === pageNumber ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {pageNumber}
                  </Button>
                ))}

                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className="px-2 text-gray-400">...</span>}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage}
                className="flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Updated Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Approve Project & Issue Credits</h2>

            <div className="space-y-4">
              {/* Credit Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Amount (tCO₂)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter credit amount"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {maxCreditAmount} tCO₂
                </p>
              </div>

              {/* Mint Price Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mint Price (RUSD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter mint price"
                  value={governancePresaleMintPrice}
                  onChange={(e) => setGovernancePresaleMintPrice(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Price per credit in RUSD
                </p>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                onClick={() => {
                  setShowApproveModal(false);
                  setCreditAmount('');
                  setGovernancePresaleMintPrice(0);
                }}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleApprove}
                disabled={!creditAmount || !governancePresaleMintPrice}
              >
                Approve & Issue Credits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectApproval;