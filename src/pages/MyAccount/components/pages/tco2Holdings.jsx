/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useContractInteraction } from '@/components/contract/ContractInteraction';
import { useNavigate } from "react-router-dom";
import { useConnectWallet } from '@/context/walletcontext';
import { Link } from "react-router-dom";
import { useMarketplaceInteraction } from '@/components/contract/MarketplaceInteraction';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Wallet, 
  TrendingUp,
  Package,
  DollarSign,
  Eye,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Coins,
  Recycle,
  TreePine,
  Info,
  Calendar,
  MapPin,
  FileText
} from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import { apihost } from '@/components/contract/address';
import { set } from 'date-fns';

const MyHoldings = () => {
  const {
    getUserApproveProjectBalance,
    isApproveForAll,
    setApprovalForAll
  } = useContractInteraction();
  
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
  const account = useActiveAccount();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNFTs, setTotalNFTs] = useState(0);
  const [nftsPerPage, setNftsPerPage] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Helper function to truncate text
  const truncateText = (text, maxLength = 80) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Helper function to check if text needs tooltip
  const needsTooltip = (text, maxLength = 80) => {
    return text && text.length > maxLength;
  };

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
              variant: "default",
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
        };
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
          variant: "default",
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
    setCurrentPage(1);
  };

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
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await getUserApproveProjectBalance(walletAddress, currentPage, nftsPerPage);
        setProjects(Array.isArray(result.nfts) ? result.nfts : []);

        // set the same project four time in setProjects for testing
        // setProjects(prev => [...prev, ...prev, ...prev, ...prev]);

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
    <TooltipProvider>
      <div >
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
        
            {/* Wallet Connection Check */}
            {!walletAddress && (
                <div className="mb-8">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-900">Wallet Not Connected</h3>
                      <p className="text-red-700">Please connect your wallet to view and manage your carbon credit NFTs.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
                 </div>
            )}
       

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Your Portfolio</h3>
                <p className="text-gray-600">Fetching your carbon credit NFTs...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && projects.length === 0 && walletAddress && (
            <Card className="border-gray-200">
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TreePine className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No Carbon Credits Found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    You don't have any carbon credit NFTs yet. Start by purchasing credits from approved projects.
                  </p>
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link to="/projects">
                      <Plus className="w-4 h-4 mr-2" />
                      Browse Projects
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* NFT Grid - Optimized Card Layout */}
          {!loading && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {projects.map((project, i) => (
                <Card key={i} className="group hover:shadow-xl transition-all min-w-[350px] duration-300 border-0 shadow-md hover:scale-[1.02] overflow-hidden bg-white h-fit">
                  {/* NFT Image - Fixed aspect ratio */}
                  <div className="relative aspect-[4/3]">
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center overflow-hidden">
                      <img
                        src={project.metadata?.image || '/placeholder-image.png'}
                        alt={project.metadata?.name || "Carbon Credit NFT"}
                        className="w-[200] h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.png';
                        }}
                      />
                    </div>
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {project.tokenId === 1 ? (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg text-xs">
                          <Coins className="w-3 h-3 mr-1" />
                          Active ({Number(project.balanceMinted).toLocaleString()} tCO₂ )
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg text-xs">
                          <Recycle className="w-3 h-3 mr-1" />
                          Retired ({Number(project.balanceRetired).toLocaleString()} tCO₂ )
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Project Title */}
                    <div>
                      <h3 className="font-bold text-base text-gray-900 line-clamp-2 leading-tight mb-1">
                        {project.metadata?.name || project.projectID || "Unnamed Project"}
                      </h3>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span>ID: {project.certificateId || "Pending"}</span>
                        <span>•</span>
                        <span>Token: {project.tokenId || "N/A"}</span>
                      </div>
                    </div>

                    {/* Location */}
                    {project.metadata?.location && (
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{project.metadata.location}</span>
                      </div>
                    )}

                    {/* Description with Tooltip */}
                    {project.metadata?.description && (
                      <div>
                        {needsTooltip(project.metadata.description) ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                                  {truncateText(project.metadata.description)}
                                </p>
                                <div className="flex items-center text-xs text-blue-600 mt-1 hover:text-blue-700">
                                  <Info className="w-3 h-3 mr-1" />
                                  <span>Read more</span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent 
                              className="max-w-sm p-3 bg-gray-900 text-white rounded-lg shadow-lg"
                              side="bottom"
                            >
                              <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Project Description</h4>
                                <p className="text-xs leading-relaxed">{project.metadata.description}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                            {project.metadata.description}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Balance Cards - Compact Version */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* {project.balanceMinted && (
                        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-2">
                          <div className="text-center">
                            <div className="text-xs text-green-600 mb-1">Available</div>
                            <div className="text-sm font-bold text-green-800">
                              {Number(project.balanceMinted).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )} */}
                      
                      {/* {project.balanceRetired && (
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-2">
                          <div className="text-center">
                            <div className="text-xs text-orange-600 mb-1">Retired</div>
                            <div className="text-sm font-bold text-orange-800">
                              {Number(project.balanceRetired).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )} */}
                    </div>

                    {/* Project Attributes - Compact */}
                    {project.metadata?.attributes && project.metadata.attributes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.metadata.attributes.slice(0, 2).map((attr, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="text-xs bg-gray-50 text-gray-700 border-gray-200 px-1 py-0"
                          >
                            {attr.trait_type}: {attr.value}
                          </Badge>
                        ))}
                        {project.metadata.attributes.length > 2 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 cursor-help px-1 py-0">
                                +{project.metadata.attributes.length - 2}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1">
                                {project.metadata.attributes.slice(2).map((attr, index) => (
                                  <div key={index} className="text-xs">
                                    <span className="font-medium">{attr.trait_type}:</span> {attr.value}
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    )}

                    {/* Action Buttons - Compact */}
                    <div className="space-y-2 pt-2">
                      <Button asChild variant="outline" size="sm" className="w-full h-8 text-xs">
                        <Link to={`/ProjectDetails/${project.projectContract}`}>
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Link>
                      </Button>
                      
                      {project.balanceMinted && Number(project.balanceMinted) > 0 && (
                        <Button
                          onClick={() => {
                            setSelectedProject(project);
                            setShowModal(true);
                          }}
                          size="sm"
                          className="w-full h-8 text-xs bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Create Listing
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages} • {totalNFTs} total NFTs
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!hasPrevPage}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center space-x-1">
                      {currentPage > 3 && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handlePageChange(1)}>
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
                          <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages)}>
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!hasNextPage}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Enhanced Listing Modal */}
        {showModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Create Listing</h3>
                    <p className="text-sm text-gray-600">{selectedProject.metadata?.name || selectedProject.projectID}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowModal(false);
                    setIsReadyToList(false);
                    setIsApproving(false);
                    setQuantity('');
                    setPrice('');
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Project Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Available Balance</span>
                    <span className="text-lg font-bold text-green-600">
                      {Number(selectedProject.balanceMinted).toLocaleString()} tCO₂
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Certificate ID</span>
                    <span className="text-sm text-gray-600">{selectedProject.certificateId || "Pending"}</span>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                      Quantity (tCO₂) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Enter quantity to list"
                      min="1"
                      max={selectedProject.balanceMinted}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: {Number(selectedProject.balanceMinted).toLocaleString()} tCO₂
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                      Price per Unit (RUSD) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Enter price per unit"
                      min="0"
                      step="0.01"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Total Calculation */}
                {quantity && price && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">Total Listing Value</span>
                      <span className="text-lg font-bold text-blue-800">
                        {(Number(quantity) * Number(price)).toLocaleString()} RUSD
                      </span>
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {isApproving && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 animate-spin text-yellow-600 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">Setting Approval</h4>
                        <p className="text-sm text-yellow-700">Approving marketplace contract...</p>
                      </div>
                    </div>
                  </div>
                )}

                {isReadyToList && !isListing && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-green-800">Ready to List</h4>
                        <p className="text-sm text-green-700">{"Approval successful! Click 'List Now' to create your listing."}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setIsReadyToList(false);
                    setIsApproving(false);
                    setQuantity('');
                    setPrice('');
                  }}
                  disabled={isApproving || isListing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={list}
                  disabled={isApproving || isListing || !quantity || !price}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Approving...
                    </>
                  ) : isListing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating Listing...
                    </>
                  ) : isReadyToList ? (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      List Now
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Submit for Approval
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

MyHoldings.propTypes = {};

export default MyHoldings;