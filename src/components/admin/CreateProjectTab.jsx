import { useState } from 'react';
import useContractInteraction from '../contract/ContractInteraction';

const CreateProjectTab = ({ onCreate }) => {
  const { userAddress } = useContractInteraction();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    methodology: '',
    totalSupply: '',
    listingFee: '0.01', // Example fee in ETH
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { hash, projectAddress } = await onCreate(formData);
      await fetch('http://localhost:3001/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: hash, projectAddress, userAddress })
      });
      alert(`Project created! Address: ${projectAddress}, Transaction: ${hash}`);
    } catch (error) {
      console.error('Project creation failed:', error);
      alert('Project creation failed: ' + error.message);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Create New Project</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Project Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block">Methodology</label>
          <input
            type="text"
            name="methodology"
            value={formData.methodology}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block">Total Supply</label>
          <input
            type="number"
            name="totalSupply"
            value={formData.totalSupply}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block">Listing Fee (RUSD)</label>
          <input
            type="number"
            name="listingFee"
            value={formData.listingFee}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            step="0.01"
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Create Project
        </button>
      </form>
    </div>
  );
};

export default CreateProjectTab;