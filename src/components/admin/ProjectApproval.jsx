import { useState, useEffect } from 'react';
import useContractInteraction from '../contract/ContractInteraction';
import ProjectCard from '../projects/ProjectCard';

const ProjectApproval = () => {
  const { userAddress, approveAndIssueCredits, rejectAndRemoveProject, validateProject, verifyProject, checkIsOwner, checkAuthorizedVVB } = useContractInteraction();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isVVB, setIsVVB] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3001/api/sync-projects');
        const data = await response.json();
        setProjects(data.projects || []);
        setIsOwner(await checkIsOwner());
        setIsVVB(await checkAuthorizedVVB());
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
      setLoading(false);
    };
    fetchProjects();
  }, [userAddress, checkIsOwner, checkAuthorizedVVB]);

  const handleApprove = async (projectAddress, creditAmount, certificateId) => {
    try {
      const { hash } = await approveAndIssueCredits(projectAddress, creditAmount, certificateId || 'CERT-' + Date.now());
      await fetch('http://localhost:3001/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: hash, projectAddress, userAddress })
      });
      alert(`Project approved! Transaction: ${hash}`);
    } catch (error) {
      console.error('Approval failed:', error);
      alert(`Approval failed: ${error.message}`);
    }
  };

  const handleReject = async (projectAddress) => {
    try {
      const { hash } = await rejectAndRemoveProject(projectAddress);
      await fetch('http://localhost:3001/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: hash, projectAddress, userAddress })
      });
      alert(`Project rejected! Transaction: ${hash}`);
    } catch (error) {
      console.error('Rejection failed:', error);
      alert(`Rejection failed: ${error.message}`);
    }
  };

  const handleValidate = async (projectAddress) => {
    try {
      const { hash } = await validateProject(projectAddress);
      await fetch('http://localhost:3001/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: hash, projectAddress, userAddress })
      });
      alert(`Project validated! Transaction: ${hash}`);
    } catch (error) {
      console.error('Validation failed:', error);
      alert(`Validation failed: ${error.message}`);
    }
  };

  const handleVerify = async (projectAddress) => {
    try {
      const { hash } = await verifyProject(projectAddress);
      await fetch('http://localhost:3001/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: hash, projectAddress, userAddress })
      });
      alert(`Project verified! Transaction: ${hash}`);
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
          {projects.map(project => (
            <div key={project.projectAddress}>
              <ProjectCard project={project} />
              {!project.isApproved && (
                <div className="mt-2">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => handleApprove(project.projectAddress, prompt('Enter credit amount:'), prompt('Enter certificate ID:'))}
                        className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                      >
                        Approve & Issue Credits
                      </button>
                      <button
                        onClick={() => handleReject(project.projectAddress)}
                        className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {isVVB && (
                    <>
                      <button
                        onClick={() => handleValidate(project.projectAddress)}
                        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                      >
                        Validate
                      </button>
                      <button
                        onClick={() => handleVerify(project.projectAddress)}
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