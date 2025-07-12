/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState } from 'react';
import {useContractInteraction} from '../contract/ContractInteraction';
import { RUSD } from '../contract/address';

const CreateProjectTab = () => {
  const { userAddress, createAndListProject } = useContractInteraction();
  const [formData, setFormData] = useState({
    mintPrice: '',
    treasury: '',
    defaultIsPermanent: false,
    defaultValidity: '',
    defaultVintage: '',
    methodologyIndex: '',
    location: '',
    emissionReductions: '',
    projectDetails: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation logic based on smart contract
    const {
      mintPrice,
      treasury,
      defaultIsPermanent,
      defaultValidity,
      defaultVintage,
      methodologyIndex,
      emissionReductions,
      projectDetails,
    } = formData;

    if (!treasury || treasury === '0x0000000000000000000000000000000000000000') {
      return alert('Invalid treasury address');
    }

    if ((defaultIsPermanent && defaultValidity !== '0') || (!defaultIsPermanent && defaultValidity === '0')) {
      return alert('Invalid validity: must be 0 if permanent, non-zero otherwise');
    }


    if (
      !emissionReductions ||
      isNaN(emissionReductions) ||
      emissionReductions <= 0 ||
      emissionReductions > 1000000000
    ) {
      return alert('Invalid emission reductions');
    }

    if (!projectDetails || projectDetails.trim().length === 0) {
      return alert('Empty project details');
    }

    if (methodologyIndex === '' || parseInt(methodologyIndex) > 31) {
      return alert('Invalid methodology index (must be 0-31)');
    }

    try {
      console.log("formdata", formData)
      const tx = await createAndListProject(formData);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert(`Project created successfully! Transaction: ${tx.hash}`);
      } else {
        alert(`Transaction failed!`);
      }
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
          <label className="block">Mint Price</label>
          <input
            type="text"
            name="mintPrice"
            value={formData.mintPrice}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block">Treasury Address</label>
          <input
            type="text"
            name="treasury"
            value={formData.treasury}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="defaultIsPermanent"
            checked={formData.defaultIsPermanent}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="block">Default Is Permanent</label>
        </div>
        <div>
          <label className="block">Default Validity</label>
          <input
            type="text"
            name="defaultValidity"
            value={formData.defaultValidity}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block">Default Vintage</label>
          <input
            type="text"
            name="defaultVintage"
            value={formData.defaultVintage}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        {/* <div>
          <label className="block">RUSD</label>
          <input
            type="text"
            name="RUSD"
            value={RUSD}
            disabled
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div> */}
        <div>
          <label className="block">Methodology Index</label>
          <input
            type="number"
            name="methodologyIndex"
            value={formData.methodologyIndex}
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
          <label className="block">Emission Reductions</label>
          <input
            type="text"
            name="emissionReductions"
            value={formData.emissionReductions}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block">Project Details</label>
          <textarea
            name="projectDetails"
            value={formData.projectDetails}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        {/* <div>
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
        </div> */}
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Create Project
        </button>
      </form>
    </div>
  );
};

export default CreateProjectTab;