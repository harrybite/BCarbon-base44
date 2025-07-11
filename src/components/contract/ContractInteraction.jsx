import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, JsonRpcProvider, parseEther } from 'ethers';
import governanceAbi from './Governance.json';
import registryAbi from './CarbonCreditRegistry.json';
import bco2Abi from './BCO2.json';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Contract addresses
const GOVERNANCE_ADDRESS = '0x5296Bc359E5030d75F3c46613facfdE26eCBF24A';
const REGISTRY_ADDRESS = '0x680a0D6aA3af9328d466a721322e38e90A104D42';

export const useContractInteraction = () => {
  const [userAddress, setUserAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [governance, setGovernance] = useState(null);
  const [registry, setRegistry] = useState(null);

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
  }, []);

  const initializeProvider = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const web3Provider = new BrowserProvider(window.ethereum);
        const signer = await web3Provider.getSigner();
        const governanceContract = new Contract(GOVERNANCE_ADDRESS, governanceAbi, signer);
        const registryContract = new Contract(REGISTRY_ADDRESS, registryAbi, signer);
        setProvider(web3Provider);
        setSigner(signer);
        setGovernance(governanceContract);
        setRegistry(registryContract);
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          setIsConnected(true);
        }
      } catch (error) {
        setError("Failed to initialize wallet connection", error);
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
        setGovernance(new Contract(GOVERNANCE_ADDRESS, governanceAbi, signer));
        setRegistry(new Contract(REGISTRY_ADDRESS, registryAbi, signer));
      }
    } else {
      setUserAddress("");
      setIsConnected(false);
      setSigner(null);
      setGovernance(null);
      setRegistry(null);
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
        setGovernance(new Contract(GOVERNANCE_ADDRESS, governanceAbi, signer));
        setRegistry(new Contract(REGISTRY_ADDRESS, registryAbi, signer));
      }
    } catch (error) {
      setError("Failed to connect wallet", error);
    }
  };
 

const createAndListProject = async (projectData) => {
  if (!isConnected || !registry) throw new Error("Wallet not connected or contracts not initialized");

  // List of required fields
  const requiredFields = [
    "mintPrice",
    "treasury",
    "defaultIsPermanent",
    "defaultValidity",
    "defaultVintage",
    "RUSD",
    "nonRetiredURI",
    "retiredURI",
    "methodology",
    "emissionReductions",
    "projectDetails"
  ];

  // Check for missing fields
  for (const field of requiredFields) {
    if (
      projectData[field] === undefined ||
      projectData[field] === null ||
      (typeof projectData[field] === "string" && projectData[field].trim() === "")
    ) {
      throw new Error(`Missing required parameter: ${field}`);
    }
  }

  try {
    const {
      mintPrice,
      treasury,
      defaultIsPermanent,
      defaultValidity,
      defaultVintage,
      RUSD,
      nonRetiredURI,
      retiredURI,
      methodology,
      emissionReductions,
      projectDetails,
      listingFee
    } = projectData;

    const mintPriceWei = parseEther(mintPrice.toString());
    const listingFeeWei = listingFee ? parseEther(listingFee.toString()) : 0n;

    const tx = await registry.createAndListProject(
      mintPriceWei,
      treasury,
      defaultIsPermanent,
      defaultValidity,
      defaultVintage,
      RUSD,
      nonRetiredURI,
      retiredURI,
      methodology,
      emissionReductions,
      projectDetails,
      { value: listingFeeWei }
    );
    const receipt = await tx.wait();
    const projectAddress = receipt.logs
      .map(log => {
        try {
          return registry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(event => event?.name === 'ProjectListed')?.args.projectContract;
    return { hash: tx.hash, projectAddress };
  } catch (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }
};

  const mintWithETH = async (projectAddress, amount) => {
    if (!isConnected || !signer) throw new Error("Wallet not connected");
    try {
      const bco2Contract = new Contract(projectAddress, bco2Abi, signer);
      const tx = await bco2Contract.mint(amount, { value: 0 }); // Adjust value if minting requires payment
      await fetch(`http://localhost:3001/api/transaction/${tx.hash}`);
      return { hash: tx.hash };
    } catch (error) {
      throw new Error(`Failed to mint: ${error.message}`);
    }
  };

  const retireCredits = async (projectAddress, amount) => {
    if (!isConnected || !signer) throw new Error("Wallet not connected");
    try {
      const bco2Contract = new Contract(projectAddress, bco2Abi, signer);
      const tx = await bco2Contract.retire(amount);
      await fetch(`http://localhost:3001/api/transaction/${tx.hash}`);
      return { hash: tx.hash };
    } catch (error) {
      throw new Error(`Failed to retire credits: ${error.message}`);
    }
  };

  const transferCredits = async (projectAddress, to, amount) => {
    if (!isConnected || !signer) throw new Error("Wallet not connected");
    try {
      const bco2Contract = new Contract(projectAddress, bco2Abi, signer);
      const tx = await bco2Contract.safeTransferFrom(userAddress, to, 1, amount, '0x');
      await fetch(`http://localhost:3001/api/transaction/${tx.hash}`);
      return { hash: tx.hash };
    } catch (error) {
      throw new Error(`Failed to transfer credits: ${error.message}`);
    }
  };

  const validateProject = async (projectAddress) => {
    if (!isConnected || !governance) throw new Error("Wallet not connected");
    try {
      const tx = await governance.validateProject(projectAddress);
      await fetch(`http://localhost:3001/api/transaction/${tx.hash}`);
      return { hash: tx.hash };
    } catch (error) {
      throw new Error(`Failed to validate project: ${error.message}`);
    }
  };

  const verifyProject = async (projectAddress) => {
    if (!isConnected || !governance) throw new Error("Wallet not connected");
    try {
      const tx = await governance.verifyProject(projectAddress);
      await fetch(`http://localhost:3001/api/transaction/${tx.hash}`);
      return { hash: tx.hash };
    } catch (error) {
      throw new Error(`Failed to verify project: ${error.message}`);
    }
  };

  const approveAndIssueCredits = async (projectAddress, creditAmount, certificateId) => {
    if (!isConnected || !governance) throw new Error("Wallet not connected");
    try {
      const tx = await governance.approveAndIssueCredits(projectAddress, creditAmount, certificateId);
      await fetch(`http://localhost:3001/api/transaction/${tx.hash}`);
      return { hash: tx.hash };
    } catch (error) {
      throw new Error(`Failed to approve and issue credits: ${error.message}`);
    }
  };

  const rejectAndRemoveProject = async (projectAddress) => {
    if (!isConnected || !governance) throw new Error("Wallet not connected");
    try {
      const tx = await governance.rejectAndRemoveProject(projectAddress);
      await fetch(`http://localhost:3001/api/transaction/${tx.hash}`);
      return { hash: tx.hash };
    } catch (error) {
      throw new Error(`Failed to reject project: ${error.message}`);
    }
  };

  const pauseContract = async () => {
    if (!isConnected || !governance) throw new Error("Wallet not connected");
    try {
      const tx = await governance.pause();
      await fetch(`http://localhost:3001/api/transaction/${tx.hash}`);
      return { hash: tx.hash };
    } catch (error) {
      throw new Error(`Failed to pause contract: ${error.message}`);
    }
  };

  const unpauseContract = async () => {
    if (!isConnected || !governance) throw new Error("Wallet not connected");
    try {
      const tx = await unpauseContract();
      await fetch(`http://localhost:3001/api/transaction/${tx.hash}`);
      return { hash: tx.hash };
    } catch (error) {
      throw new Error(`Failed to unpause contract: ${error.message}`);
    }
  };

  const addVVB = async (vvbAddress) => {
    if (!isConnected || !governance) throw new Error("Wallet not connected");
    try {
      const tx = await governance.addVVB(vvbAddress);
      await fetch(`http://localhost:3001/api/transaction/${tx.hash}`);
      return { hash: tx.hash };
    } catch (error) {
      throw new Error(`Failed to add VVB: ${error.message}`);
    }
  };

  const removeVVB = async (vvbAddress) => {
    if (!isConnected || !governance) throw new Error("Wallet not connected");
    try {
      const tx = await governance.removeVVB(vvbAddress);
      await fetch(`http://localhost:3001/api/transaction/${tx.hash}`);
      return { hash: tx.hash };
    } catch (error) {
      throw new Error(`Failed to remove VVB: ${error.message}`);
    }
  };

  const updateRegistryAddress = async (newRegistryAddress) => {
    if (!isConnected || !governance) throw new Error("Wallet not connected");
    try {
      const tx = await governance.updateRegistry(newRegistryAddress);
      await fetch(`http://localhost:3001/api/transaction/${tx.hash}`);
      return { hash: tx.hash };
    } catch (error) {
      throw new Error(`Failed to update registry: ${error.message}`);
    }
  };

  const getProjectStats = async (projectAddress) => {
    try {
      const response = await fetch(`http://localhost:3001/api/project/${projectAddress}?userAddress=${userAddress}`);
      const data = await response.json();
      return {
        totalSupply: data.creditAmount,
        totalRetired: 0, // Add logic in backend if needed
        mintPrice: "0", // Adjust if BCO2 contract provides mint price
        mintingActive: data.isApproved,
        owner: data.metadata.owner,
        comments: data.comments.concat(data.offChainComments)
      };
    } catch (error) {
      throw new Error(`Failed to fetch project stats: ${error.message}`);
    }
  };

  const checkAuthorizedVVB = async () => {
    if (!userAddress) return false;
    try {
      const response = await fetch(`http://localhost:3001/api/contract-owner`);
      const { owner } = await response.json();
      const isVVB = await governance.checkAuthorizedVVBs(userAddress);
      return isVVB || userAddress.toLowerCase() === owner.toLowerCase();
    } catch (error) {
      console.error('Error checking VVB status:', error);
      return false;
    }
  };

  const checkIsOwner = async () => {
    if (!governance || !userAddress) return false;
    try {
      const owner = await governance.owner();
      return userAddress.toLowerCase() === owner.toLowerCase();
    } catch (error) {
      console.error('Error checking owner status:', error);
      return false;
    }
  };

  const getOwner = async () => {
    if (!governance || !userAddress) return false;
    try {
      const owner = await governance.owner();
      return owner
    } catch (error) {
      console.error('Error checking owner status:', error);
      return false;
    }
  };

  const checkIsProjectOwner = async (projectAddress) => {
    if (!registry || !userAddress) return false;
    try {
      const owners = await registry.getAuthorizedProjectOwners(projectAddress);
      return owners.map(addr => addr.toLowerCase()).includes(userAddress.toLowerCase());
    } catch (error) {
      console.error('Error checking project owner status:', error);
      return false;
    }
  };

  const getListedProjects = async () => {
  if (!registry) throw new Error("Registry contract not initialized");
  try {
    const projects = await registry.getListedProjects();
    return projects;
  } catch (error) {
    throw new Error(`Failed to fetch listed projects: ${error.message}`);
  }
};

// const getApprovedProjects = async () => {
//   if (!registry) throw new Error("Registry contract not initialized");
//   try {
//     const projects = await registry.getApprovedProjects();
//     return projects;
//   } catch (error) {
//     throw new Error(`Failed to fetch approved projects: ${error.message}`);
//   }
// };

const getProjectDetails = async () => {
  if (!registry) throw new Error("Registry contract not initialized");
  try {
    const listedProjects = await getListedProjects();
    const details = [];
    for (const projectAddress of listedProjects) {
      const projectDetail = await registry.getProjectDetails(projectAddress);
      details.push({ projectAddress, ...projectDetail });
    }
    return details;
  } catch (error) {
    throw new Error(`Failed to fetch project details: ${error.message}`);
  }
};

  const getUserBalance = async (projectAddress, tokenId = 1) => {
    try {
      const bco2Contract = new Contract(projectAddress, bco2Abi, provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/'));
      const balance = await bco2Contract.balanceOf(userAddress, tokenId);
      return balance.toString();
    } catch (error) {
      throw new Error(`Failed to fetch user balance: ${error.message}`);
    }
  };

  const getTokenURI = async (projectAddress, tokenId = 1) => {
    try {
      const bco2Contract = new Contract(projectAddress, bco2Abi, provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/'));
      const uri = await bco2Contract.uri(tokenId);
      return uri;
    } catch (error) {
      throw new Error(`Failed to fetch token URI: ${error.message}`);
    }
  };

  return {
    userAddress,
    isConnected,
    error,
    connectWallet,
    createAndListProject,
    mintWithETH,
    retireCredits,
    transferCredits,
    validateProject,
    verifyProject,
    approveAndIssueCredits,
    rejectAndRemoveProject,
    pauseContract,
    unpauseContract,
    addVVB,
    removeVVB,
    updateRegistryAddress,
    getProjectStats,
    getProjectDetails,
    checkAuthorizedVVB,
    checkIsOwner,
    getOwner,
    checkIsProjectOwner,
    getUserBalance,
    getTokenURI
  };
};

export default function ContractInteraction(props) {
  const { children = null } = props || {};
  const { error } = useContractInteraction();

  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {children}
    </>
  );
}
