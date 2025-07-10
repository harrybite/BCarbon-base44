import { useState, useEffect } from 'react';
import useContractInteraction from '../contract/ContractInteraction';

const GovernanceTab = () => {
  const { userAddress, pauseContract, unpauseContract, addVVB, removeVVB, updateRegistryAddress, checkIsOwner } = useContractInteraction();
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwner = async () => {
      setIsOwner(await checkIsOwner());
    };
    checkOwner();
  }, [checkIsOwner]);

  const handlePause = async () => {
    try {
      const { hash } = await pauseContract();
      await fetch('http://localhost:3001/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: hash, userAddress })
      });
      alert(`Contract paused! Transaction: ${hash}`);
    } catch (error) {
      alert(`Pause failed: ${error.message}`);
    }
  };

  const handleUnpause = async () => {
    try {
      const { hash } = await unpauseContract();
      await fetch('http://localhost:3001/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: hash, userAddress })
      });
      alert(`Contract unpaused! Transaction: ${hash}`);
    } catch (error) {
      alert(`Unpause failed: ${error.message}`);
    }
  };

  const handleAddVVB = async () => {
    const vvbAddress = prompt('Enter VVB address:');
    if (vvbAddress) {
      try {
        const { hash } = await addVVB(vvbAddress);
        await fetch('http://localhost:3001/api/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionHash: hash, userAddress })
        });
        alert(`VVB added! Transaction: ${hash}`);
      } catch (error) {
        alert(`Add VVB failed: ${error.message}`);
      }
    }
  };

  const handleRemoveVVB = async () => {
    const vvbAddress = prompt('Enter VVB address to remove:');
    if (vvbAddress) {
      try {
        const { hash } = await removeVVB(vvbAddress);
        await fetch('http://localhost:3001/api/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionHash: hash, userAddress })
        });
        alert(`VVB removed! Transaction: ${hash}`);
      } catch (error) {
        alert(`Remove VVB failed: ${error.message}`);
      }
    }
  };

  const handleUpdateRegistry = async () => {
    const newRegistryAddress = prompt('Enter new registry address:');
    if (newRegistryAddress) {
      try {
        const { hash } = await updateRegistryAddress(newRegistryAddress);
        await fetch('http://localhost:3001/api/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionHash: hash, userAddress })
        });
        alert(`Registry updated! Transaction: ${hash}`);
      } catch (error) {
        alert(`Update registry failed: ${error.message}`);
      }
    }
  };

  if (!isOwner) return <p>You are not authorized to access governance controls.</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Governance Controls</h2>
      <div className="space-y-4">
        <button onClick={handlePause} className="bg-red-500 text-white px-4 py-2 rounded">
          Pause Contract
        </button>
        <button onClick={handleUnpause} className="bg-green-500 text-white px-4 py-2 rounded">
          Unpause Contract
        </button>
        <button onClick={handleAddVVB} className="bg-blue-500 text-white px-4 py-2 rounded">
          Add VVB
        </button>
        <button onClick={handleRemoveVVB} className="bg-blue-500 text-white px-4 py-2 rounded">
          Remove VVB
        </button>
        <button onClick={handleUpdateRegistry} className="bg-blue-500 text-white px-4 py-2 rounded">
          Update Registry Address
        </button>
      </div>
    </div>
  );
};

export default GovernanceTab;