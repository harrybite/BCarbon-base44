/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { BrowserProvider, Contract, decodeBytes32String, formatEther, JsonRpcProvider, parseEther, toBigInt } from 'ethers';
import governanceAbi from './Governance.json';
import ERC20Abi from './ERC20.json';
import projectFactoryabi from './ProjectFactory.json';
import projectManagerabi from './ProjectManager.json';
import projectDataabi from './ProjectData.json';
import bco2Abi from './BCO2.json';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { apihost, chainInfo, GOVERNANCE_ADDRESS, MARKETPLACE_ADDRESS, projectData, projectFactory, projectManager, RUSD } from './address';
import { useConnectWallet } from '@/context/walletcontext';
import { bscTestnet } from 'thirdweb/chains';
import { thirdwebclient } from '@/thirwebClient';
import { getContract, prepareContractCall, sendAndConfirmTransaction } from 'thirdweb';


export const useContractInteraction = () => {

  const [isContractsInitised, setIsContractsInitised] = useState(false);
  const { walletAddress: userAddress, setWalletAddress: setUserAddress } = useConnectWallet();

  const thridWebERC20Contract = getContract({
    client: thirdwebclient,
    chain: bscTestnet,
    address: RUSD,
    abi: ERC20Abi,
  });

  const thirdWebBCO2Contract = (address) =>
    getContract({
      client: thirdwebclient,
      chain: bscTestnet,
      address, // pass the BCO2 contract address here
      abi: bco2Abi,
    });

  // Governance contract instance
  const thirdWebGovernanceContract = getContract({
    client: thirdwebclient,
    chain: bscTestnet,
    address: GOVERNANCE_ADDRESS,
    abi: governanceAbi,
  });


  // Project Factory contract instance
  const thirdWebProjectFactoryContract = getContract({
    client: thirdwebclient,
    chain: bscTestnet,
    address: projectFactory,
    abi: projectFactoryabi,
  });

  // Project Manager contract instance
  const thirdWebProjectManagerContract = getContract({
    client: thirdwebclient,
    chain: bscTestnet,
    address: projectManager,
    abi: projectManagerabi,
  });

  // Project Data contract instance
  const thirdWebProjectDataContract = getContract({
    client: thirdwebclient,
    chain: bscTestnet,
    address: projectData,
    abi: projectDataabi,
  });


  const getProvider = () => {
    return new JsonRpcProvider(chainInfo.rpc);
  };

  const getGovernanceContract = async (withSigner = false) => {
    const provider = getProvider();
    if (withSigner) {
      // writing operations require a signer
      const signer = await provider.getSigner();
      return new Contract(GOVERNANCE_ADDRESS, governanceAbi, signer);
    }
    // reading operations can use the provider directly
    return new Contract(GOVERNANCE_ADDRESS, governanceAbi, provider);
  };

  const getProjectManagerContract = async (withSigner = false) => {
    const provider = getProvider();
    if (withSigner) {
      // writing operations require a signer
      const signer = await provider.getSigner();
      return new Contract(projectManager, projectManagerabi, signer);
    }
    // reading operations can use the provider directly
    return new Contract(projectManager, projectManagerabi, provider);
  };

  const getProjectDataContract = async (withSigner = false) => {
    const provider = getProvider();
    if (withSigner) {
      // writing operations require a signer
      const signer = await provider.getSigner();
      return new Contract(projectData, projectDataabi, signer);
    }
    // reading operations can use the provider directly
    return new Contract(projectData, projectDataabi, provider);
  };

  const getProjectFactoryContract = async (withSigner = false) => {
    const provider = getProvider();
    if (withSigner) {
      // writing operations require a signer
      const signer = await provider.getSigner();
      return new Contract(projectFactory, projectFactoryabi, signer);
    }
    // reading operations can use the provider directly
    return new Contract(projectFactory, projectFactoryabi, provider);
  };

  const getBCO2Contract = async (address, withSigner = false) => {
    const provider = getProvider();
    if (withSigner) {
      // writing operations require a signer
      const signer = await provider.getSigner();
      return new Contract(address, bco2Abi, signer);
    }
    // reading operations can use the provider directly
    return new Contract(address, bco2Abi, provider);
  };

  const getERC20Contract = async (address, withSigner = false) => {
    const provider = getProvider();
    if (withSigner) {
      const signer = await provider.getSigner();
      return new Contract(address, ERC20Abi, signer);
    }
    // reading operations can use the provider directly
    return new Contract(address, ERC20Abi, provider);
  };




  const createAndListProject = async (projectData, account) => {
    if (!account) throw new Error("Account is required to create and list project");

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

      console.log("Creating project with data:", mintPriceWei, projectData)
      // Use thirdweb contract instance and transaction flow
      const transaction = prepareContractCall({
        contract: thirdWebProjectFactoryContract,
        method: "createAndListProject",
        params: [
          mintPriceWei,
          treasury,
          defaultIsPermanent,
          defaultValidity,
          defaultVintage,
          methodologyIndex,
          location,
          emissionReductions,
          projectDetails
        ],
      });

      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });

      return transactionReceipt;
    } catch (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }
  };

  const mintWithRUSD = async (projectAddress, amount, account) => {
    if (!account) throw new Error("Account is required to set token URI");
    try {
      const bco2Contract = thirdWebBCO2Contract(projectAddress);
      const transaction = prepareContractCall({
        contract: bco2Contract,
        method: "mintWithRUSD",
        params: [amount],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      throw new Error(`Failed to mint: ${error.message}`);
    }
  };

  const getMintPrice = async (projectAddress) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const price = await bco2Contract.mintPrice();
      const priceInEther = formatEther(price);
      return priceInEther;
    } catch (error) {
      throw new Error(`Failed to fetch mint price: ${error.message}`);
    }
  };

  const getCurrentBalance = async (projectAddress, tokenId) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const balance = await bco2Contract.balanceOf(userAddress, tokenId);

      return balance;
    } catch (error) {
      throw new Error(`Failed to fetch mint price: ${error.message}`);
    }
  };

