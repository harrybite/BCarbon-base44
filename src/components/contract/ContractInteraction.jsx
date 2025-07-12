/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, decodeBytes32String, formatEther, JsonRpcProvider, parseEther, toBigInt } from 'ethers';
import governanceAbi from './Governance.json';
import ERC20Abi from './ERC20.json';
import projectFactoryabi from './ProjectFactory.json';
import projectManagerabi from './ProjectManager.json';
import projectDataabi from './ProjectData.json';
import bco2Abi from './BCO2.json';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { GOVERNANCE_ADDRESS, projectData, projectFactory, projectManager, RUSD } from './address';
import { User } from 'lucide-react';


export const useContractInteraction = () => {
  const [userAddress, setUserAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [governance, setGovernance] = useState(null);
  const [registry, setRegistry] = useState(null);
  const [projectManagerContract, setProjectManagerContract] = useState(null);
  const [projectDataContract, setProjectDataContract] = useState(null);
  const [projectFactoryContract, setProjectFactoryContract] = useState(null);

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
        const ProjectManagerContract = new Contract(projectManager, projectManagerabi, signer);
        const ProjectDataContract = new Contract(projectData, projectDataabi, signer);
        const ProjectFactoryContract = new Contract(projectFactory, projectFactoryabi, signer);
        setProjectManagerContract(ProjectManagerContract);
        setProjectDataContract(ProjectDataContract);
        setProjectFactoryContract(ProjectFactoryContract);
        setProvider(web3Provider);
        setSigner(signer);
        setGovernance(governanceContract);
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
        const ProjectManagerContract = new Contract(projectManager, projectManagerabi, signer);
        const ProjectDataContract = new Contract(projectData, projectDataabi, signer);
        const ProjectFactoryContract = new Contract(projectFactory, projectFactoryabi, signer);
        setProjectManagerContract(ProjectManagerContract);
        setProjectDataContract(ProjectDataContract);
        setProjectFactoryContract(ProjectFactoryContract);
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
        const ProjectManagerContract = new Contract(projectManager, projectManagerabi, signer);
        const ProjectDataContract = new Contract(projectData, projectDataabi, signer);
        const ProjectFactoryContract = new Contract(projectFactory, projectFactoryabi, signer);
        setProjectManagerContract(ProjectManagerContract);
        setProjectDataContract(ProjectDataContract);
        setProjectFactoryContract(ProjectFactoryContract);
      }
    } catch (error) {
      setError("Failed to connect wallet", error);
    }
  };
 

const createAndListProject = async (projectData) => {
  if (!isConnected || !projectFactoryContract) throw new Error("Wallet not connected or contracts not initialized");

  // List of required fields
  const requiredFields = [
    "mintPrice",
    "treasury",
    "defaultIsPermanent",
    "defaultValidity",
    "defaultVintage",
    "methodologyIndex",
    "location",
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
      methodologyIndex,
      location,
      emissionReductions,
      projectDetails,
    } = projectData;

    const mintPriceWei = parseEther(mintPrice.toString());
    const validity = BigInt(defaultValidity);
    const vintage = BigInt(defaultVintage);
    const methodology = Number(methodologyIndex); // uint8
    const emissionReductionsWei = BigInt(emissionReductions);

    const tx = await projectFactoryContract.createAndListProject(
      mintPriceWei,
      treasury,
      defaultIsPermanent,
      defaultValidity,
      defaultVintage,
      methodologyIndex,
      location,
      emissionReductions,
      projectDetails
    );
    return tx;
  } catch (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }
};

  const mintWithRUSD = async (projectAddress, amount) => {
    if (!isConnected || !signer) throw new Error("Wallet not connected");
    try {
      const bco2Contract = new Contract(projectAddress, bco2Abi, signer);
      const tx = await bco2Contract.mintWithRUSD(amount); // Adjust value if minting requires payment
      return tx
    } catch (error) {
      throw new Error(`Failed to mint: ${error.message}`);
    }
  };

  const getMintPrice = async (projectAddress) => {
  try {
    const bco2Contract = new Contract(
      projectAddress,
      bco2Abi,
      provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
    );
    const price = await bco2Contract.mintPrice();
    const priceInEther = formatEther(price);
    return priceInEther;
  } catch (error) {
    throw new Error(`Failed to fetch mint price: ${error.message}`);
  }
};

  const setTokenURI = async (projectAddress, nonRetiredURI, retiredURI) => {
    if (!isConnected || !signer) throw new Error("Wallet not connected");
    try {
      const bco2Contract = new Contract(projectAddress, bco2Abi, signer);
      const tx = await bco2Contract.setTokenURI(nonRetiredURI, retiredURI);
      return tx;
    } catch (error) {
      throw new Error(`Failed to set token URI: ${error.message}`);
    }
  };

  const getTokenURIs = async (projectAddress, tokenId = 1) => {
    try {
      const bco2Contract = new Contract(
        projectAddress,
        bco2Abi,
        provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
      );
      const uri = await bco2Contract.tokenURIs(tokenId);
      return uri;
    } catch (error) {
      throw new Error(`Failed to fetch tokenURIs: ${error.message}`);
    }
  };


