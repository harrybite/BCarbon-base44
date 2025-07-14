/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther, parseEther, JsonRpcProvider } from 'ethers';
import CarbonCreditMarketplaceABI from './Marketplace.json';
import ERC20Abi from './ERC20.json';
import { MARKETPLACE_ADDRESS, RUSD } from './address';
import { AlertCircle } from 'lucide-react';
import { AlertDescription } from '../ui/alert';
import { useContractInteraction } from './ContractInteraction';
import { useConnectWallet } from '@/context/walletcontext';

export const useMarketplaceInteraction = () => {
  const [userAddress, setUserAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [marketplaceContract, setMarketplaceContract] = useState(null);
  const [rusdContract, setRUSDContract] = useState(null);
  const { getTokenURIs } = useContractInteraction();
  const { walletAddress } = useConnectWallet();

  useEffect(() => {
    initializeProvider();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [walletAddress]);

  const initializeProvider = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const web3Provider = new BrowserProvider(window.ethereum);
        const signer = await web3Provider.getSigner();
        const marketplace = new Contract(MARKETPLACE_ADDRESS, CarbonCreditMarketplaceABI, signer);
        const rusd = new Contract(RUSD, ERC20Abi, signer);
        setProvider(web3Provider);
        setSigner(signer);
        setMarketplaceContract(marketplace);
        setRUSDContract(rusd);
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          setIsConnected(true);
        }
      } catch (error) {
        setError(`Failed to initialize wallet connection: ${error.message}`);
      }
    }
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length > 0) {
      setUserAddress(accounts[0]);
      setIsConnected(true);
      if (provider) {
        const signer = await provider.getSigner();
        setSigner(signer);
        setMarketplaceContract(new Contract(MARKETPLACE_ADDRESS, CarbonCreditMarketplaceABI, signer));
        setRUSDContract(new Contract(RUSD, ERC20Abi, signer));
      }
    } else {
      setUserAddress("");
      setIsConnected(false);
      setSigner(null);
      setMarketplaceContract(null);
      setRUSDContract(null);
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError("MetaMask is not installed");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setUserAddress(accounts[0]);
        setIsConnected(true);
        setError("");
        const web3Provider = new BrowserProvider(window.ethereum);
        const signer = await web3Provider.getSigner();
        setProvider(web3Provider);
        setSigner(signer);
        setMarketplaceContract(new Contract(MARKETPLACE_ADDRESS, CarbonCreditMarketplaceABI, signer));
        setRUSDContract(new Contract(RUSD, ERC20Abi, signer));
      }
    } catch (error) {
      setError(`Failed to connect wallet: ${error.message}`);
    }
  };

  const createListing = async (tokenContract, tokenId = 1, quantity, pricePerUnit) => {
    if (!isConnected || !marketplaceContract || !signer) {
      throw new Error("Wallet not connected or contract not initialized");
    }
    try {
      const pricePerUnitWei = parseEther(pricePerUnit.toString());
      const tx = await marketplaceContract.createListing(tokenContract, tokenId, quantity, pricePerUnitWei);
      return await tx.wait();
    } catch (error) {
      throw new Error(`Failed to create listing: ${error.message}`);
    }
  };

  const updateListing = async (listingId, quantity, pricePerUnit) => {
    if (!isConnected || !marketplaceContract || !signer) {
      throw new Error("Wallet not connected or contract not initialized");
    }
    try {
      const pricePerUnitWei = parseEther(pricePerUnit.toString());
      const tx = await marketplaceContract.updateListing(listingId, quantity, pricePerUnitWei);
      return await tx.wait();
    } catch (error) {
      throw new Error(`Failed to update listing: ${error.message}`);
    }
  };

  const cancelListing = async (listingId) => {
    if (!isConnected || !marketplaceContract || !signer) {
      throw new Error("Wallet not connected or contract not initialized");
    }
    try {
      const tx = await marketplaceContract.cancelListing(listingId);
      return await tx.wait();
    } catch (error) {
      throw new Error(`Failed to cancel listing: ${error.message}`);
    }
  };

  const purchase = async (listingId, quantity) => {
    console.log("marketplaceContract || !rusdContract", marketplaceContract,  rusdContract)
    if (!marketplaceContract || !rusdContract ) {
      throw new Error("Wallet not connected or contracts not initialized");
    }
    try {
      console.log("listing details", listingId, quantity)
      const totalPrice = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      const allowance = await rusdContract.allowance(userAddress, MARKETPLACE_ADDRESS);
      if (Number(allowance) === 0) {
        const approveTx = await rusdContract.approve(MARKETPLACE_ADDRESS, totalPrice);
        await approveTx.wait();
      }
      const tx = await marketplaceContract.purchase(listingId, quantity);
      return await tx.wait();
    } catch (error) {
      throw new Error(`Failed to purchase: ${error.message}`);
    }
  };

  const withdrawFees = async () => {
    if (!isConnected || !marketplaceContract || !signer) {
      throw new Error("Wallet not connected or contract not initialized");
    }
    try {
      const tx = await marketplaceContract.withdrawFees();
      return await tx.wait();
    } catch (error) {
      throw new Error(`Failed to withdraw fees: ${error.message}`);
    }
  };

  const getListing = async (listingId) => {
    try {
      const contract = new Contract(
        MARKETPLACE_ADDRESS,
        CarbonCreditMarketplaceABI,
        provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
      );
      const listing = await contract.getListing(listingId);
      return {
        listingId: listingId.toString(),
        seller: listing.seller,
        tokenContract: listing.tokenContract,
        tokenId: listing.tokenId.toString(),
        quantity: listing.quantity.toString(),
        pricePerUnit: formatEther(listing.pricePerUnit),
        active: listing.active
      };
    } catch (error) {
      throw new Error(`Failed to fetch listing: ${error.message}`);
    }
  };

  const getListings = async () => {
    try {
      const contract = new Contract(
        MARKETPLACE_ADDRESS,
        CarbonCreditMarketplaceABI,
        provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
      );
      const listingCount = await contract.listingCounter();
      const listings = [];
      for (let i = 0; i < listingCount; i++) {
        const listing = await contract.getListing(i);
        let tokenURI = await getTokenURIs(listing.tokenContract, 1);
        tokenURI = tokenURI?.replace(/^"|"$/g, "");
        const response = await fetch(tokenURI);
        const metadata = await response.json();
        listings.push({
          listingId: i.toString(),
          seller: listing.seller,
          image: metadata?.image || '',
          tokenContract: listing.tokenContract,
          tokenId: listing.tokenId.toString(),
          quantity: listing.quantity.toString(),
          pricePerUnit: formatEther(listing.pricePerUnit),
          active: listing.active
        });
      }
      return listings;
    } catch (error) {
      throw new Error(`Failed to fetch listings: ${error.message}`);
    }
  };

  const getUserListings = async (userAddress) => {
    try {
      const contract = new Contract(
        MARKETPLACE_ADDRESS,
        CarbonCreditMarketplaceABI,
        provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
      );
      const listingIds = await contract.getUserListings(userAddress);
      const listings = [];
      for (let id of listingIds) {
        const listing = await contract.getListing(id);
        listings.push({
          listingId: id.toString(),
          seller: listing.seller,
          tokenContract: listing.tokenContract,
          tokenId: listing.tokenId.toString(),
          quantity: listing.quantity.toString(),
          pricePerUnit: formatEther(listing.pricePerUnit),
          active: listing.active
        });
      }
      return listings;
    } catch (error) {
      throw new Error(`Failed to fetch user listings: ${error.message}`);
    }
  };

  const approveRUSD = async (amount) => {
    if (!isConnected || !rusdContract || !signer) {
      throw new Error("Wallet not connected or contract not initialized");
    }
    try {
      const amountWei = parseEther(amount.toString());
      const tx = await rusdContract.approve(MARKETPLACE_ADDRESS, amountWei);
      return await tx.wait();
    } catch (error) {
      throw new Error(`Failed to approve RUSD: ${error.message}`);
    }
  };

  const getRUSDBalance = async (address = null) => {
    try {
      const targetAddress = address || userAddress;
      if (!targetAddress) throw new Error("No address provided");
      const contract = new Contract(
        RUSD,
        ERC20Abi,
        provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
      );
      const balance = await contract.balanceOf(targetAddress);
      return formatEther(balance);
    } catch (error) {
      throw new Error(`Failed to fetch RUSD balance: ${error.message}`);
    }
  };

  const checkRUSDAllowance = async () => {
    if (!userAddress) throw new Error("User wallet not connected");
    try {
      const contract = new Contract(
        RUSD,
        ERC20Abi,
        provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
      );
      const allowance = await contract.allowance(userAddress, MARKETPLACE_ADDRESS);
      return formatEther(allowance);
    } catch (error) {
      throw new Error(`Failed to check RUSD allowance: ${error.message}`);
    }
  };

  return {
    userAddress,
    isConnected,
    error,
    marketplaceContract,
    connectWallet,
    createListing,
    updateListing,
    cancelListing,
    purchase,
    withdrawFees,
    getListing,
    getListings,
    getUserListings,
    approveRUSD,
    getRUSDBalance,
    checkRUSDAllowance
  };
};

export default function MarketplaceInteraction(props) {
  const { children = null } = props || {};
  const { error } = useMarketplaceInteraction();

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 z-50">
          <AlertCircle variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </AlertCircle>
        </div>
      )}
      {children}
    </>
  );
}