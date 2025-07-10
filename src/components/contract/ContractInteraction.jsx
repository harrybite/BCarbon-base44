import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Contract addresses
const GOVERNANCE_ADDRESS = '0x5296Bc359E5030d75F3c46613facfdE26eCBF24A';
const REGISTRY_ADDRESS = '0x2c90169D9A8e8C2999dDBF1Aae14CFFF381A102E';

export const useContractInteraction = () => {
  const [userAddress, setUserAddress] = React.useState("");
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState("");
  const [provider, setProvider] = React.useState(null);
  const [signer, setSigner] = React.useState(null);

  React.useEffect(() => {
    initializeProvider();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const initializeProvider = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Use window.ethereum directly for Web3 calls
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          setIsConnected(true);
        }
      } catch (error) {
        setError("Failed to initialize wallet connection");
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length > 0) {
      setUserAddress(accounts[0]);
      setIsConnected(true);
    } else {
      setUserAddress("");
      setIsConnected(false);
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError("MetaMask is not installed");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setUserAddress(accounts[0]);
        setIsConnected(true);
        setError("");
      }
    } catch (error) {
      setError("Failed to connect wallet");
    }
  };

  // Convert number to wei (18 decimals)
  const toWei = (value) => {
    return (parseFloat(value) * Math.pow(10, 18)).toString();
  };

  // Convert wei to ether
  const fromWei = (value) => {
    return (parseFloat(value) / Math.pow(10, 18)).toString();
  };

  // Registry Contract Functions
  const createAndListProject = async (projectData) => {
    if (!isConnected) throw new Error("Wallet not connected");
    
    try {
      // Contract interaction using window.ethereum
      const mintPriceWei = toWei(projectData.mintPrice.toString());
      const listingFeeWei = toWei("0.01"); // 0.01 ETH listing fee

      // Prepare contract call data
      const contractData = {
        to: REGISTRY_ADDRESS,
        data: await encodeCreateProjectCall(projectData, mintPriceWei),
        value: listingFeeWei
      };

      // Send transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: contractData.to,
          data: contractData.data,
          value: `0x${parseInt(contractData.value).toString(16)}`
        }]
      });

      return { hash: txHash };
    } catch (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }
  };

  // Helper function to encode contract call (simplified version)
  const encodeCreateProjectCall = async (projectData, mintPriceWei) => {
    // This would normally use ethers.js to encode the function call
    // For now, we'll return a placeholder that the backend can process
    return "0x"; // Placeholder - in a real implementation, this would be the encoded function call
  };

  // Mint functions
  const mintWithETH = async (projectAddress, amount) => {
    if (!isConnected) throw new Error("Wallet not connected");
    
    try {
      // Get mint price first (this would need a backend call to fetch)
      const mintPrice = 0.01; // Placeholder - should fetch from contract
      const totalCost = toWei((mintPrice * amount).toString());

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: projectAddress,
          data: `0xa0712d68${amount.toString(16).padStart(64, '0')}`, // mint(uint256) function signature + amount
          value: `0x${parseInt(totalCost).toString(16)}`
        }]
      });

      return { hash: txHash };
    } catch (error) {
      throw new Error(`Failed to mint: ${error.message}`);
    }
  };

  const retireCredits = async (projectAddress, amount) => {
    if (!isConnected) throw new Error("Wallet not connected");
    
    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: projectAddress,
          data: `0x9f181b5e${amount.toString(16).padStart(64, '0')}`, // retire(uint256) function signature + amount
        }]
      });

      return { hash: txHash };
    } catch (error) {
      throw new Error(`Failed to retire credits: ${error.message}`);
    }
  };

  const transferCredits = async (projectAddress, to, amount) => {
    if (!isConnected) throw new Error("Wallet not connected");
    
    try {
      // safeTransferFrom(from, to, id, amount, data)
      // This is a simplified version - actual implementation would need proper encoding
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: projectAddress,
          data: `0xf242432a`, // safeTransferFrom function signature (simplified)
        }]
      });

      return { hash: txHash };
    } catch (error) {
      throw new Error(`Failed to transfer credits: ${error.message}`);
    }
  };

  // Governance functions (for VVBs and admins)
  const validateProject = async (projectAddress) => {
    if (!isConnected) throw new Error("Wallet not connected");
    
    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: GOVERNANCE_ADDRESS,
          data: `0x${projectAddress.slice(2).padStart(64, '0')}`, // Simplified encoding
        }]
      });

      return { hash: txHash };
    } catch (error) {
      throw new Error(`Failed to validate project: ${error.message}`);
    }
  };

  const verifyProject = async (projectAddress) => {
    if (!isConnected) throw new Error("Wallet not connected");
    
    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: GOVERNANCE_ADDRESS,
          data: `0x${projectAddress.slice(2).padStart(64, '0')}`, // Simplified encoding
        }]
      });

      return { hash: txHash };
    } catch (error) {
      throw new Error(`Failed to verify project: ${error.message}`);
    }
  };

  const approveAndIssueCredits = async (projectAddress, creditAmount, certificateId) => {
    if (!isConnected) throw new Error("Wallet not connected");
    
    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: GOVERNANCE_ADDRESS,
          data: `0x`, // Would need proper encoding with all parameters
        }]
      });

      return { hash: txHash };
    } catch (error) {
      throw new Error(`Failed to approve and issue credits: ${error.message}`);
    }
  };

  const rejectAndRemoveProject = async (projectAddress) => {
    if (!isConnected) throw new Error("Wallet not connected");
    
    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: GOVERNANCE_ADDRESS,
          data: `0x${projectAddress.slice(2).padStart(64, '0')}`,
        }]
      });

      return { hash: txHash };
    } catch (error) {
      throw new Error(`Failed to reject project: ${error.message}`);
    }
  };

  // Backend integration functions (these call the backend to get blockchain data)
  const getProjectStats = async (projectAddress) => {
    // This would call your backend function to get project stats
    return {
      totalSupply: 0,
      totalRetired: 0,
      mintPrice: "0",
      mintingActive: false,
      owner: ""
    };
  };

  const checkAuthorizedVVB = async (address) => {
    // This would call your backend to check VVB status
    return false;
  };

  const getUserBalance = async (projectAddress, tokenId = 1) => {
    // This would call your backend to get user balance
    return 0;
  };

  const getTokenURI = async (projectAddress, tokenId) => {
    // This would call your backend to get token URI
    return "";
  };

  return {
    userAddress,
    isConnected,
    error,
    connectWallet,
    // Registry functions
    createAndListProject,
    // BCO2 functions
    mintWithETH,
    retireCredits,
    transferCredits,
    // Governance functions
    validateProject,
    verifyProject,
    approveAndIssueCredits,
    rejectAndRemoveProject,
    // Read functions (these would call backend)
    getProjectStats,
    checkAuthorizedVVB,
    getUserBalance,
    getTokenURI
  };
};

export default function ContractInteraction({ children }) {
  return <>{children}</>;
}