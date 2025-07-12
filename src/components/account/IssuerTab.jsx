/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import CreateProjectTab from '../admin/CreateProjectTab';
import ProjectCard from '../projects/ProjectCard';

const IssuerTab = () => {
  const { userAddress, createAndListProject, getUserProjects, setTokenURI, } = useContractInteraction();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [update, setUpdate] = useState(0);
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [uriForm, setUriForm] = useState({ setUri: '', setKnownUri: '' });
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!userAddress) return;
      setLoading(true);
      try {
        const userProjects = await getUserProjects();
        setProjects(userProjects);

      } catch (erro) {
        console.error('Error fetching projects:');
      }
      setLoading(false);
    };
    fetchProjects();
  }, [userAddress, update]);

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
      uriForm.setKnownUri,
      uriForm.setUri
    );
    const receipt = await tx.wait();
    if (receipt.status === 1) {
setUpdate(update + 1);
    }
    closeModal();
  } catch (error) {
    // Optionally show an error message here
    console.error(error);
    alert("Failed to set token URI: " + error.message);
  }
};

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Issuer Dashboard</h2>
      <CreateProjectTab createAndListProject={createAndListProject} />
      <p className=' border-t-2 mt-4'></p>
      {projects.length > 0 ? <h3 className="text-xl text-center font-semibold mt-6 mb-3">Your Projects</h3> : ''}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {projects.map(project => (
            <div key={project.projectContract}>
              <ProjectCard project={project.projectContract} />
             {!project.tokenUri && <button
                className="bg-green-500 text-white px-4 py-2 rounded mr-2 mt-3"
                onClick={() => openModal(project)}
              >
                Set URI
              </button>}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
    {showModal && (
  <div
    className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40"
    onClick={closeModal} // Close when clicking the overlay
  >
    <div
      className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg"
      onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
    >
      <h2 className="text-xl font-bold mb-4">Set URI</h2>
      <div className="mb-4">
        <label className="block mb-1">Non Retired URI</label>
        <input
          type="text"
          name="setUri"
          value={uriForm.setUri}
          onChange={handleUriChange}
          className="w-full border rounded px-2 py-1"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Retired URI</label>
        <input
          type="text"
          name="setKnownUri"
          value={uriForm.setKnownUri}
          onChange={handleUriChange}
          className="w-full border rounded px-2 py-1"
        />
      </div>
      <div className="flex justify-end">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleUriSave}
        >
          Submit URI
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default IssuerTab;