const getDefaultIsPermanent = async (projectAddress) => {
  try {
    const bco2Contract = new Contract(
      projectAddress,
      bco2Abi,
      provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
    );
    const value = await bco2Contract.defaultIsPermanent();
    const decodedvalue = decodeBytes32String(value)
    return decodedvalue; // bytes32
  } catch (error) {
    throw new Error(`Failed to fetch defaultIsPermanent: ${error.message}`);
  }
};

const getDefaultValidity = async (projectAddress) => {
  try {
    const bco2Contract = new Contract(
      projectAddress,
      bco2Abi,
      provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
    );
    const value = await bco2Contract.defaultValidity();
    const decodedvalue = Number(toBigInt(value))
    return decodedvalue; // bytes32
  } catch (error) {
    throw new Error(`Failed to fetch defaultValidity: ${error.message}`);
  }
};

const getDefaultVintage = async (projectAddress) => {
  try {
    const bco2Contract = new Contract(
      projectAddress,
      bco2Abi,
      provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
    );
    const value = await bco2Contract.defaultVintage();
    const decodedvalue =  Number(toBigInt(value))
    return decodedvalue; 
  } catch (error) {
    throw new Error(`Failed to fetch defaultVintage: ${error.message}`);
  }
};

const getLocation = async (projectAddress) => {
  try {
    const bco2Contract = new Contract(
      projectAddress,
      bco2Abi,
      provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
    );
    const value = await bco2Contract.location();
    return value; // string
  } catch (error) {
    throw new Error(`Failed to fetch location: ${error.message}`);
  }
};

const getWalletRetrides = async (projectAddress) => {
  if (!isConnected || !userAddress) throw new Error("Wallet not connected or user address not set");
  try {
    const bco2Contract = new Contract(
      projectAddress,
      bco2Abi,
      provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
    );
    const value = await bco2Contract.walletRetired(userAddress);
    return value; // string
  } catch (error) {
    throw new Error(`Failed to fetch location: ${error.message}`);
  }
};

const getWalletMinted = async (projectAddress) => {
  if (!isConnected || !userAddress) throw new Error("Wallet not connected or user address not set");
  try {
    const bco2Contract = new Contract(
      projectAddress,
      bco2Abi,
      provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
    );
    const value = await bco2Contract.walletMinted(userAddress);
    return value; // string
  } catch (error) {
    throw new Error(`Failed to fetch location: ${error.message}`);
  }
};



const getTotalSupply = async (projectAddress) => {
  try {
    const bco2Contract = new Contract(
      projectAddress,
      bco2Abi,
      provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
    );
    const supply = await bco2Contract.totalSupply();
    const supplyEther = formatEther(supply);
    return supply;
  } catch (error) {
    throw new Error(`Failed to fetch total supply: ${error.message}`);
  }
};

