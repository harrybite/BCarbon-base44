/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState } from 'react';
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useContractInteraction } from '../contract/ContractInteraction';
import { methodology } from '../contract/address';
import { useToast } from '../ui/use-toast';

const CreateProjectTab = ({setUpdate}) => {
  const { userAddress, createAndListProject } = useContractInteraction();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    mintPrice: '',
    treasury: '',
    defaultIsPermanent: false,
    defaultValidity: '',
    defaultVintage: new Date(),
    methodologyIndex: '',
    location: '',
    emissionReductions: '',
    projectDetails: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'defaultIsPermanent') {
      setFormData({
        ...formData,
        [name]: checked,
        defaultValidity: checked ? '100' : formData.defaultValidity
      });
    } else {
      setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    }
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

    console.log(defaultIsPermanent, defaultValidity);
    if ((defaultIsPermanent && defaultValidity !== '0') || (!defaultIsPermanent && defaultValidity === '0')) {
      return alert('Invalid validity: must be 0 if permanent, non-zero otherwise');
    }
    if (
      !defaultIsPermanent &&
      (isNaN(defaultValidity) ||
        defaultValidity <= 0 ||
        defaultValidity > 100)
    ) {
      return alert('Validity must be a number between 1 and 100 years if not permanent');
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

    if (parseInt(methodology.length) <= parseInt(methodologyIndex) || parseInt(methodologyIndex) < 0) {
      return alert('Invalid methodology index (must be 0-31)');
    }

    // Convert vintage to timestamp (seconds)
  const vintageTimestamp = formData.defaultVintage
    ? Math.floor(new Date(formData.defaultVintage).getTime() / 1000)
    : "";
  

    // Prepare the data to send to the contract
    const preparedData = {
      ...formData,
       defaultVintage: vintageTimestamp,
    };

    try {
      console.log("formdata", preparedData)
      const tx = await createAndListProject(preparedData);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        // alert(`Project created successfully! Transaction: ${tx.hash}`);
        setUpdate(4);
        toast({
          title: "Project Created",
          description: `Project created successfully`,
          variant: "success",
        });
      } else {
        // alert(`Transaction failed!`);
        toast({
          title: "Transaction Failed",
          description: "The transaction was not successful.",
          variant: "destructive",
        });
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

          {<button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                defaultIsPermanent: !prev.defaultIsPermanent,
                defaultValidity: !prev.defaultIsPermanent ? '0' : prev.defaultValidity,
              }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.defaultIsPermanent ? 'bg-blue-600' : 'bg-gray-300'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.defaultIsPermanent ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
          }
          <label className="block ml-4">Is Validity Permanent?</label>
       
        </div>
        <div>
          <label className="block">Default Validity (in years)</label>
         {!formData.defaultIsPermanent ? <input
            type="text"
            name="defaultValidity"
            value={formData.defaultValidity}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            disabled={formData.defaultIsPermanent}
            required={!formData.defaultIsPermanent}
          /> : 
          <input
            type="text"
            name="defaultValidity"
            value={'100+ years'}
            disabled={formData.defaultIsPermanent}
             className="w-full border rounded px-2 py-1"
          />
          }
          {formData.defaultIsPermanent && (
            <p className="text-sm text-gray-500 mt-1">Disabled because validity is set to permanent.</p>
          )}
        </div>
      <div className="relative">
        <label className="block">Vintage</label>
        <ReactDatePicker
          selected={formData.defaultVintage}
          onChange={(date) =>
            setFormData((prev) => ({ ...prev, defaultVintage: date }))
          }
          showTimeSelect
          dateFormat="Pp"
          className="w-full border rounded px-2 py-1"
          wrapperClassName="w-full"
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
          <label className="block">Methodology</label>
          <select
            name="methodologyIndex"
            value={formData.methodologyIndex}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          >
            <option value="">Select Methodology</option>
            {methodology.map((method, index) => (
              <option key={index} value={index}>
                {method}
              </option>
            ))}
          </select>
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
          <label className="block">Emission Reduction goal in tCO<sub>2</sub></label>
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
          <input
            name="projectDetails"
            value={formData.projectDetails}
            placeholder='Upload all the project-related files to a public GitHub repository and paste the link here.'
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