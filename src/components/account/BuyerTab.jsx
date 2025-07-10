import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import useContractInteraction from '../contract/ContractInteraction';
import ProjectCard from '../projects/ProjectCard';
import bco2Abi from '../contract/BCO2.json';

const BuyerTab = () => {
  const { userAddress, mintWithRUSD, transferCredits, retireCredits, getUserBalance } = useContractInteraction();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!userAddress) return;
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3001/api/sync-projects');
        const data = await response.json();
        const userProjects = await Promise.all(
          data.projects?.map(async (project) => {
            const response = await fetch(`http://localhost:3001/api/project/${project.projectAddress}?userAddress=${userAddress}`);
            const projectData = await response.json();
            if (projectData.isApproved) {
              const balance = await getUserBalance(project.projectAddress, 1);
              if (balance > 0) return { ...projectData, balance };
            }
            return null;
          }) || []
        );
        setProjects(userProjects.filter(p => p));
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
      setLoading(false);
    };
    fetchUserProjects();
  }, [userAddress, getUserBalance]);

  const handleMint = async (projectAddress, amount) => {
    try {
      const { hash } = await mintWithRUSD(projectAddress, amount);
      await fetch('http://localhost:3001/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: hash, projectAddress, userAddress })
      });
      alert(`Minting initiated! Transaction: ${hash}`);
    } catch (error) {
      console.error('Minting failed:', error);
      alert(`Minting failed: ${error.message}`);
    }
  };

  const handleTransfer = async (projectAddress, to, amount) => {
    try {
      const { hash } = await transferCredits(projectAddress, to, amount);
      await fetch('http://localhost:3001/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: hash, projectAddress, userAddress })
      });
      alert(`Transfer initiated! Transaction: ${hash}`);
    } catch (error) {
      console.error('Transfer failed:', error);
      alert(`Transfer failed: ${error.message}`);
    }
  };

  const handleRetire = async (projectAddress, amount) => {
    try {
      const { hash } = await retireCredits(projectAddress, amount);
      await fetch('http://localhost:3001/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: hash, projectAddress, userAddress })
      });
      alert(`Retirement initiated! Transaction: ${hash}`);
    } catch (error) {
      console.error('Retirement failed:', error);
      alert(`Retirement failed: ${error.message}`);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Buyer Dashboard</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.projectAddress}>
              <ProjectCard project={project} />
              <div className="mt-2">
                <p>Balance: {project.balance}</p>
                <button
                  onClick={() => handleMint(project.projectAddress, 1)}
                  className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                >
                  Mint Credits
                </button>
                <button
                  onClick={() => handleTransfer(project.projectAddress, prompt('Enter recipient address:'), 1)}
                  className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                >
                  Transfer
                </button>
                <button
                  onClick={() => handleRetire(project.projectAddress, 1)}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Retire
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuyerTab;