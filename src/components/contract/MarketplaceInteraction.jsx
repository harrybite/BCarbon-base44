/* eslint-disable no-constant-condition */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther, parseEther, JsonRpcProvider } from 'ethers';
import CarbonCreditMarketplaceABI from './Marketplace.json';
import ERC20Abi from './ERC20.json';
import { chainInfo, MARKETPLACE_ADDRESS, RUSD } from './address';
import { AlertCircle } from 'lucide-react';
import { AlertDescription } from '../ui/alert';
import { useContractInteraction } from './ContractInteraction';
import { useConnectWallet } from '@/context/walletcontext';
import { getContract, prepareContractCall, sendAndConfirmTransaction } from 'thirdweb';
import { thirdwebclient } from '@/thirwebClient';
import { bscTestnet } from 'thirdweb/chains';

export const useMarketplaceInteraction = () => {
  const { getTokenURIs } = useContractInteraction();
  const { walletAddress } = useConnectWallet();

  const thridWeb_MARKETPLACE_Contract = getContract({
    client: thirdwebclient,
    chain: bscTestnet,
    address: MARKETPLACE_ADDRESS,
    abi: CarbonCreditMarketplaceABI,
  });

  const thridWebERC20Contract = getContract({
    client: thirdwebclient,
    chain: bscTestnet,
    address: RUSD,
    abi: ERC20Abi,
  });

  const getProvider = () => {
    return new JsonRpcProvider(chainInfo.rpc);
  };

  const getProjectMarketPlaceContract = async (withSigner = false) => {
    const provider = getProvider();
    return new Contract(MARKETPLACE_ADDRESS, CarbonCreditMarketplaceABI, provider);
  };

  const getProjectERC20Contract = async (withSigner = false) => {
    const provider = getProvider();
    return new Contract(RUSD, ERC20Abi, provider);
  };


  const createListing = async (tokenContract, tokenId = 1, quantity, pricePerUnit, account) => {
    if (!account) throw new Error("Account is required to set token URI");

    try {
      console.log("Creating listing with params:", {
        tokenContract,
        tokenId,
        quantity,
        pricePerUnit,
        account,
      });
      const pricePerUnitWei = parseEther(pricePerUnit.toString());
      // user thirdweb marketplace contract for sending tx
      const transaction = prepareContractCall({
        contract: thridWeb_MARKETPLACE_Contract,
        method: "createListing",
        params: [tokenContract, tokenId, quantity, pricePerUnitWei],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;

    } catch (error) {
      // throw new Error(`Failed to create listing: ${error.message}`);
      console.error("Failed to create listing:", error);
    }
  };

  const updateListing = async (listingId, quantity, pricePerUnit, account) => {
    if (!account) throw new Error("Account is required to set token URI");
    try {
      const transaction = prepareContractCall({
        contract: thridWeb_MARKETPLACE_Contract,
        method: "updateListing",
        params: [listingId, quantity, pricePerUnit],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      // throw new Error(`Failed to update listing: ${error.message}`);
      console.error("Failed to update listing:", error);
    }
  };

  const cancelListing = async (listingId, account) => {
    if (!account) throw new Error("Account is required to set token URI");
    try {
      // const tx = await marketplaceContract.cancelListing(listingId);
      // return await tx.wait();
      const transaction = prepareContractCall({
        contract: thridWeb_MARKETPLACE_Contract,
        method: "cancelListing",
        params: [listingId],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      // throw new Error(`Failed to cancel listing: ${error.message}`);
      console.error("Failed to cancel listing:", error);
    }
  };

  const purchase = async (listingId, quantity, account) => {
    if (!account) throw new Error("Account is required to set token URI");
    try {

      const totalPrice = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

      const rusdContract = await getProjectERC20Contract();
      const allowance = await rusdContract.allowance(walletAddress, MARKETPLACE_ADDRESS);
      console.log("RUSD Allowance:", allowance, listingId, quantity);
      if (Number(allowance) === 0) {
        const RUSDtransaction = prepareContractCall({
          contract: thridWebERC20Contract,
          method: "approve",
          params: [MARKETPLACE_ADDRESS, totalPrice],
        });
        const transactionReceipt = await sendAndConfirmTransaction({
          account,
          transaction: RUSDtransaction,
        });
        if (transactionReceipt.status !== "success") {
          throw new Error("Failed to approve RUSD for marketplace");
        } 
      }


      const transaction = prepareContractCall({
        contract: thridWeb_MARKETPLACE_Contract,
        method: "purchase",
        params: [listingId, quantity],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      // throw new Error(`Failed to purchase: ${error.message}`);
      console.error("Failed to purchase:", error);
    }
  };

  const withdrawFees = async (account) => {
    if (!account) throw new Error("Account is required to set token URI");
    try {
      const transaction = prepareContractCall({
        contract: thridWeb_MARKETPLACE_Contract,
        method: "withdrawFees",
        params: [],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      // throw new Error(`Failed to withdraw fees: ${error.message}`);
      console.error("Failed to withdraw fees:", error);
    }
  };

  const getListing = async (listingId) => {
    try {
      const contract = await getProjectMarketPlaceContract();
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
      // throw new Error(`Failed to fetch listing: ${error.message}`);
      console.error("Failed to fetch listing:", error);
    }
  };

  const getListings = async () => {
    try {
      const contract = await getProjectMarketPlaceContract();
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
      return listings.reverse();
    } catch (error) {
      // throw new Error(`Failed to fetch listings: ${error.message}`);
      console.error("Failed to fetch listings:", error);
    }
  };

  const getUserListings = async (userAddress) => {
    try {
      const contract = await getProjectMarketPlaceContract()
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
      return listings.reverse();
    } catch (error) {
      // throw new Error(`Failed to fetch user listings: ${error.message}`);
      console.error("Failed to fetch user listings:", error);
    }
  };

  const approveRUSD = async (amount, account) => {
    if (!account) throw new Error("Account is required to set token URI");
    try {
      const amountWei = parseEther(amount.toString());
      const transaction = prepareContractCall({
        contract: thridWebERC20Contract,
        method: "approve",
        params: [MARKETPLACE_ADDRESS, amountWei],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      // throw new Error(`Failed to approve RUSD: ${error.message}`);
      console.error("Failed to approve RUSD:", error);
    }
  };

  const getRUSDBalance = async (address = null) => {
    try {
      const contract = await getProjectERC20Contract();
      const balance = await contract.balanceOf(address || walletAddress);
      return formatEther(balance);
    } catch (error) {
      // throw new Error(`Failed to fetch RUSD balance: ${error.message}`);
      console.error("Failed to fetch RUSD balance:", error);
    }
  };

  //listingCounter

  const listingCounter = async () => {
    try {
      const contract = await getProjectMarketPlaceContract();
      const count = await contract.listingCounter();
      return count.toString();
    } catch (error) {
      console.error("Failed to fetch listing counter:", error);
      // throw new Error(`Failed to fetch listing counter: ${error.message}`);
    }
  };

  //totalVolumeTransacted

  const totalVolumeTransacted = async () => {
    try {
      const contract = await getProjectMarketPlaceContract();
      const volume = await contract.totalVolumeTransacted();
      return formatEther(volume);
    } catch (error) {
      console.error("Failed to fetch total volume transacted:", error);
      // throw new Error(`Failed to fetch total volume transacted: ${error.message}`);
    }
  };

  //totalCreditsSold

  const totalCreditsSold = async () => {
    try {
      const contract = await getProjectMarketPlaceContract();
      const totalSold = await contract.totalCreditsSold();
      return totalSold.toString();
    } catch (error) {
      console.error("Failed to fetch total credits sold:", error);
      // throw new Error(`Failed to fetch total credits sold: ${error.message}`);
    }
  };

  const checkRUSDAllowance = async () => {
    try {
      const contract = await getProjectERC20Contract();
      const allowance = await contract.allowance(walletAddress, MARKETPLACE_ADDRESS);
      return formatEther(allowance);
    } catch (error) {
      console.error("Failed to check RUSD allowance:", error);
      // throw new Error(`Failed to check RUSD allowance: ${error.message}`);
    }
  };

  return {
    createListing,
    updateListing,
    cancelListing,
    purchase,
    listingCounter,
    totalVolumeTransacted,
    totalCreditsSold,
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