const getUserApproveProjectBalance = async (address, page = 1, limit = 10) => {
  try {
    const response = await fetch(`${apihost}/user/nfts/${address}?page=${page}&limit=${limit}`);
    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to fetch NFTs');
    }
    
    const approvedProjects = data.nfts || [];
    const pagination = data.pagination || {};
    const nfts = [];
    
    for (const project of approvedProjects) {
      const bco2Contract = await getBCO2Contract(project.projectContract, false);
      
      if (Number(project.tokenId) === 1) {
        let tokenURI = await getTokenURIs(project.projectContract, 1);
        const balanceminted = await bco2Contract.balanceOf(userAddress, 1);
        
        if (tokenURI && tokenURI !== "") {
          tokenURI = tokenURI?.replace(/^"|"$/g, "");
          try {
            const response = await fetch(tokenURI);
            const metadata = await response.json();
            nfts.push({
              projectContract: project.projectContract,
              balanceMinted: balanceminted.toString(),
              tokenId: project.tokenId,
              certificateId: project.certificateId,
              projectID: project.projectID,
              metadata: metadata,
              tokenURI: tokenURI
            });
          } catch (metadataError) {
            console.error('Error fetching metadata:', metadataError);
            // Add project without metadata if URI fetch fails
            nfts.push({
              projectContract: project.projectContract,
              balanceMinted: balanceminted.toString(),
              tokenId: project.tokenId,
              certificateId: project.certificateId,
              projectID: project.projectID,
              metadata: { name: 'Unknown Project', description: 'Metadata unavailable' },
              tokenURI: tokenURI
            });
          }
        }
      }
      
      if (Number(project.tokenId) === 2) {
        let tokenURI = await getTokenURIs(project.projectContract, 2);
        const balanceRetired = await bco2Contract.balanceOf(userAddress, 2);
        
        if (tokenURI && tokenURI !== "") {
          tokenURI = tokenURI?.replace(/^"|"$/g, "");
          try {
            const response = await fetch(tokenURI);
            const metadata = await response.json();
            nfts.push({
              projectContract: project.projectContract,
              balanceRetired: balanceRetired.toString(),
              tokenId: project.tokenId,
              certificateId: project.certificateId,
              projectID: project.projectID,
              metadata: metadata,
              tokenURI: tokenURI
            });
          } catch (metadataError) {
            console.error('Error fetching metadata:', metadataError);
            // Add project without metadata if URI fetch fails
            nfts.push({
              projectContract: project.projectContract,
              balanceRetired: balanceRetired.toString(),
              tokenId: project.tokenId,
              certificateId: project.certificateId,
              projectID: project.projectID,
              metadata: { name: 'Unknown Project', description: 'Metadata unavailable' },
              tokenURI: tokenURI
            });
          }
        }
      }
    }
    
    return {
      nfts,
      pagination
    };
  } catch (err) {
    console.error("Error fetching user approved project balance:", err);
    throw new Error(`Failed to fetch user approved project balance: ${err.message}`);
  }
};




  const setTokenURI = async (projectAddress, nonRetiredURI, retiredURI, account) => {
    if (!account) throw new Error("Account is required to set token URI");
    try {
      const bco2Contract = thirdWebBCO2Contract(projectAddress);
      const transaction = prepareContractCall({
        contract: bco2Contract,
        method: "setTokenURI",
        params: [nonRetiredURI, retiredURI],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      throw new Error(`Failed to set token URI: ${error.message}`);
    }
  };

  const getTokenURIs = async (projectAddress, tokenId = 1) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const uri = await bco2Contract.tokenURIs(tokenId);
      return uri;
    } catch (error) {
      throw new Error(`Failed to fetch tokenURIs: ${error.message}`);
    }
  };

  const getRetiredTokenURIs = async (projectAddress, tokenId = 2) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const uri = await bco2Contract.uri(tokenId);

      return uri;
    } catch (error) {
      throw new Error(`Failed to fetch retiredTokenURIs: ${error.message}`);
    }
  };


  const getDefaultIsPermanent = async (projectAddress) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const value = await bco2Contract.defaultIsPermanent();
      const decodedvalue = decodeBytes32String(value)
      return decodedvalue; // bytes32
    } catch (error) {
      throw new Error(`Failed to fetch defaultIsPermanent: ${error.message}`);
    }
  };

  const isApproveForAll = async (projectAddress, account) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const value = await bco2Contract.isApprovedForAll(account, MARKETPLACE_ADDRESS);
      return value;
    } catch (error) {
      throw new Error(`Failed to fetch defaultIsPermanent: ${error.message}`);
    }
  };

  // create approve for all function using thirdweb
  const setApprovalForAll = async (projectAddress, account) => {
    if (!account) throw new Error("Account is required to set approval for all");
    try {
      const bco2Contract = thirdWebBCO2Contract(projectAddress);
      const transaction = prepareContractCall({
        contract: bco2Contract,
        method: "setApprovalForAll",
        params: [MARKETPLACE_ADDRESS, true],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account, // account object from thirdweb
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      throw new Error(`Failed to set approval for all: ${error.message}`);
    }
  };

  const getDefaultValidity = async (projectAddress) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const value = await bco2Contract.defaultValidity();
      const decodedvalue = Number(toBigInt(value))
      return decodedvalue; // bytes32
    } catch (error) {
      throw new Error(`Failed to fetch defaultValidity: ${error.message}`);
    }
  };

  const getDefaultVintage = async (projectAddress) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const value = await bco2Contract.defaultVintage();
      const decodedvalue = Number(toBigInt(value))
      return decodedvalue;
    } catch (error) {
      throw new Error(`Failed to fetch defaultVintage: ${error.message}`);
    }
  };

  const getLocation = async (projectAddress) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const value = await bco2Contract.location();
      return value; // string
    } catch (error) {
      throw new Error(`Failed to fetch location: ${error.message}`);
    }
  };

  const getWalletRetrides = async (projectAddress) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const value = await bco2Contract.walletRetired(userAddress);
      return value;
    } catch (error) {
      throw new Error(`Failed to fetch location: ${error.message}`);
    }
  };

  const getWalletMinted = async (projectAddress) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const value = await bco2Contract.walletMinted(userAddress);
      return value; // string
    } catch (error) {
      throw new Error(`Failed to fetch location: ${error.message}`);
    }
  };

  const getRetirementCertificates = async (projectAddress) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const count = await bco2Contract.getRetirementCertificateCount(userAddress);
      const certificates = [];
      for (let i = 0; i < count; i++) {
        const cert = await bco2Contract.userRetirementCertificates(userAddress, i);
        certificates.push({
          certificateId: cert.certificateId,
          owner: cert.owner,
          tonnesRetired: cert.tonnesRetired?.toString?.() ?? "",
          retireTimestamp: cert.retireTimestamp?.toString?.() ?? ""
        });
      }
      return certificates.reverse(); // Array of { projectAddress, certificateId, owner, tonnesRetired, retireTimestamp }
    } catch (error) {
      throw new Error(`Failed to fetch retirement certificates: ${error.message}`);
    }
  };

  const getRetirementCertificatesForAllProject = async () => {

    try {
      const approvedProjects = await getApprovedProjects();
      const grouped = [];
      for (const project of approvedProjects) {
        const certificates = await getRetirementCertificates(project);
        if (certificates.length === 0) continue; // Skip if no certificates
        grouped.push({ projectAddress: project, certificates });
      }
      return grouped.reverse(); // Array of { projectAddress, certificates: [...] }
    } catch (error) {
      throw new Error(`Failed to fetch retirement certificates: ${error.message}`);
    }
  };


  const validateRetirementCertificate = async (projectAddress, account, certificateIndex, certificateHash) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);

      const [isValidCert, tonnesRetired] = await bco2Contract.validateRetirementCertificate(
        account,
        certificateIndex,
        certificateHash
      );
      console.log("Validation result:", isValidCert, tonnesRetired);
      return { isValidCert, tonnesRetired };
    } catch (error) {
      throw new Error(`Failed to validate retirement certificate: ${error.message}`);
    }
  };


  const getTotalSupply = async (projectAddress) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const supply = await bco2Contract.totalSupply();
      const supplyEther = formatEther(supply);
      return supply;
    } catch (error) {
      throw new Error(`Failed to fetch total supply: ${error.message}`);
    }
  };

  const getTotalRetired = async (projectAddress) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const retired = await bco2Contract.totalRetired();
      return retired.toString();
    } catch (error) {
      throw new Error(`Failed to fetch total retired: ${error.message}`);
    }
  };


  const approveRUSD = async (projectAddress, account) => {

    try {
      const MAX_UINT256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      const transaction = prepareContractCall({
        contract: thridWebERC20Contract,
        method: "approve",
        params: [projectAddress, MAX_UINT256],

      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt
    } catch (error) {
      console.error("Error approving RUSD:", error);
      // throw new Error(`Failed to approve RUSD: ${error.message}`);
    }
  };

  const getRUSDBalance = async (address = null) => {
    try {
      const targetAddress = address || userAddress;
      if (!targetAddress) throw new Error("No address provided");
      const rusdContract = await getERC20Contract(RUSD, false);

      const balance = await rusdContract.balanceOf(targetAddress)

      const balanceInEther = formatEther(balance);
      return balanceInEther;
    } catch (error) {
      console.error("Error fetching RUSD balance:", error);
      // throw new Error(`Failed to fetch RUSD balance: ${error.message}`);
    }
  };

  const checkRUSDAllowance = async (spenderAddress) => {
    try {
      // Create contract instance for RUSD token with read-only methods
      const rusdContract = await getERC20Contract(RUSD, false);
      // Call allowance function to check how many tokens the spender is allowed to use
      const allowance = await rusdContract.allowance(userAddress, spenderAddress);
      return allowance.toString();
    } catch (error) {
      console.error("Error checking RUSD allowance:", error);
      // throw new Error(`Failed to check RUSD allowance: ${error.message}`);
    }
  };

  const retireCredits = async (projectAddress, amount, account) => {
    if (!account) throw new Error("Account is required to retire credits");
    try {
      const bco2Contract = thirdWebBCO2Contract(projectAddress);
      const transaction = prepareContractCall({
        contract: bco2Contract,
        method: "retire",
        params: [amount],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account, // thirdweb account object
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      throw new Error(`Failed to retire credits: ${error.message}`);
    }
  };

  const transferCredits = async (projectAddress, to, amount, account) => {
    if (!account) throw new Error("Account is required to transfer credits");
    try {
      const bco2Contract = thirdWebBCO2Contract(projectAddress);
      const transaction = prepareContractCall({
        contract: bco2Contract,
        method: "safeTransferFrom",
        params: [userAddress, to, 1, amount, '0x'],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account, // thirdweb account object
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      throw new Error(`Failed to transfer credits: ${error.message}`);
    }
  };

  const validateProject = async (projectAddress, account) => {
    if (!account) throw new Error("Account is required to validate project");
    try {
      const transaction = prepareContractCall({
        contract: thirdWebGovernanceContract,
        method: "validateProject",
        params: [projectAddress],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      throw new Error(`Failed to validate project: ${error.message}`);
    }
  };

  const verifyProject = async (projectAddress, account) => {
    if (!account) throw new Error("Account is required to verify project");
    try {
      const transaction = prepareContractCall({
        contract: thirdWebGovernanceContract,
        method: "verifyProject",
        params: [projectAddress],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      throw new Error(`Failed to verify project: ${error.message}`);
    }
  };

  const approveAndIssueCredits = async (projectAddress, creditAmount, account) => {
    if (!account) throw new Error("Account is required to approve and issue credits");
    try {
      const transaction = prepareContractCall({
        contract: thirdWebGovernanceContract,
        method: "approveAndIssueCredits",
        params: [projectAddress, creditAmount],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      console.error("Error approving and issuing credits:", error);
      throw new Error(`Failed to approve and issue credits: ${error.message}`);
    }
  };

  const rejectAndRemoveProject = async (projectAddress, account) => {
    if (!account) throw new Error("Account is required to reject and remove project");
    try {
      const transaction = prepareContractCall({
        contract: thirdWebGovernanceContract,
        method: "rejectAndRemoveProject",
        params: [projectAddress],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      console.error("Error rejecting project:", error);
      throw new Error(`Failed to reject project: ${error.message}`);
    }
  };

  const pauseContract = async (account) => {
    if (!account) throw new Error("Account is required to pause contract");
    try {
      const transaction = prepareContractCall({
        contract: thirdWebGovernanceContract,
        method: "pause",
        params: [],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      console.error("Error pausing contract:", error);
      throw new Error(`Failed to pause contract: ${error.message}`);
    }
  };


  const unpauseContract = async (account) => {
    if (!account) throw new Error("Account is required to unpause contract");
    try {
      const transaction = prepareContractCall({
        contract: thirdWebGovernanceContract,
        method: "unpause",
        params: [],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      console.error("Error unpausing contract:", error);
      throw new Error(`Failed to unpause contract: ${error.message}`);
    }
  };

  const addVVB = async (vvbAddress, account) => {
    if (!account) throw new Error("Account is required to add VVB");
    try {
      const transaction = prepareContractCall({
        contract: thirdWebGovernanceContract,
        method: "addVVB",
        params: [vvbAddress],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      console.error("Error adding VVB:", error);
      throw new Error(`Failed to add VVB: ${error.message}`);
    }
  };
  const removeVVB = async (vvbAddress, account) => {
    if (!account) throw new Error("Account is required to remove VVB");
    try {
      const transaction = prepareContractCall({
        contract: thirdWebGovernanceContract,
        method: "removeVVB",
        params: [vvbAddress],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      console.error("Error removing VVB:", error);
      throw new Error(`Failed to remove VVB: ${error.message}`);
    }
  };



  //projectCounter
  const getProjectCounter = async () => {
    try {
      const projectDataContract = await getProjectDataContract(false);
      const counter = await projectDataContract.projectCounter();
      return Number(counter);
    } catch (error) {
      console.error("Error fetching project counter:", error);
      // throw new Error(`Failed to fetch project counter: ${error.message}`);
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
      const governance = await getGovernanceContract(false);
      const isVVB = await governance.authorizedVVBs(userAddress);
      return isVVB
    } catch (error) {
      console.log('Error checking VVB status:', error);
    }
  };

  const checkIsOwner = async () => {
    try {
      const governance = await getGovernanceContract(false);
      const owner = await governance.owner();
      console.log("Owner address:", owner);
      return userAddress.toLowerCase() === owner.toLowerCase();
    } catch (error) {
      console.error('Error checking owner status:', error);
    }
  };

  const getOwner = async () => {
    try {
      const governance = await getGovernanceContract(false);
      const owner = await governance.owner();
      return owner
    } catch (error) {
      console.error('Error checking owner status:', error);
    }
  };

  const checkIsProjectOwner = async (projectAddress) => {
    try {
      const projectDataContract = await getProjectDataContract(false);
      console.log("Project address:", projectAddress);
      const owners = await projectDataContract.getAuthorizedProjectOwners(projectAddress);
      return owners.map(addr => addr.toLowerCase()).includes(userAddress.toLowerCase());
    } catch (error) {
      console.log('Error checking project owner status:', error);
    }
  };

  const getListedProjects = async () => {
    try {
      const projectDataContract = await getProjectDataContract(false);
      const projects = await projectDataContract.getListedProjects();
      const details = [];
      for (const project of projects) {
        const detail = await getListedProjectDetails(project);
        console.log("Project detail:", detail);
        details.push(detail);
      }
      return details.reverse(); // Reverse to show latest first
    } catch (error) {
      console.log('Error fetching listed projects:', error);
      throw new Error(`Failed to fetch listed projects: ${error.message}`);
    }
  };

  const getUserProjects = async () => {
    try {
      if (!userAddress) throw new Error("User address not set");
      const projects = await getListedProjects();
      const userProjects = projects.filter(p => p.proposer?.toLowerCase() === userAddress.toLowerCase());
      for (const project of userProjects) {
        project.balance = await getUserBalance(project.projectContract);
      }
      return userProjects
    } catch (error) {
      throw new Error(`Failed to fetch user projects: ${error}`);
    }
  };

  const submitComment = async (projectContractAddress, comment, account) => {
    if (
      !projectContractAddress ||
      typeof projectContractAddress !== "string" ||
      !comment ||
      typeof comment !== "string"
    ) {
      throw new Error("Invalid parameters: projectContractAddress and comment are required");
    }
    if (!account) throw new Error("Account is required to submit comment");
    try {
      const transaction = prepareContractCall({
        contract: thirdWebProjectManagerContract,
        method: "submitComment",
        params: [projectContractAddress, comment],
      });
      const transactionReceipt = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      return transactionReceipt;
    } catch (error) {
      throw new Error(`Failed to submit comment: ${error.message}`);
    }
  };
  const getApprovedProjects = async () => {
    try {
      const projectDataContract = await getProjectDataContract(false);
      const projects = await projectDataContract.getApprovedProjects();
      return projects;
    } catch (error) {
      throw new Error(`Failed to fetch approved projects: ${error.message}`);
    }
  };

  const getTotalIssuedCredits = async () => {
    try {
      const projectDataContract = await getProjectDataContract(false);
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
    try {
      const projectDataContract = await getProjectDataContract(false);
      const detail = await projectDataContract.getProjectDetails(address);
      const projectMintPrice = await getMintPrice(address);
      const projectTotalSupply = await getTotalSupply(address);
      const projectTotalRetired = await getTotalRetired(address);
      const defaultIsPermanent = await getDefaultIsPermanent(address);
      const defaultValidity = await getDefaultValidity(address);
      const defaultVintage = await getDefaultVintage(address);
      const location = await getLocation(address);
      const tokenUri = await getTokenURIs(address);
      const retiredTokenUri = await getRetiredTokenURIs(address);
      return {
        projectContract: detail.projectContract,
        projectId: detail.projectId,
        certificateId: detail.certificateId,
        methodology: detail.methodology,
        emissionReductions: Number(detail.emissionReductions),
        projectDetails: detail.projectDetails,
        proposer: detail.proposer,
        listingTimestamp: detail.listingTimestamp,
        commentPeriodEnd: detail.commentPeriodEnd,
        credits: Number(detail.credits),
        comments: detail.comments,
        isValidated: detail.isValidated,
        isVerified: detail.isVerified,
        isApproved: Number(detail.credits) ? true : false,
        prokectMintPrice: projectMintPrice,
        totalSupply: projectTotalSupply,
        totalRetired: projectTotalRetired,
        defaultIsPermanent: defaultIsPermanent,
        defaultValidity: defaultValidity,
        defaultVintage: defaultVintage,
        location: location,
        tokenUri: tokenUri,
        retiredTokenUri: retiredTokenUri,
      };
    } catch (error) {
      console.log('Error fetching project details:', error);
      throw new Error(`Failed to fetch project details: ${error.message}`);
    }
  };

  const getUserBalance = async (projectAddress, tokenId = 1) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const balance = await bco2Contract.balanceOf(userAddress, tokenId);
      return balance.toString();
    } catch (error) {
      throw new Error(`Failed to fetch user balance: ${error.message}`);
    }
  };

  const getTokenURI = async (projectAddress, tokenId = 1) => {
    try {
      const bco2Contract = await getBCO2Contract(projectAddress, false);
      const uri = await bco2Contract.uri(tokenId);
      return uri;
    } catch (error) {
      throw new Error(`Failed to fetch token URI: ${error.message}`);
    }
  };

  return {
    userAddress,
    setUserAddress,
    isContractsInitised,
    createAndListProject,
    isApproveForAll,
    setApprovalForAll,
    mintWithRUSD,
    getCurrentBalance,
    retireCredits,
    transferCredits,
    validateProject,
    verifyProject,
    approveAndIssueCredits,
    rejectAndRemoveProject,
    pauseContract,
    unpauseContract,
    addVVB,
    getRetirementCertificates,
    validateRetirementCertificate,
    getRetirementCertificatesForAllProject,
    removeVVB,

    approveRUSD,
    checkRUSDAllowance,
    getProjectStats,
    getListedProjectDetails,
    getUserProjects,
    getListedProjects,
    checkAuthorizedVVB,
    getProjectCounter,
    getTotalIssuedCredits,
    getUserApproveProjectBalance,
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