const getTotalRetired = async (projectAddress) => {
  try {
    const bco2Contract = new Contract(
      projectAddress,
      bco2Abi,
      provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
    );
    const retired = await bco2Contract.totalRetired();
    return retired.toString();
  } catch (error) {
    throw new Error(`Failed to fetch total retired: ${error.message}`);
  }
};


  const approveRUSD = async (projectAddress) => {
        if (!isConnected || !signer) throw new Error("Wallet not connected");
        try {

          const MAX_UINT256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
        
          const rusdContract = new Contract(RUSD, ERC20Abi, signer);
        
          const tx = await rusdContract.approve(projectAddress, MAX_UINT256);
          return tx;
        } catch (error) {
          throw new Error(`Failed to approve RUSD: ${error.message}`);
        }
  };

  const getRUSDBalance = async (address = null) => {
  try {
    // Use provided address or default to current user's address
    const targetAddress = address || userAddress;
    
    if (!targetAddress) throw new Error("No address provided");
    
    // Create contract instance for RUSD token with read-only methods
    const rusdContract = new Contract(
      RUSD,
      ERC20Abi,
      provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
    );
    
    // Call balanceOf function to get token balance
    const balance = await rusdContract.balanceOf(targetAddress);
    const balanceInEther = formatEther(balance);
    return balanceInEther;
  } catch (error) {
    throw new Error(`Failed to fetch RUSD balance: ${error.message}`);
  }
};

  const checkRUSDAllowance = async (spenderAddress) => {
      if (!userAddress) throw new Error("User wallet not connected");
      try {
        // Create contract instance for RUSD token with read-only methods
        const rusdContract = new Contract(
          RUSD, 
          ERC20Abi,
          provider || new JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')
        );
        // Call allowance function to check how many tokens the spender is allowed to use
        const allowance = await rusdContract.allowance(userAddress, spenderAddress);
        return allowance.toString();
      } catch (error) {
        throw new Error(`Failed to check RUSD allowance: ${error.message}`);
      }
  };

  const retireCredits = async (projectAddress, amount) => {
    if (!isConnected || !signer) throw new Error("Wallet not connected");
    try {
      console.log("Retiring credits for project:", projectAddress, "Amount:", amount);
      const bco2Contract = new Contract(projectAddress, bco2Abi, signer);
      const tx = await bco2Contract.retire(amount);
      return tx
    } catch (error) {
      throw new Error(`Failed to retire credits: ${error.message}`);
    }
  };

  const transferCredits = async (projectAddress, to, amount) => {
    if (!isConnected || !signer) throw new Error("Wallet not connected");
    try {
      const bco2Contract = new Contract(projectAddress, bco2Abi, signer);
      const tx = await bco2Contract.safeTransferFrom(userAddress, to, 1, amount, '0x');
       return tx;
    } catch (error) {
      throw new Error(`Failed to transfer credits: ${error.message}`);
    }
  };

  const validateProject = async (projectAddress) => {
    if (!isConnected || !governance) throw new Error("Wallet not connected");
    try {
      const tx = await governance.validateProject(projectAddress);
      return tx;
    } catch (error) {
      throw new Error(`Failed to validate project: ${error.message}`);
    }
  };

  const verifyProject = async (projectAddress) => {
    if (!isConnected || !governance) throw new Error("Wallet not connected");
    try {
      const tx = await governance.verifyProject(projectAddress);
      return tx;
    } catch (error) {
      throw new Error(`Failed to verify project: ${error.message}`);
    }
  };

  const approveAndIssueCredits = async (projectAddress, creditAmount) => {
    if (!isConnected || !governance) throw new Error("Wallet not connected");
    try {
      const tx = await governance.approveAndIssueCredits(projectAddress, creditAmount);
      return tx;
    } catch (error) {
      throw new Error(`Failed to approve and issue credits: ${error.message}`);
    }
  };

  const rejectAndRemoveProject = async (projectAddress) => {
    if (!isConnected || !governance) throw new Error("Wallet not connected");
    try {
      const tx = await governance.rejectAndRemoveProject(projectAddress);
      // await fetch(`http://localhost:3001/api/transaction/${tx.hash}`);
      return tx;
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
      const tx = await governance.unpause();
      return tx;
    } catch (error) {
      throw new Error(`Failed to unpause contract: ${error.message}`);
    }
  };

  const addVVB = async (vvbAddress) => {
    if (!isConnected || !governance) throw new Error("Wallet not connected");
    try {
      const tx = await governance.addVVB(vvbAddress);
      return tx;
    } catch (error) {
      throw new Error(`Failed to add VVB: ${error.message}`);
    }
  };

  const removeVVB = async (vvbAddress) => {
    if (!isConnected || !governance) throw new Error("Wallet not connected");
    try {
      const tx = await governance.removeVVB(vvbAddress);
        return tx;
    } catch (error) {
      throw new Error(`Failed to remove VVB: ${error.message}`);
    }
  };

  // not using anymore
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

     //projectCounter
      const getProjectCounter = async () => {
      if (!projectDataContract) throw new Error("projectDataContract contract not initialized");
      try {
        const counter = await projectDataContract.projectCounter();
        return Number(counter);
      } catch (error) {
        throw new Error(`Failed to fetch project counter: ${error.message}`);
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
      const isVVB = await governance.authorizedVVBs(userAddress);
      return isVVB 
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
    if (!projectDataContract || !userAddress) return false;
    try {
      const owners = await projectDataContract.getAuthorizedProjectOwners(projectAddress);
      return owners.map(addr => addr.toLowerCase()).includes(userAddress.toLowerCase());
    } catch (error) {
      console.error('Error checking project owner status:', error);
      return false;
    }
  };

 const getListedProjects = async () => {
    if (!projectDataContract) throw new Error("projectDataContract contract not initialized");
  try {
    const projects = await projectDataContract.getListedProjects();
    const details = []
    for (const project of projects) {
      const detail = await getListedProjectDetails(project);
      details.push(detail);
    }
    return details
  } catch (error) {
    throw new Error(`Failed to fetch listed projects: ${error.message}`);
  }
};

const getUserProjects = async () => {
  try {
  if (!userAddress) throw new Error("User address not set");
  const projects = await getListedProjects();
  const userProjects = projects.filter(p => p.proposer?.toLowerCase() === userAddress.toLowerCase());
// const userProjects = projects.filter(p => p.proposer?.toLowerCase() === "0xBA43b24B591ac215337a55247cc7ACAcd744aD94".toLowerCase());
  for (const project of userProjects) {
    project.balance = await getUserBalance(project.projectContract);
  }
  return userProjects
  } catch (error) {
    throw new Error(`Failed to fetch user projects: ${error}`);
  }
};

const submitComment = async (projectContractAddress, comment) => {
  if (!isConnected || !projectManagerContract) throw new Error("Wallet not connected or contract not initialized");
  if (!projectContractAddress || typeof projectContractAddress !== "string" || !comment || typeof comment !== "string") {
    throw new Error("Invalid parameters: projectContractAddress and comment are required");
  }
  try {
    const tx = await projectManagerContract.submitComment(projectContractAddress, comment);
    return tx;
  } catch (error) {
    throw new Error(`Failed to submit comment: ${error.message}`);
  }
};

const getApprovedProjects = async () => {
  if (!projectDataContract) throw new Error("projectDataContract contract not initialized");
  try {
    const projects = await projectDataContract.getApprovedProjects();
    return projects;
  } catch (error) {
    throw new Error(`Failed to fetch approved projects: ${error.message}`);
  }
};

const getTotalIssuedCredits = async () => {
  if (!projectDataContract) throw new Error("projectDataContract contract not initialized");
  try {
    const approvedProjects = await projectDataContract.getApprovedProjects();
    let totalCredits = 0;
    for (const projectAddress of approvedProjects) {
      const details = await getListedProjectDetails(projectAddress);
      totalCredits += Number(details.credits);
    }
    return totalCredits;
  } catch (error) {
    throw new Error(`Failed to fetch total issued credits: ${error.message}`);
  }
};



const getListedProjectDetails = async (address) => {
  if (!projectDataContract) throw new Error("projectDataContract contract not initialized");
  try {
      const detail = await projectDataContract.getProjectDetails(address);
      const projectMintPrice = await getMintPrice(address);
      const projectTotalSupply = await getTotalSupply(address);
      const projectTotalRetired = await getTotalRetired(address);
      const defaultIsPermanent = await getDefaultIsPermanent(address);
      const defaultValidity = await getDefaultValidity(address);
      const defaultVintage = await getDefaultVintage(address);
      const location = await getLocation(address);
      const tokenUri = await getTokenURIs(address);
    return {
      projectContract: detail.projectContract,
      projectId: detail.projectId,
      certificateId: detail.certificateId,
      methodology: detail.methodology,
      emissionReductions: detail.emissionReductions,
      projectDetails: detail.projectDetails,
      proposer: detail.proposer,
      listingTimestamp: detail.listingTimestamp,
      commentPeriodEnd: detail.commentPeriodEnd,
      credits: detail.credits,
      comments: detail.comments,
      isValidated: detail.isValidated,
      isVerified: detail.isVerified,
      isApproved: detail.creditsIssued,
      prokectMintPrice: projectMintPrice,
      totalSupply: projectTotalSupply,
      totalRetired: projectTotalRetired,
      defaultIsPermanent: defaultIsPermanent,
      defaultValidity: defaultValidity,
      defaultVintage: defaultVintage,
      location: location,
      tokenUri: tokenUri,
    };
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
    mintWithRUSD,
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
    approveRUSD,
    checkRUSDAllowance,
    getProjectStats,
    getListedProjectDetails,
    getUserProjects,
    getListedProjects,
    checkAuthorizedVVB,
    getProjectCounter,
    getTotalIssuedCredits,
    submitComment,
    checkIsOwner,
    getWalletRetrides,
    getWalletMinted,
    setTokenURI,
    getTokenURIs,
    getOwner,
    checkIsProjectOwner,
    getUserBalance,
    getRUSDBalance,
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
