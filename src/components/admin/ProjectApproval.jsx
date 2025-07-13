/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import ProjectCard from '../projects/ProjectCard';
import { useToast } from '../ui/use-toast';

const ProjectApproval = () => {
  const { userAddress, approveAndIssueCredits,
    rejectAndRemoveProject, validateProject,
    verifyProject, checkIsOwner, checkAuthorizedVVB,
    getListedProjects } = useContractInteraction();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isVVB, setIsVVB] = useState(false);
  const [update, setUpdate] = useState(0);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveProjectAddress, setApproveProjectAddress] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const data = await getListedProjects();
        setProjects(data);
        const owner = await checkIsOwner();
        const vvb = await checkAuthorizedVVB();
        setIsOwner(owner);
        setIsVVB(vvb);
      } catch (error) {
        console.error('Error fetching projects:');
      }
      setLoading(false);
    };
    fetchProjects();
  }, [userAddress, update]);

  const handleApprove = async (projectAddress, creditAmount) => {
    // Find the project details to get emissionReductions
    const project = projects.find(p => p.projectContract === projectAddress);
    const emissionReductions = Number(project?.emissionReductions ?? 0);

    if (Number(creditAmount) > Number(emissionReductions)) {
      // alert("Credit amount must be less than emission reductions.");
      toast({
        title: "Credit amount error",
        description: "Credit amount must be less than emission reductions.",
        variant: "destructive",
      });
      return;
    }

    try {
      const tx = await approveAndIssueCredits(projectAddress, creditAmount);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        // alert(`Project Approved! Transaction: ${tx.hash}`);
        toast({
          title: "Project Approved",
          description: `Transaction: ${tx.hash}`,
          variant: "success",
        });
        setUpdate(update + 1); // Trigger re-fetch of projects
      } else {
        alert(`Transaction failed!`);
      }
    } catch (error) {
      console.error('Approval failed:', error);
      alert(`Approval failed: ${error.message}`);
    }
  };

  const handleReject = async (projectAddress) => {
    try {
      const tx = await rejectAndRemoveProject(projectAddress);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        // alert(`Project rejected! Transaction: ${tx.hash}`);
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
      // alert(`Rejection failed: ${error.message}`);
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleValidate = async (projectAddress) => {
    try {
      const tx = await validateProject(projectAddress);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        // alert(`Project validated! Transaction: ${tx.hash}`);
        toast({
          title: "Project Validated",
          description: `Transaction: ${tx.hash}`,
          variant: "success",
        });
        setUpdate(update + 1); // Trigger re-fetch of projects
      } else {
        alert(`Transaction failed!`);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      // alert(`Validation failed: ${error.message}`);
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleVerify = async (projectAddress) => {
    try {
      const tx = await verifyProject(projectAddress);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        // alert(`Project verified! Transaction: ${tx.hash}`);
        toast({
          title: "Project Verified",
          description: `Transaction: ${tx.hash}`,
          variant: "success",
        });
        setUpdate(update + 1); // Trigger re-fetch of projects
      } else {
        // alert(`Transaction failed!`);
        toast({
          title: "Transaction Failed",
          description: `Transaction: ${tx.hash}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Verification failed:', error);
      // alert(`Verification failed: ${error.message}`);
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Project Approval Queue</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2">
          {projects.map(projectAddress => (
            <div key={projectAddress.projectContract} className='mb-3'>
              <ProjectCard project={projectAddress.projectContract} />
              {!projectAddress.isApproved && (  // Only show buttons if not approved
                <div className="mt-2">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => {
                          setApproveProjectAddress(projectAddress.projectContract);
                          setShowApproveModal(true);
                          setCreditAmount('');
                        }}
                        className={`${projectAddress.isValidated && projectAddress.isVerified
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-400 cursor-not-allowed"
                          } text-white px-4 py-2 rounded mr-2`}
                        disabled={!projectAddress.isValidated || !projectAddress.isVerified}
                      >
                        Approve & Issue Credits
                      </button>
                      <button
                        onClick={() => handleReject(projectAddress.projectContract)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mr-2"
                      >
                        Reject
                      </button>
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

      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-xl font-bold mb-4">Enter Credit Amount</h2>
            <input
              type="number"
              min="0"
              className="w-full border rounded px-2 py-1 mb-4"
              placeholder="Credit Amount"
              value={creditAmount}
              onChange={e => setCreditAmount(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                onClick={() => setShowApproveModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={() => {
                  handleApprove(approveProjectAddress, creditAmount);
                  setShowApproveModal(false);
                }}
                disabled={!creditAmount}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default ProjectApproval;