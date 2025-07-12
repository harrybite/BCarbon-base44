/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';

const ProjectStats = () => {
  const [stats, setStats] = useState({ totalProjects: 0, totalCredits: 0 });
    const {userAddress, getProjectCounter, getTotalIssuedCredits } = useContractInteraction();
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const totalProjects = await getProjectCounter();
        const totalCredits = await getTotalIssuedCredits();
        console.log("Total Projects:", totalProjects);
        console.log("Total Credits:", totalCredits);
        setStats({ totalProjects: totalProjects , totalCredits: totalCredits });
      } catch (error) {
        console.error('Error fetching stats:');
      }
    };
    fetchStats();
  }, [userAddress]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Platform Statistics</h2>
      <p>Total Projects: {stats.totalProjects}</p>
      <p>Total Credits Issued: {stats.totalCredits}</p>
    </div>
  );
};

export default ProjectStats;