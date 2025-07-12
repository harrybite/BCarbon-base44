/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import {useContractInteraction} from '../contract/ContractInteraction';
import CreateProjectTab from '../admin/CreateProjectTab';
import ProjectCard from '../projects/ProjectCard';

const IssuerTab = () => {
  const { userAddress, createAndListProject, getUserProjects } = useContractInteraction();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!userAddress) return;
      setLoading(true);
      try {
        const userProjects = await getUserProjects();
        console.log("User Projects:", userProjects);
        setProjects(userProjects);
      } catch (erro) {
        console.error('Error fetching projects:');
      }
      setLoading(false);
    };
    fetchProjects();
  }, [userAddress]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Issuer Dashboard</h2>
      <CreateProjectTab createAndListProject={createAndListProject} />
      {projects.length > 0 ? <h3 className="text-xl font-semibold mt-6">Your Projects</h3> : ''}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <ProjectCard key={project.projectContract} project={project.projectContract}/>
          ))}
        </div>
      )}
    </div>
  );
};

export default IssuerTab;