/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import {useContractInteraction} from '../contract/ContractInteraction';
import ProjectCard from '../projects/ProjectCard';
import { set } from 'date-fns';

const BuyerTab = () => {
  const { userAddress, mintWithRUSD, 
    transferCredits, 
    retireCredits,
    getUserProjects,  
    approveRUSD,
    checkRUSDAllowance,
    getRUSDBalance,
  } = useContractInteraction();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [update, setUpdate] = useState(0);
  const [rusdBalance, setRUSDBalance] = useState(0);

  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!userAddress) return;
      setLoading(true);
      try {
        const userProjects = await getUserProjects();
        setProjects(userProjects);
        const balance = await getRUSDBalance();
        setRUSDBalance(balance);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
      setLoading(false);
    };
    fetchUserProjects();
  }, [userAddress, update]);

const handleMint = async (projectAddress, amount) => {
  try {
    // First check if we have sufficient allowance
    const allowance = await checkRUSDAllowance(projectAddress);
    if (BigInt(allowance) <= BigInt(0)) {
      console.log("Insufficient allowance, approving RUSD first...");
      const approveTx = await approveRUSD(projectAddress);
      const approveReceipt = await approveTx.wait();
      if (approveReceipt.status !== 1) {
        alert("RUSD approval failed");
        return;
      }
      console.log("RUSD approved successfully");
    }
    

    const tx = await mintWithRUSD(projectAddress, amount);
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      alert(`Minting successful! Transaction: ${tx.hash}`);
      setUpdate(update + 1); // Trigger re-fetch of projects
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
        setUpdate(update + 1);
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuyerTab;