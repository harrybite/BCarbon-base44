/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import { ethers, formatUnits } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useMarketplaceInteraction } from '@/components/contract/MarketplaceInteraction';
import { useConnectWallet } from "@/context/walletcontext";
import { useToast } from "../ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apihost } from "../contract/address";
import { useActiveAccount } from "thirdweb/react";

export default function TradeForm() {
  const { purchase, getRUSDBalance } = useMarketplaceInteraction();
  const { walletAddress } = useConnectWallet();
  const [listings, setListings] = React.useState([]);
  const [cardStates, setCardStates] = React.useState({});
  const [update, setUpdate] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [rusdBalance, setRUSDBalance] = React.useState('0');
  
  // Pagination and filtering states
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalListings, setTotalListings] = React.useState(0);
  const [listingsPerPage, setListingsPerPage] = React.useState(12);
  const [hasNextPage, setHasNextPage] = React.useState(false);
  const [hasPrevPage, setHasPrevPage] = React.useState(false);
  
  // Filter states
  const [activeFilter, setActiveFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState('desc');
  
  const account = useActiveAccount();
  const { toast } = useToast();

  // Fetch listings with pagination and filters
  const fetchListings = async (page = 1, limit = 12, active = 'all', sort = 'createdAt', order = 'desc') => {
    setIsLoading(true);
    try {
      const rusdBalance = await getRUSDBalance(walletAddress);
      setRUSDBalance(rusdBalance);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: sort,
        sortOrder: order,
      });
      
      // Only add active filter if it's not 'all'
      if (active !== 'all') {
        params.append('active', active);
      }
      
      const response = await fetch(`${apihost}/user/get-listing-nfts?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setListings(data.listings || []);
        
        // Update pagination state
        if (data.pagination) {
          setCurrentPage(data.pagination.currentPage);
          setTotalPages(data.pagination.totalPages);
          setTotalListings(data.pagination.totalListings);
          setHasNextPage(data.pagination.hasNextPage);
          setHasPrevPage(data.pagination.hasPrevPage);
        }
        
        // Initialize card states
        const initialStates = {};
        data.listings.forEach(listing => {
          initialStates[listing.listingId] = {
            quantity: "",
            isSubmitting: false,
            error: "",
            success: "",
            showInput: false
          };
        });
        setCardStates(initialStates);
      } else {
        throw new Error(data.message || 'Failed to fetch listings');
      }
    } catch (err) {
      console.error("Failed to fetch listings:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch listings: " + (err.message || "Unknown error"),
      });
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (walletAddress) {
      fetchListings(currentPage, listingsPerPage, activeFilter, sortBy, sortOrder);
    }
  }, [walletAddress, update]);

  // Handle filter changes
  const handleFilterChange = (newFilter) => {
    setActiveFilter(newFilter);
    setCurrentPage(1);
    fetchListings(1, listingsPerPage, newFilter, sortBy, sortOrder);
  };

  // Handle sort changes
  const handleSortChange = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
    fetchListings(1, listingsPerPage, activeFilter, field, order);
  };

  // Handle page changes
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchListings(newPage, listingsPerPage, activeFilter, sortBy, sortOrder);
    }
  };

  // Handle limit changes
  const handleLimitChange = (newLimit) => {
    setListingsPerPage(parseInt(newLimit));
    setCurrentPage(1);
    fetchListings(1, parseInt(newLimit), activeFilter, sortBy, sortOrder);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  const handleInputChange = (listingId, value) => {
    setCardStates(prev => ({
      ...prev,
      [listingId]: {
        ...prev[listingId],
        quantity: value,
        error: "",
        success: ""
      }
    }));
  };

  const toggleInput = (listingId) => {
    const listing = listings.find(l => l.listingId === listingId);
    setCardStates(prev => ({
      ...prev,
      [listingId]: {
        ...prev[listingId],
        showInput: !prev[listingId].showInput,
        quantity: listing?.quantity || "",
        error: "",
        success: ""
      }
    }));
  };

  const handlePurchase = async (listingId) => {
    const state = cardStates[listingId];
    if (!state.quantity) {
      setCardStates(prev => ({
        ...prev,
        [listingId]: {
          ...prev[listingId],
          error: "Please specify quantity"
        }
      }));
      return;
    }

    const quantity = parseInt(state.quantity);
    const listing = listings.find(l => l.listingId === listingId);
    if (!listing) {
      setCardStates(prev => ({
        ...prev,
        [listingId]: {
          ...prev[listingId],
          error: "Invalid listing"
        }
      }));
      return;
    }

    if (quantity <= 0 || quantity > listing.quantity) {
      setCardStates(prev => ({
        ...prev,
        [listingId]: {
          ...prev[listingId],
          error: `Quantity must be between 1 and ${listing.quantity}`
        }
      }));
      return;
    }

    if (Number(rusdBalance) < (Number(listing.pricePerUnit) * quantity)) {
      toast({
        title: "Insufficient RUSD Balance",
        description: `You need at least ${Number(listing.pricePerUnit) * quantity} RUSD to purchase this listing.`,
        variant: "destructive",
      });
      return;
    }

    setCardStates(prev => ({
      ...prev,
      [listingId]: {
        ...prev[listingId],
        isSubmitting: true,
        error: "",
        success: ""
      }
    }));

    try {
      console.log("Listing", listing);
      const receipt = await purchase(listingId, quantity, account);
      if (receipt.status === "success") {
        // trade nft in backend
        const nftdata = {
          projectContract: listing.tokenContract,
          tokenId: listing.tokenId,
          amount: quantity,
          buyer: walletAddress,
          owner: listing.seller,
          listingId: listing._id // Ensure this matches the listing ID field
        };
        console.log("NFT Data for trade:", nftdata);
        const data = await fetch(`${apihost}/user/trade-nft`, {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nftdata),
        });
        if (data.ok) {
          console.log("Trade NFT successful:", data);
        }
        setCardStates(prev => ({
          ...prev,
          [listingId]: {
            ...prev[listingId],
            isSubmitting: false,
            success: "Purchase transaction submitted successfully!",
            quantity: "",
            showInput: false
          }
        }));
        toast({
          title: "Purchase Successful",
          description: `Token purchased successfully`,
          variant: "success",
        });
        setUpdate(update + 1);
      }
    } catch (error) {
      console.error("Purchase error:", error);
      setCardStates(prev => ({
        ...prev,
        [listingId]: {
          ...prev[listingId],
          isSubmitting: false,
          error: "Failed to execute purchase"
        }
      }));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ArrowRight className="w-5 h-5 text-green-600" />
          <span>Carbon Credit NFT Marketplace</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Trade carbon credit NFTs (tCO2) from listed projects
        </p>
        
        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          {/* Active Filter */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="active-filter">Status:</Label>
            <Select value={activeFilter} onValueChange={handleFilterChange}>
              <SelectTrigger id="active-filter" className="w-[140px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Listings</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Sold Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="sort-filter">Sort by:</Label>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              handleSortChange(field, order);
            }}>
              <SelectTrigger id="sort-filter" className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="pricePerUnit-asc">Price: Low to High</SelectItem>
                <SelectItem value="pricePerUnit-desc">Price: High to Low</SelectItem>
                <SelectItem value="quantity-desc">Quantity: High to Low</SelectItem>
                <SelectItem value="quantity-asc">Quantity: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Per Page */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="per-page">Per page:</Label>
            <Select value={listingsPerPage.toString()} onValueChange={handleLimitChange}>
              <SelectTrigger id="per-page" className="w-[100px]">
                <SelectValue placeholder="Per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="48">48</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Results Info */}
        <div className="text-sm text-gray-600 mt-2">
          {isLoading ? (
            "Loading listings..."
          ) : (
            `Showing ${((currentPage - 1) * listingsPerPage) + 1} to ${Math.min(currentPage * listingsPerPage, totalListings)} of ${totalListings} listings`
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            Array(listingsPerPage).fill(0).map((_, index) => (
              <Card key={index} className="flex flex-col animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                  <div className="mt-4 h-10 bg-gray-200 rounded w-full"></div>
                </CardContent>
              </Card>
            ))
          ) : listings.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Listings Found</h3>
              <p className="text-gray-600">
                {activeFilter === 'true' 
                  ? "No active listings available at the moment."
                  : activeFilter === 'false'
                  ? "No sold out listings found."
                  : "No listings available at the moment."
                }
              </p>
            </div>
          ) : (
            listings.map((listing) => (
              <Card key={listing.listingId} className="flex flex-col">
                <CardHeader>
                  <div className="w-full bg-black flex items-center justify-center" style={{ height: "auto" }}>
                    <img
                      src={listing.image}
                      alt={listing.metadata || "NFT"}
                      className="object-contain h-full w-full"
                    />
                  </div>
                  <Link to={`/ProjectDetails/${listing.tokenContract}`}>
                    <CardTitle className="text-lg">
                      {`${listing.tokenContract.slice(0, 6)}...${listing.tokenContract.slice(-4)}`}
                    </CardTitle>
                  </Link>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="space-y-2">
                    <p><strong>Token ID:</strong> {listing.tokenId}</p>
                    <p><strong>Quantity (tCO2):</strong> {listing.quantity}</p>
                    <p><strong>Price per Unit (RUSD):</strong> {listing.pricePerUnit}</p>
                    <p><strong>Total Price (RUSD):</strong> {listing.pricePerUnit}</p>
                    <p><strong>Status:</strong> {listing.active ? "Active" : "Sold Out"}</p>
                  </div>
                  {cardStates[listing.listingId]?.error && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{cardStates[listing.listingId].error}</AlertDescription>
                    </Alert>
                  )}
                  {cardStates[listing.listingId]?.success && (
                    <Alert className="mt-4 border-green-200 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">{cardStates[listing.listingId].success}</AlertDescription>
                    </Alert>
                  )}
                  {listing.active ? (
                    cardStates[listing.listingId]?.showInput ? (
                      <div className="mt-4 space-y-2">
                        <Label htmlFor={`quantity-${listing.listingId}`}>Quantity to Purchase</Label>
                        <Input
                          id={`quantity-${listing.listingId}`}
                          type="number"
                          step="1"
                          min="1"
                          className="appearance-none"
                          placeholder="Enter quantity"
                          value={cardStates[listing.listingId].quantity}
                          onChange={(e) => handleInputChange(listing.listingId, e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          Your RUSD Balance: {rusdBalance}
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => handlePurchase(listing.listingId)}
                            disabled={cardStates[listing.listingId].isSubmitting}
                          >
                            {cardStates[listing.listingId].isSubmitting ? (
                              <>
                                <div className="animate-pulse rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Confirm Purchase
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => toggleInput(listing.listingId)}
                            disabled={cardStates[listing.listingId].isSubmitting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        className="mt-4 w-full bg-green-600 hover:bg-green-700"
                        onClick={() => toggleInput(listing.listingId)}
                        disabled={cardStates[listing.listingId]?.isSubmitting || listing.seller.toLowerCase() === walletAddress.toLowerCase()}
                      >
                        Buy Credits
                      </Button>
                    )
                  ) : (
                    <Button
                      className="mt-4 w-full bg-gray-400 cursor-not-allowed"
                      disabled
                    >
                      Sold Out
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} • Total: {totalListings} listings
            </div>
            
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
        )}
      </CardContent>
    </Card>
  );
}