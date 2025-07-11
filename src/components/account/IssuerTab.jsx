/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import {useContractInteraction} from '../contract/ContractInteraction';
import CreateProjectTab from '../admin/CreateProjectTab';
import ProjectCard from '../projects/ProjectCard';

const IssuerTab = () => {
  const { userAddress, createAndListProject, checkIsProjectOwner } = useContractInteraction();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!userAddress) return;
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3001/api/sync-projects');
        const data = await response.json();
        const userProjects = await Promise.all(
          data.projects?.map(async (project) => {
            const isOwner = await checkIsProjectOwner(project.projectAddress);
            if (isOwner) {
              const response = await fetch(`http://localhost:3001/api/project/${project.projectAddress}?userAddress=${userAddress}`);
              const projectData = await response.json();
              return projectData;
            }
            return null;
          }) || []
        );
        setProjects(userProjects.filter(p => p));
      } catch (erro) {
        console.error('Error fetching projects:');
      }
      setLoading(false);
    };
    fetchProjects();
  }, [userAddress, checkIsProjectOwner]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Issuer Dashboard</h2>
      <CreateProjectTab createAndListProject={createAndListProject} />
      <h3 className="text-xl font-semibold mt-6">Your Projects</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <ProjectCard key={project.projectAddress} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default IssuerTab;