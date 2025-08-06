/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import CreateProjectTab from '../admin/CreateProjectTab';
import ProjectCard from '../projects/ProjectCard';
import { useToast } from '../ui/use-toast';
import { useConnectWallet } from '@/context/walletcontext';

const IssuerTab = () => {
  const { createAndListProject, getUserProjects, setTokenURI, isContractsInitised } = useContractInteraction();
  const { walletAddress } = useConnectWallet();
  const { toast } = useToast();


  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [update, setUpdate] = useState(0);



  const [showModal, setShowModal] = useState(false);
  const [uriForm, setUriForm] = useState({ setUri: '', setKnownUri: '' });
  const [selectedProject, setSelectedProject] = useState(null);



  useEffect(() => {
    const fetchProjects = async () => {

      setLoading(true);
      try {
        const userProjects = await getUserProjects();
        setProjects(userProjects);

      } catch (error) {
        console.error('Error fetching projects:', error);
      }
      setLoading(false);
    };

    if (walletAddress && isContractsInitised) {
      fetchProjects();
    }

  }, [walletAddress, update, isContractsInitised]);

  const openModal = (project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setUriForm({ field1: '', field2: '' });
    setSelectedProject(null);
  };

  const handleUriChange = (e) => {
    setUriForm({ ...uriForm, [e.target.name]: e.target.value });
  };

  const handleUriSave = async () => {
    if (!selectedProject) return;
    try {
      const tx = await setTokenURI(
        selectedProject.projectContract,
        uriForm.setUri,
        uriForm.setKnownUri
      );
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        toast({
          title: "URI Set Successfully",
          description: `Transaction successful!`,
          variant: "success",
        });
        setUpdate(update + 1);
      }
      closeModal();
    } catch (error) {
      // Optionally show an error message here
      console.error(error);
      // alert("Failed to set token URI: " + error.message);
      toast({
        title: "Error",
        description: `Failed to set token URI: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Issuer Dashboard</h2>
      <CreateProjectTab createAndListProject={createAndListProject}  setUpdate={setUpdate}/>
      <p className=' border-t-2 mt-4'></p>
    </div>
  );
};

export default IssuerTab;