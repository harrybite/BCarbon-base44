import { useState, useEffect } from 'react';

const ProjectStats = () => {
  const [stats, setStats] = useState({ totalProjects: 0, totalCredits: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/sync-projects');
        const projects = await response.json();
        const totalCredits = projects.projects?.reduce((sum, p) => sum + (p.creditAmount || 0), 0) || 0;
        setStats({ totalProjects: projects.projects?.length || 0, totalCredits });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Platform Statistics</h2>
      <p>Total Projects: {stats.totalProjects}</p>
      <p>Total Credits Issued: {stats.totalCredits}</p>
    </div>
  );
};

export default ProjectStats;