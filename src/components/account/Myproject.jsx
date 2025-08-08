/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import CreateProjectTab from '../admin/CreateProjectTab';
import ProjectCard from '../projects/ProjectCard';
import { useToast } from '../ui/use-toast';
import { useConnectWallet } from '@/context/walletcontext';
import { apihost, uriTokenOne, uriTokenThree, uriTokenTwo } from '../contract/address';
import { Loader2, Plus, Settings, Edit, RefreshCw } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';

const MyProjects = () => {
  const { getUserProjects, setTokenURI } = useContractInteraction();
  const { walletAddress } = useConnectWallet();
  const { toast } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [update, setUpdate] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [uriForm, setUriForm] = useState({ setUri: '', setKnownUri: '' });
  const [updateUriForm, setUpdateUriForm] = useState({ newUri: '' });
  const [selectedProject, setSelectedProject] = useState(null);
  const [submittingUri, setSubmittingUri] = useState(false);
  const [updatingUri, setUpdatingUri] = useState(false);
  const [isPresale, setIsPresale] = useState(false);
  const account = useActiveAccount()



  console.log("Wallet Address:", walletAddress);
  
  useEffect(() => {
    const fetchProjects = async () => {
      if (!walletAddress) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userProject = await fetch(`${apihost}/project/getuserprojects/${walletAddress}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await userProject.json();
         console.log('Fetched projects:', data.data);
        if (data.success) {
         
          setProjects(data.data || []);
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to fetch projects",
            variant: "destructive",
          });
          setProjects([]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error",
          description: "Failed to fetch projects. Please try again.",
          variant: "destructive",
        });
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [walletAddress, update]);

  // Initial URI setting modal functions
  const openModal = (project) => {
    setSelectedProject(project);
    setUriForm({ setUri: '', setKnownUri: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setUriForm({ setUri: '', setKnownUri: '' });
    setSelectedProject(null);
    setSubmittingUri(false);
  };

  // Update URI modal functions
  const openUpdateModal = (project) => {
    setSelectedProject(project);
    setUpdateUriForm({ newUri: uriTokenOne }); // Default to fixed URI
    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setUpdateUriForm({ newUri: '' });
    setSelectedProject(null);
    setUpdatingUri(false);
  };

  const handleUriChange = (e) => {
    const { name, value } = e.target;
    setUriForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateUriChange = (e) => {
    const { name, value } = e.target;
    setUpdateUriForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUriSave = async () => {
    setSubmittingUri(true);
    try {
      const tokenURI = isPresale ? uriTokenThree : uriTokenOne;
      console.log("Token URI:", tokenURI, isPresale);
      const receipt = await setTokenURI(
        selectedProject.projectContract,
        tokenURI,
        uriTokenTwo,
        account
      );
      
      if (receipt.status === 'success') {
        const response = await fetch(`${apihost}/project/updateprojectdetails/${selectedProject.projectContract}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        }); 
        const data = await response.json();
        if (data.success) {
          console.log('Project updated successfully:', data);
        }
        toast({
          title: "URI Set Successfully",
          description: `Token URI has been set successfully!`,
          variant: "default",
        });
        setUpdate(prev => prev + 1);
        closeModal();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error setting URI:', error);
      toast({
        title: "Error",
        description: `Failed to set token URI: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSubmittingUri(false);
    }
  };

  const handleUpdateUriSave = async () => {
    if (!selectedProject || !updateUriForm.newUri.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a valid URI",
        variant: "destructive",
      });
      return;
    }

    setUpdatingUri(true);
    try {
      // Get current retired URI from the project or use default
      const currentRetiredUri = uriTokenTwo;
      
      const receipt = await setTokenURI(
        selectedProject.projectContract,
        updateUriForm.newUri,
        currentRetiredUri,
        account
      );
      
      if (receipt.status === 'success') {
        // Update project details in database
        const response = await fetch(`${apihost}/project/updateprojectdetails/${selectedProject.projectContract}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        }); 
        const data = await response.json();
        if (data.success) {
          console.log('Project updated successfully:', data);
        }
        
        toast({
          title: "URI Updated Successfully",
          description: `Non-retired token URI has been updated successfully!`,
          variant: "default",
        });
        setUpdate(prev => prev + 1);
        closeUpdateModal();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error updating URI:', error);
      toast({
        title: "Error",
        description: `Failed to update token URI: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setUpdatingUri(false);
    }
  };

  if (!walletAddress) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600">Please connect your wallet to view your projects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Projects</h2>
        <p className="text-gray-600">Manage your carbon credit projects</p>
      </div>

      <div className="border-t-2 border-gray-200 mt-4 pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <span className="ml-2 text-gray-600">Loading your projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h3>
            <p className="text-gray-600">{"You haven't created any projects yet. Create your first project to get started."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {projects.map(project => (
              <div key={project.projectContract} className="relative">
                <ProjectCard project={project.projectContract} />
                <div className="mt-3 flex gap-2">
                  {!project.tokenUri  ? (
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors duration-200 flex items-center space-x-2"
                      onClick={() => {
                        openModal(project)
                        setIsPresale(project.isPresale);
                      }}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Set URI</span>
                    </button>
                  ) : project.isPresale ? (
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors duration-200 flex items-center space-x-2"
                      onClick={() => openUpdateModal(project)}
                    >
                      <Edit className="w-4 h-4" />
                      <span>Update URI</span>
                    </button>
                  ) : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Initial Set URI Modal */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-gray-900">Set Token URIs</h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure the metadata URIs for your project tokens
            </p>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Project: <span className="font-semibold">{selectedProject?.projectId || 'Unknown'}</span>
                </label>
              </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Non-Retired Token URI *
                </label>
                <input
                  type="text"
                  name="setUri"
                  value={isPresale ? uriTokenThree : uriTokenOne}
                  onChange={handleUriChange}
                  placeholder="https://example.com/metadata/active.json"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={true}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retired Token URI *
                </label>
                <input
                  type="text"
                  name="setKnownUri"
                  value={uriTokenTwo}
                  onChange={handleUriChange}
                  placeholder="https://example.com/metadata/retired.json"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={true}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                onClick={closeModal}
                disabled={submittingUri}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUriSave}
                disabled={submittingUri}
              >
                {submittingUri && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submittingUri ? 'Submitting...' : 'Set URI'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update URI Modal */}
      {showUpdateModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onClick={closeUpdateModal}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <span>Update Non-Retired Token URI</span>
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Update the metadata URI for your non-retired project tokens
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Project: <span className="font-semibold">{selectedProject?.projectId || 'Unknown'}</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Non-Retired Token URI *
                </label>
                <input
                  type="text"
                  name="newUri"
                  value={updateUriForm.newUri}
                  onChange={handleUpdateUriChange}
                  placeholder="https://example.com/metadata/updated.json"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will update only the non-retired token URI. Retired URI remains unchanged.
                </p>
              </div>
              
              {/* <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start space-x-2">
                  <RefreshCw className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-blue-800 font-medium">Default URI Applied</p>
                    <p className="text-xs text-blue-700">
                      The system will use the standard non-retired token URI by default.
                    </p>
                  </div>
                </div>
              </div> */}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                onClick={closeUpdateModal}
                disabled={updatingUri}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUpdateUriSave}
                disabled={updatingUri}
              >
                {updatingUri && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{updatingUri ? 'Updating...' : 'Update URI'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjects;