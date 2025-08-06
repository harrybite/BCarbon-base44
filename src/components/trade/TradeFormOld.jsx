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
import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useMarketplaceInteraction } from '@/components/contract/MarketplaceInteraction';
import { useConnectWallet } from "@/context/walletcontext";
import { useToast } from "../ui/use-toast";

export default function TradeForm() {
  const { getListings, purchase, getRUSDBalance } = useMarketplaceInteraction();
   const { walletAddress } = useConnectWallet();
  const [listings, setListings] = React.useState([]);
  const [cardStates, setCardStates] = React.useState({});
  const [update, setUpdate] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true);
  const [rusdBalance, setRUSDBalance] = React.useState('0');

  const {toast} = useToast()

  React.useEffect(() => {
    const fetchListings = async () => {
       setIsLoading(true)
      try {
        const rusdBalance = await getRUSDBalance(walletAddress);
        setRUSDBalance(rusdBalance);
        const fetchedListings = await getListings();
        console.log("Fetched Listings:", fetchedListings);
       
        const activeListings = fetchedListings.filter(listing => listing.active);
        setListings(activeListings);

        const initialStates = {};
        fetchedListings.forEach(listing => {
          initialStates[listing.listingId] = {
            quantity: "",
            isSubmitting: false,
            error: "",
            success: "",
            showInput: false
          };
        });
        setCardStates(initialStates);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
        setCardStates(prev => {
          const newStates = { ...prev };
          Object.keys(newStates).forEach(id => {
            newStates[id].error = "Failed to fetch listings: " + (err.message || "Unknown error");
          });
          return newStates;
        });
      }
      finally{
         setIsLoading(false)
      }
    };
    if (walletAddress) {
      fetchListings();
    }
  }, [ walletAddress, update]);

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
  
    if( Number(rusdBalance) < (Number(listing.pricePerUnit) * quantity)) {
      toast({
        title: "Insufficient RUSD Balance",
        description: `You need at least ${Number(listing.pricePerUnit) * quantity} RUSD to purchase this listing.`,
        variant: "destructive",
      })
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
      const { hash } = await purchase(listingId, quantity);

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
      setUpdate(update + 1)
   
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
          Buy non-retired carbon credit NFTs (tCO2) from listed projects
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, index) => (
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
            <p className="text-center col-span-full text-gray-600">No listings available</p>
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
                  {cardStates[listing.listingId]?.showInput ? (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor={`quantity-${listing.listingId}`}>Quantity to Purchase</Label>
                      <Input
                        id={`quantity-${listing.listingId}`}
                        type="number"
                        step="1"
                        min="1"
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
                      disabled={cardStates[listing.listingId]?.isSubmitting}
                    >
                      Buy Credits
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}