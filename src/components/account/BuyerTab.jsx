/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import {useContractInteraction} from '../contract/ContractInteraction';
import ProjectCard from '../projects/ProjectCard';

const BuyerTab = () => {
  const { userAddress, mintWithRUSD, 
    transferCredits, 
    retireCredits,
    getUserProjects,  
    approveRUSD,
    checkRUSDAllowance,
  } = useContractInteraction();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!userAddress) return;
      setLoading(true);
      try {
        const userProjects = await getUserProjects();
        setProjects(userProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
      setLoading(false);
    };
    fetchUserProjects();
  }, [userAddress]);

const handleMint = async (projectAddress, amount) => {
  try {
    // First check if we have sufficient allowance
    const allowance = await checkRUSDAllowance(projectAddress);
    
    // If allowance is insufficient, approve first
    if (BigInt(allowance) <= BigInt(0)) {
      console.log("Insufficient allowance, approving RUSD first...");
      
      // Request RUSD approval
      const approveTx = await approveRUSD(projectAddress);
      const approveReceipt = await approveTx.wait();
      
      if (approveReceipt.status !== 1) {
        alert("RUSD approval failed");
        return;
      }
      
      console.log("RUSD approved successfully");
    }
    
    // Now proceed with minting
    const tx = await mintWithRUSD(projectAddress, amount);
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      alert(`Minting successful! Transaction: ${tx.hash}`);
    } else {
      alert(`Transaction failed!`);
    }
  } catch (error) {
    console.error('Minting failed:', error);
    alert(`Minting failed: ${error.message}`);
  }
};

  const handleTransfer = async (projectAddress, to, amount) => {
    try {
      const tx = await transferCredits(projectAddress, to, amount);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert(`Transfer initiated! Transaction: ${tx.hash}`);
      } else {
        alert(`Transaction failed!`);
      }
    } catch (error) {
      console.error('Transfer failed:', error);
      alert(`Transfer failed: ${error.message}`);
    }
  };

  const handleRetire = async (projectAddress, amount) => {
    try {
      const tx = await retireCredits(projectAddress, amount);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert(`Retirement initiated! Transaction: ${tx.hash}`);
      } else {
        alert(`Transaction failed!`);
      }
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
            <div key={project.projectContract}>
              <ProjectCard project={project.projectContract} />
              <div className="mt-2">
                <p>Balance: {project.balance}</p>
                <button
                  onClick={() => handleMint(project.projectContract, 1)}
                  className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                >
                  Mint Credits
                </button>
                {/* <button
                  onClick={() => handleTransfer(project.projectContract, prompt('Enter recipient address:'), 1)}
                  className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                >
                  Transfer
                </button> */}
                <button
                  onClick={() => handleRetire(project.projectContract, 1)}
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