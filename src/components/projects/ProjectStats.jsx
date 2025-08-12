/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import { apihost } from '../contract/address';
import { TrendingUp, FileText, Award, RefreshCw, BarChart3 } from 'lucide-react';

const ProjectStats = () => {
  const [stats, setStats] = useState({ 
    totalProjects: 0, 
    totalCredits: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userAddress } = useContractInteraction();

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apihost}/project/gettotalprojectscount`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStats({
          totalProjects: data.totalProjects || 0,
          totalCredits: data.totalCredits || 0,
        });
      } else {
        throw new Error(data.message || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.message);
      // Keep existing stats on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userAddress]);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const handleRefresh = () => {
    fetchStats();
  };

  if (loading && stats.totalProjects === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Platform Statistics</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loading skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 shadow-lg mb-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Statistics</h2>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium text-gray-700">
            {loading ? 'Updating...' : 'Refresh'}
          </span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <span className="font-medium">Error:</span> {error}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Projects Card */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(stats.totalProjects)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Projects registered on platform
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Credits Card */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Credits Issued</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(stats.totalCredits)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                tCO₂ credits across all projects
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      {/* <div className="mt-6 p-4 bg-white bg-opacity-60 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>
            Statistics are updated in real-time from the blockchain and database
          </span>
        </div>
      </div> */}
    </div>
  );
};

export default ProjectStats;