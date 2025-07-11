/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import {useContractInteraction} from '../contract/ContractInteraction';
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

  const handleApprove = async (projectAddress, creditAmount, certificateId) => {
    try {
      const tx = await approveAndIssueCredits(projectAddress, creditAmount, certificateId || 'CERT-' + Date.now());
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert(`Project Approved! Transaction: ${tx.hash}`);
      } else {
        alert(`Transaction failed!`);
      }
      // await fetch('http://localhost:3001/api/transaction', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ transactionHash: hash, projectAddress, userAddress })
      // });
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
      // await fetch('http://localhost:3001/api/transaction', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ transactionHash: hash, projectAddress, userAddress })
      // });

    } catch (error) {
      console.error('Rejection failed:', error);
      alert(`Rejection failed: ${error.message}`);
    }
  };

  const handleValidate = async (projectAddress) => {
    try {
      const tx  = await validateProject(projectAddress);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert(`Project validated! Transaction: ${tx.hash}`);
      } else {
        alert(`Transaction failed!`);
      }
      // await fetch('http://localhost:3001/api/transaction', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ transactionHash: hash, projectAddress, userAddress })
      // });
      // alert(`Project validated! Transaction: ${hash}`);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(projectAddress => (
            <div key={projectAddress}>
              <ProjectCard project={projectAddress} />
              {!projectAddress.isApproved && (
                <div className="mt-2">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => handleApprove(projectAddress, prompt('Enter credit amount:'), prompt('Enter certificate ID:'))}
                        className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                      >
                        Approve & Issue Credits
                      </button>
                      <button
                        onClick={() => handleReject(projectAddress)}
                        className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {isVVB && (
                    <>
                      <button
                        onClick={() => handleValidate(projectAddress)}
                        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                      >
                        Validate
                      </button>
                      <button
                        onClick={() => handleVerify(projectAddress)}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                      >
                        Verify
                      </button>
                    </>
                  )}
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