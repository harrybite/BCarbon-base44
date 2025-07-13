/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import ProjectCard from '../projects/ProjectCard';
import { set } from 'date-fns';
import { useConnectWallet } from '@/context/walletcontext';
import { Link } from "react-router-dom";
import { useMarketplaceInteraction } from '../contract/MarketplaceInteraction';
import { number } from 'zod';
import { useToast } from '../ui/use-toast';

const BuyerTab = () => {
  const { isContractsInitised,
    getUserApproveProjectBalance,
    isApproveForAll,
    setApprovalForAll,
  } = useContractInteraction();

  const { createListing }  = useMarketplaceInteraction()
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [update, setUpdate] = useState(0);
  const { walletAddress } = useConnectWallet();
  const { toast } = useToast()

  const [selectedProject, setSelectedProject] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isListing, setIsListing] = useState(false);

  // listing function
  const list = async () => {
    if (!selectedProject || !quantity || !price) return alert('Fill all fields');
    setIsListing(true);
    try {
      if (Number(selectedProject.balanceMinted) < Number(quantity)) {
        toast({
          title: "Insufficient Balance",
          description: `You only have ${selectedProject.balanceMinted} tCO2 available for listing.`,
          variant: "destructive",
        });
        return 
      }

      const tokenContract = selectedProject.projectContract;
      const tokenId = 1;

      const approved = await isApproveForAll(tokenContract, walletAddress);
      console.log('Is approved for all:', approved);
      if (!approved) {
        await setApprovalForAll(tokenContract);
      }

      await createListing(tokenContract, tokenId, quantity, price);
      toast({
        title: "Listing Created",
        description: `Successfully created listing`,
        variant: "success",
      });
      setShowModal(false);
      setQuantity('');
      setPrice('');
      setSelectedProject(null);
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({
        title: "Listing Creation Failed",
        description: "An error occurred while creating the listing.",
        variant: "destructive",
      });
    } finally {
      setIsListing(false);
    }
  };

  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!walletAddress) return;
      setLoading(true);
      try {
        const usernftsproject = await getUserApproveProjectBalance();
        console.log('User usernftsproject:', usernftsproject);
        setProjects(usernftsproject);
        // const balance = await getRUSDBalance();
        // setRUSDBalance(balance);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
      setLoading(false);
    };
    if (walletAddress && isContractsInitised) {
      fetchUserProjects();
    }
  }, [walletAddress, update, isContractsInitised]);


  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Buyer Dashboard</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 rounded-2xl shadow-xl flex flex-col items-center border border-blue-600 hover:scale-105 transition-transform duration-200 cursor-pointer overflow-hidden mx-auto w-full max-w-xs"
            >
              {/* NFT Image */}
              <div className="w-full bg-black flex items-center justify-center" style={{ height: "220px" }}>
                <img
                  src={project.metadata?.image}
                  alt={project.metadata?.name || "NFT"}
                  className="object-contain h-full w-full"
                />
              </div>

              {/* Card Content */}
              <div className="w-full p-6 flex flex-col gap-2">
                {/* Name */}
                <div className="font-bold text-xl text-white mb-1">
                  {project.metadata?.name || "No Name"}
                </div>
                {/* ID */}
                {/* <div className="text-blue-200 text-sm mb-2">
                  {project.projectId || "N/A"}
                </div> */}
                {/* Description */}
                <div className="text-blue-100 text-sm mb-4">
                  {project.metadata?.description || "No description"}
                </div>
                {/* Badges */}
                <div className="flex justify-between items-center mt-2 mb-4">
                  {/* Available */}
                  {project.balanceMinted && <span className="flex items-center bg-green-100 text-green-800 text-sm font-semibold px-4 py-2 rounded-full w-full text-center justify-center">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20l9-5-9-5-9 5 9 5z" /><path d="M12 12V4" /></svg>
                    Balance: {project.balanceMinted || 0} tCO<sub>2</sub> 
                  </span>}
                  {/* Retired */}
                 {project.balanceRetired && <span className="flex items-center bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-2 rounded-full w-full text-center justify-center">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v16h16V4H4zm2 2h12v12H6V6zm2 2v8h8V8H8z" /></svg>
                    Retired: {project.balanceRetired || 0} tCO<sub>2</sub> 
                  </span>}
                </div>
                {/* Details Button */}
                <Link to={`/ProjectDetails/${project.projectContract}`}>
                  <button className="w-full mt-2 bg-white text-blue-800 font-semibold py-2 rounded-lg shadow hover:bg-blue-100 transition">
                    View Project Details
                  </button>
                </Link>
              { project.balanceMinted && <button
                  onClick={() => {
                    setSelectedProject(project);
                    setShowModal(true);
                  }}
                  className="w-full mt-2 bg-green-500 text-white font-semibold py-2 rounded-lg shadow hover:bg-green-600 transition"
                >
                  Create Listing
                </button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Create Listing</h3>
            <label className="block mb-2">
              Quantity
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border px-3 py-2 rounded mt-1"
              />
            </label>
            <label className="block mb-4">
              Price per Unit
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border px-3 py-2 rounded mt-1"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={list}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={isListing}
              >
                {isListing ? "Listing..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerTab;