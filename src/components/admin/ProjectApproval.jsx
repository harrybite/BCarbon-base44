/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import ProjectCard from '../projects/ProjectCard';

const ProjectApproval = () => {
  const { userAddress, approveAndIssueCredits,
    rejectAndRemoveProject, validateProject,
    verifyProject, checkIsOwner, checkAuthorizedVVB,
    getListedProjects } = useContractInteraction();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isVVB, setIsVVB] = useState(false);

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
  }, [userAddress]);

  const handleApprove = async (projectAddress, creditAmount) => {
    // Find the project details to get emissionReductions
    const project = projects.find(p => p.projectContract === projectAddress);
    const emissionReductions = Number(project?.emissionReductions ?? 0);

    console.log("Project :", project);
    console.log("Credit Amount:", emissionReductions);
    if (Number(creditAmount) <= Number(emissionReductions)) {
      alert("Credit amount must be greater than emission reductions.");
      return;
    }

    try {
      const tx = await approveAndIssueCredits(projectAddress, creditAmount);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert(`Project Approved! Transaction: ${tx.hash}`);
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
        alert(`Project rejected! Transaction: ${tx.hash}`);
      } else {
        alert(`Transaction failed!`);
      }

    } catch (error) {
      console.error('Rejection failed:', error);
      alert(`Rejection failed: ${error.message}`);
    }
  };

  const handleValidate = async (projectAddress) => {
    try {
      const tx = await validateProject(projectAddress);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert(`Project validated! Transaction: ${tx.hash}`);
      } else {
        alert(`Transaction failed!`);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      alert(`Validation failed: ${error.message}`);
    }
  };

  const handleVerify = async (projectAddress) => {
    try {
      const tx = await verifyProject(projectAddress);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert(`Project verified! Transaction: ${tx.hash}`);
      } else {
        alert(`Transaction failed!`);
      }
    } catch (error) {
      console.error('Verification failed:', error);
      alert(`Verification failed: ${error.message}`);
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
            <div key={projectAddress.projectContract}>
              <ProjectCard project={projectAddress.projectContract} />
              {!projectAddress.isApproved && (  // Only show buttons if not approved
                <div className="mt-2">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => handleApprove(projectAddress.projectContract, prompt('Enter credit amount:'))}
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
                      {!projectAddress.isValidated && (
                        <button
                          onClick={() => handleValidate(projectAddress.projectContract)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
                        >
                          Validate
                        </button>
                      )}
                      {!projectAddress.isVerified && (
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
    </div>
  );
};

export default ProjectApproval;