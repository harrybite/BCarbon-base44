/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import { useNavigate } from "react-router-dom";
import { useConnectWallet } from '@/context/walletcontext';
import { Link } from "react-router-dom";
import { useMarketplaceInteraction } from '../contract/MarketplaceInteraction';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import { apihost } from '../contract/address';

const BuyerTab = () => {
  const {
    getUserApproveProjectBalance,
    isApproveForAll,
    setApprovalForAll
  } =
    useContractInteraction();
  const { createListing } = useMarketplaceInteraction();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [update, setUpdate] = useState(0);
  const { walletAddress } = useConnectWallet();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isReadyToList, setIsReadyToList] = useState(false);
  const account = useActiveAccount()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNFTs, setTotalNFTs] = useState(0);
  const [nftsPerPage, setNftsPerPage] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Listing function
  const list = async () => {
    if (!selectedProject || !quantity || !price) {
      toast({
        title: "Missing Fields",
        description: "Please fill all fields (quantity and price).",
        variant: "destructive",
      });
      return;
    }

    if (!isReadyToList) {
      // Step 1: Approval
      try {
        if (Number(selectedProject.balanceMinted) < Number(quantity)) {
          toast({
            title: "Insufficient Balance",
            description: `You only have ${selectedProject.balanceMinted} tCO2 available for listing.`,
            variant: "destructive",
          });
          setIsApproving(false);
          return;
        }

        const tokenContract = selectedProject.projectContract;
        const approved = await isApproveForAll(tokenContract, walletAddress);
        if (!approved) {
          setIsApproving(true);
          const recipt = await setApprovalForAll(tokenContract, account);
          if (recipt.status === "success") {
              toast({
            title: "Approval Set",
            description: "Approval for all set successfully, you can now list your NFTs.",
            variant: "success",
          });
          }
        }
        setIsReadyToList(true);
      } catch (error) {
        toast({
          title: "Approval Failed",
          description: error.message || "An error occurred during approval.",
          variant: "destructive",
        });
      } finally {
        setIsApproving(false);
      }
      return;
    }

    // Step 2: Listing
    setIsListing(true);
    try {
      const tokenContract = selectedProject.projectContract;
      const tokenId = 1;
      const recipt = await createListing(tokenContract, tokenId, quantity, price, account);
      if (recipt.status === "success") {
        const listingData = {
          hash: recipt.transactionHash
        }
        const response = await fetch(`${apihost}/user/list-nft`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(listingData),
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Listing created successfully:', data);
        } 
        toast({
          title: "Listing Created",
          description: "Your listing has been created successfully.",
          variant: "success",
        });
        setShowModal(false);
        setQuantity('');
        setPrice('');
        setSelectedProject(null);
        setUpdate(update + 1);
        setIsReadyToList(false);
        navigate("/Trade");
      } else {
        throw new Error("Failed to create listing");
      }
      
    } catch (error) {
      toast({
        title: "Listing Creation Failed",
        description: error.message || "An error occurred while creating the listing.",
        variant: "destructive",
      });
    } finally {
      setIsListing(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLimitChange = (newLimit) => {
    setNftsPerPage(parseInt(newLimit));
    setCurrentPage(1); // Reset to first page when changing limit
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!walletAddress) {
        console.log('Skipping fetch: walletAddress not initialized', { walletAddress });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await getUserApproveProjectBalance(walletAddress, currentPage, nftsPerPage);
        console.log('User NFTs result:', result);

        setProjects(Array.isArray(result.nfts) ? result.nfts : []);

        // Update pagination state
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages);
          setTotalNFTs(result.pagination.totalNFTs);
          setHasNextPage(result.pagination.hasNextPage);
          setHasPrevPage(result.pagination.hasPrevPage);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Failed to Fetch Projects",
          description: error.message || "An error occurred while fetching your projects.",
          variant: "destructive",
        });
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProjects();
  }, [walletAddress, update, currentPage, nftsPerPage]);

  return (
    <div className="p-4">
      {/* Header with pagination info */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Buyer Dashboard</h2>
        <p className="text-gray-600">
          Manage your carbon credit NFTs ({totalNFTs} total NFTs)
        </p>
      </div>

      {!walletAddress && (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Please connect your wallet to view projects.</p>
        </div>
      )}

      {/* Projects per page selector */}
      {walletAddress && (
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {loading ? (
                "Loading NFTs..."
              ) : (
                `Showing ${((currentPage - 1) * nftsPerPage) + 1} to ${Math.min(currentPage * nftsPerPage, totalNFTs)} of ${totalNFTs} NFTs`
              )}
            </div>
            <Select value={nftsPerPage.toString()} onValueChange={handleLimitChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading your NFTs...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💳</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No NFTs Found</h3>
          <p className="text-gray-600">{"You don't have any carbon credit NFTs yet."}</p>
        </div>
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
                  src={project.metadata?.image || '/placeholder-image.png'}
                  alt={project.metadata?.name || "NFT"}
                  className="object-contain h-full w-full"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.png';
                  }}
                />
              </div>

              {/* Card Content */}
              <div className="w-full p-6 flex flex-col gap-2">
                {/* Name */}
                <div className="font-bold text-xl text-white mb-1">
                  {project.metadata?.name || "No Name"}
                </div>
                {/* Description */}
                <div className="text-blue-100 text-sm mb-4">
                  {project.metadata?.description || "No description"}
                </div>
                {/* Badges */}
                <div className="flex flex-col gap-2 mt-2 mb-4">
                  {project.balanceMinted && (
                    <span className="flex items-center bg-green-100 text-green-800 text-sm font-semibold px-4 py-2 rounded-full w-full text-center justify-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 20l9-5-9-5-9 5 9 5z" />
                        <path d="M12 12V4" />
                      </svg>
                      Balance: {project.balanceMinted || 0} tCO<sub>2</sub>
                    </span>
                  )}
                  {project.balanceRetired && (
                    <span className="flex items-center bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-2 rounded-full w-full text-center justify-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M4 4v16h16V4H4zm2 2h12v12H6V6zm2 2v8h8V8H8z" />
                      </svg>
                      Retired: {project.balanceRetired || 0} tCO<sub>2</sub>
                    </span>
                  )}
                </div>
                {/* Details Button */}
                <Link to={`/ProjectDetails/${project.projectContract}`}>
                  <button className="w-full mt-2 bg-white text-blue-800 font-semibold py-2 rounded-lg shadow hover:bg-blue-100 transition">
                    View Project Details
                  </button>
                </Link>
                {project.balanceMinted && (
                  <button
                    onClick={() => {
                      setSelectedProject(project);
                      setShowModal(true);
                    }}
                    className="w-full mt-2 bg-green-500 text-white font-semibold py-2 rounded-lg shadow hover:bg-green-600 transition"
                  >
                    Create Listing
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Pagination Info */}
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * nftsPerPage) + 1} to{' '}
              {Math.min(currentPage * nftsPerPage, totalNFTs)} of{' '}
              {totalNFTs} NFTs
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-2">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrevPage}
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {currentPage > 3 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                    >
                      1
                    </Button>
                    {currentPage > 4 && <span className="px-2 text-gray-400">...</span>}
                  </>
                )}

                {getPageNumbers().map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                    className={currentPage === pageNumber ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {pageNumber}
                  </Button>
                ))}

                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className="px-2 text-gray-400">...</span>}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage}
                className="flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
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
                className="w-full border px-3 py-2 rounded mt-1 appearance-none"
                min="1"
              />
            </label>
            <label className="block mb-4">
              Price per Unit
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border px-3 py-2 rounded mt-1 appearance-none"
                min="0"
                step="0.01"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setIsReadyToList(false);
                  setIsApproving(false);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={list}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={isApproving || isListing}
              >
                {isApproving
                  ? "Approving..."
                  : isReadyToList
                    ? (isListing ? "Listing..." : "List Now")
                    : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerTab;