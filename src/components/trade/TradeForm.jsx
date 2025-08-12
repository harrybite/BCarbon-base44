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
import { 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  Package,
  Filter,
  SortAsc,
  SortDesc,
  Search,
  Eye,
  ShoppingCart,
  Wallet,
  Timer,
  Award,
  Trash2,
  RefreshCw,
  Star
} from "lucide-react";
import { useMarketplaceInteraction } from '@/components/contract/MarketplaceInteraction';
import { useConnectWallet } from "@/context/walletcontext";
import { useToast } from "../ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apihost } from "../contract/address";
import { useActiveAccount } from "thirdweb/react";

export default function TradeForm() {
  const { 
    purchase,
    getRUSDBalance,  
    listingCounter,
    totalVolumeTransacted,
    totalCreditsSold, 
    cancelListing,
  } = useMarketplaceInteraction();
  
  const { walletAddress } = useConnectWallet();
  const [listings, setListings] = React.useState([]);
  const [cardStates, setCardStates] = React.useState({});
  const [update, setUpdate] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [rusdBalance, setRUSDBalance] = React.useState('0');
  
  // Marketplace statistics states
  const [marketStats, setMarketStats] = React.useState({
    totalListings: '0',
    totalVolume: '0',
    totalCredits: '0',
    isLoading: true
  });
  
  // Pagination and filtering states
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalListings, setTotalListings] = React.useState(0);
  const [listingsPerPage, setListingsPerPage] = React.useState(12);
  const [hasNextPage, setHasNextPage] = React.useState(false);
  const [hasPrevPage, setHasPrevPage] = React.useState(false);
  
  // Filter states
  const [activeFilter, setActiveFilter] = React.useState('true');
  const [sortBy, setSortBy] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState('desc');
  
  const account = useActiveAccount();
  const { toast } = useToast();

  // Fetch marketplace statistics
  const fetchMarketStats = async () => {
    try {
      setMarketStats(prev => ({ ...prev, isLoading: true }));
      
      const [totalListingsCount, totalVolumeResult, totalCreditsResult] = await Promise.all([
        listingCounter(),
        totalVolumeTransacted(),
        totalCreditsSold()
      ]);
      
      setMarketStats({
        totalListings: totalListingsCount || '0',
        totalVolume: totalVolumeResult || '0',
        totalCredits: totalCreditsResult || '0',
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch market stats:', error);
      setMarketStats(prev => ({ ...prev, isLoading: false }));
    }
  };

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
      fetchMarketStats();
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
        // Refresh market stats after successful purchase
        fetchMarketStats();
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

  // Format large numbers
  const formatNumber = (num) => {
    const number = Number(num);
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
    }
    if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K';
    }
    return number.toLocaleString();
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const cancelListingNFTs = async (listingId, _id) => {  
    try {

      const receipt = await cancelListing(listingId, account);

      if (receipt.status === "success") {
        const data = fetch(`${apihost}/user/cancel-listing/${_id}`, { 
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        }); 
        if (data.ok) {
          console.log("Listing cancelled successfully:", data);
        }
        setCardStates(prev => ({
          ...prev,
          [listingId]: {
            ...prev[listingId],
            success: "Listing cancelled successfully!",
            showInput: false
          }
        }));
        toast({
          title: "Listing Cancelled",
          description: `Listing cancelled successfully`,
          variant: "success",
        });
        setUpdate(update + 1);
        // Refresh market stats after successful cancellation
        fetchMarketStats();
      }
    } catch (error) {
      console.error("Failed to cancel listing:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel listing: " + (error.message || "Unknown error"),
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Section */}
        {/* <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mb-6">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Carbon Credit Marketplace
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Trade verified carbon credit NFTs (tCO₂) from sustainable projects worldwide. 
            Make an impact while building your portfolio.
          </p>
        </div> */}

        {/* User Balance Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">Your Balance</p>
                  <p className="text-3xl font-bold">{Number(rusdBalance).toLocaleString()} RUSD</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => {
                  if (walletAddress) {
                    fetchListings(currentPage, listingsPerPage, activeFilter, sortBy, sortOrder);
                    fetchMarketStats();
                  }
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Marketplace Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Listings */}
          <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Total Listings</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {marketStats.isLoading ? (
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      formatNumber(marketStats.totalListings)
                    )}
                  </p>
                  <p className="text-xs text-gray-500">All time listings created</p>
                </div>
                <div className="w-2 h-16 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
              </div>
            </CardContent>
          </Card>

          {/* Total Volume */}
          <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Total Volume</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {marketStats.isLoading ? (
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      `${formatNumber(marketStats.totalVolume)}`
                    )}
                  </p>
                  <p className="text-xs text-gray-500">RUSD transacted</p>
                </div>
                <div className="w-2 h-16 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
              </div>
            </CardContent>
          </Card>

          {/* Total Credits Sold */}
          <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Award className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Credits Sold</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {marketStats.isLoading ? (
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      `${formatNumber(marketStats.totalCredits)}`
                    )}
                  </p>
                  <p className="text-xs text-gray-500">tCO₂ traded</p>
                </div>
                <div className="w-2 h-16 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters and Controls */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Filter className="w-5 h-5 text-gray-600" />
                <CardTitle className="text-xl">Filter & Sort Listings</CardTitle>
              </div>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {isLoading ? "Loading..." : `${totalListings} total listings`}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <Select value={activeFilter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span>All Listings</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="true">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Active</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="false">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>Sold Out</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Sort By */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Sort By</Label>
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  handleSortChange(field, order);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">
                      <div className="flex items-center space-x-2">
                        <Timer className="w-3 h-3" />
                        <span>Newest First</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="createdAt-asc">
                      <div className="flex items-center space-x-2">
                        <Timer className="w-3 h-3" />
                        <span>Oldest First</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pricePerUnit-asc">
                      <div className="flex items-center space-x-2">
                        <SortAsc className="w-3 h-3" />
                        <span>Price: Low to High</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pricePerUnit-desc">
                      <div className="flex items-center space-x-2">
                        <SortDesc className="w-3 h-3" />
                        <span>Price: High to Low</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="quantity-desc">
                      <div className="flex items-center space-x-2">
                        <Package className="w-3 h-3" />
                        <span>Quantity: High to Low</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Per Page */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Per Page</Label>
                <Select value={listingsPerPage.toString()} onValueChange={handleLimitChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 items</SelectItem>
                    <SelectItem value="12">12 items</SelectItem>
                    <SelectItem value="24">24 items</SelectItem>
                    <SelectItem value="48">48 items</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results Info */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Results</Label>
                <div className="h-10 flex items-center text-sm text-gray-600 bg-gray-50 rounded-md px-3">
                  {isLoading ? (
                    "Loading..."
                  ) : (
                    `${((currentPage - 1) * listingsPerPage) + 1}-${Math.min(currentPage * listingsPerPage, totalListings)} of ${totalListings}`
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Listings Grid */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(listingsPerPage).fill(0).map((_, index) => (
                <Card key={index} className="border-0 shadow-lg animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </div>
                      <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Listings Found</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {activeFilter === 'true' 
                      ? "No active listings available at the moment. Check back later for new carbon credit opportunities."
                      : activeFilter === 'false'
                      ? "No sold out listings found with the current filters."
                      : "No listings match your current filter criteria. Try adjusting your filters."
                    }
                  </p>
                  <Button 
                    className="mt-6"
                    onClick={() => {
                      setActiveFilter('all');
                      setSortBy('createdAt');
                      setSortOrder('desc');
                      setCurrentPage(1);
                      fetchListings(1, listingsPerPage, 'all', 'createdAt', 'desc');
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <Card 
                  key={listing.listingId} 
                  className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  {/* Image Section */}
                  <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-gray-900 to-gray-700 h-48">
                    <img
                      src={listing.image}
                      alt={listing.metadata || "Carbon Credit NFT"}
                      className="object-contain h-full w-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        listing.active 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {listing.active ? "Active" : "Sold Out"}
                      </span>
                    </div>
                    <div className="absolute top-4 left-4">
                      <div className="bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
                        <span className="text-white text-xs font-medium">#{listing.tokenId}</span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="mb-4">
                      <Link to={`/ProjectDetails/${listing.tokenContract}`}>
                        <h3 className="font-bold text-lg text-gray-900 hover:text-blue-600 transition-colors group-hover:text-blue-600 mb-2">
                          {listing.projectID || `${listing.tokenContract.slice(0, 8)}...${listing.tokenContract.slice(-6)}`}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-600">Certificate ID: {listing.certificateId}</p>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-green-700">{listing.quantity}</div>
                        <div className="text-xs text-green-600">tCO₂ Available</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-blue-700">{listing.pricePerUnit}</div>
                        <div className="text-xs text-blue-600">RUSD per tCO₂</div>
                      </div>
                    </div>

                    {/* Total Value */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total Value</span>
                        <span className="text-xs font-bold text-gray-900">
                          {(Number(listing.pricePerUnit) * Number(listing.quantity)).toLocaleString()} RUSD
                        </span>
                      </div>
                    </div>

                    {/* Alerts */}
                    {cardStates[listing.listingId]?.error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{cardStates[listing.listingId].error}</AlertDescription>
                      </Alert>
                    )}
                    {cardStates[listing.listingId]?.success && (
                      <Alert className="mb-4 border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">{cardStates[listing.listingId].success}</AlertDescription>
                      </Alert>
                    )}

                    {/* Action Section */}
                    {listing.active ? (
                      cardStates[listing.listingId]?.showInput ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`quantity-${listing.listingId}`} className="text-sm font-medium">
                              Quantity to Purchase
                            </Label>
                            <Input
                              id={`quantity-${listing.listingId}`}
                              type="number"
                              step="1"
                              min="1"
                              max={listing.quantity}
                              className="w-full"
                              placeholder="Enter quantity"
                              value={cardStates[listing.listingId].quantity}
                              onChange={(e) => handleInputChange(listing.listingId, e.target.value)}
                            />
                            <div className="bg-blue-50 rounded-lg p-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-blue-700">Total Cost:</span>
                                <span className="font-bold text-blue-900">
                                  {(Number(listing.pricePerUnit) * Number(cardStates[listing.listingId].quantity || 1)).toLocaleString()} RUSD
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handlePurchase(listing.listingId)}
                              disabled={cardStates[listing.listingId].isSubmitting}
                            >
                              {cardStates[listing.listingId].isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <ShoppingCart className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => toggleInput(listing.listingId)}
                              disabled={cardStates[listing.listingId].isSubmitting}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3"
                            onClick={() => toggleInput(listing.listingId)}
                            disabled={cardStates[listing.listingId]?.isSubmitting || listing.seller.toLowerCase() === walletAddress.toLowerCase()}
                          >
                            {listing.seller.toLowerCase() === walletAddress.toLowerCase() ? (
                              <>
                                <Star className="w-4 h-4 mr-2" />
                                Your Listing
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Buy Credits
                              </>
                            )}
                          </Button>

                          {listing.seller.toLowerCase() === walletAddress.toLowerCase() && (
                            <Button
                              variant="outline"
                              className="w-full border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => cancelListingNFTs(listing.listingId, listing._id)}
                              disabled={cardStates[listing.listingId]?.isSubmitting}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Cancel Listing
                            </Button>
                          )}
                        </div>
                      )
                    ) : (
                      <Button
                        className="w-full bg-gray-400 cursor-not-allowed"
                        disabled
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Sold Out
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Pagination */}
        {!isLoading && totalPages > 1 && (
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium">{((currentPage - 1) * listingsPerPage) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * listingsPerPage, totalListings)}</span> of{' '}
                  <span className="font-medium">{totalListings}</span> listings
                </div>
                
                <div className="flex items-center space-x-2">
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}