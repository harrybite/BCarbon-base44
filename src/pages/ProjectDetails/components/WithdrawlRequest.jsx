/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Calendar,
  FileText,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apihost } from '@/components/contract/address';

const WithdrawalRequests = ({ 
  withdrawalRequests: initialRequests, 
  isLoading: initialLoading, 
  projectContract, 
  project 
}) => {
  const [requests, setRequests] = useState(initialRequests || []);
  const [isLoading, setIsLoading] = useState(initialLoading || false);
  const [filter, setFilter] = useState('all'); // all, active, approved, rejected
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Update requests when props change
  useEffect(() => {
    setRequests(initialRequests || []);
    setIsLoading(initialLoading || false);
  }, [initialRequests, initialLoading]);

  // Refresh withdrawal requests
  const refreshRequests = async () => {
    if (!projectContract) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(`${apihost}/project/getprojectwithdrawalrequests/${projectContract}?activeOnly=false`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.withdrawalRequests || []);
      }
    } catch (error) {
      console.error("Error refreshing withdrawal requests:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Get status configuration
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'active':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-4 h-4" />,
          text: 'Pending'
        };
      case 'approved':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle2 className="w-4 h-4" />,
          text: 'Approved'
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircle className="w-4 h-4" />,
          text: 'Rejected'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Unknown'
        };
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  // Format amount
  const formatAmount = (amount) => {
    if (!amount) return '0';
    return Number(amount).toLocaleString();
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    if (filter === 'active') return request.isActive;
    if (filter === 'approved') return !request.isActive && request.status?.toLowerCase() === 'approved';
    if (filter === 'rejected') return !request.isActive && request.status?.toLowerCase() === 'rejected';
    return true;
  });

  // Get summary stats
  const getSummaryStats = () => {
    const total = requests.length;
    const active = requests.filter(r => r.isActive).length;
    const approved = requests.filter(r => !r.isActive && r.status?.toLowerCase() === 'approved').length;
    const rejected = requests.filter(r => !r.isActive && r.status?.toLowerCase() === 'rejected').length;
    const totalAmount = requests.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    
    return { total, active, approved, rejected, totalAmount };
  };

  const stats = getSummaryStats();

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Withdrawal Requests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Withdrawal Requests</span>
            <Badge variant="outline" className="ml-2">
              {stats.total}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshRequests}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
  
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Summary Stats */}
        {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
            <div className="text-sm text-blue-600">Total Requests</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-700">{stats.active}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
            <div className="text-sm text-green-600">Approved</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
            <div className="text-sm text-red-600">Rejected</div>
          </div>
        </div> */}

        {/* Total Amount */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Total Requested Amount</span>
            </div>
            <div className="text-xl font-bold text-green-700">
              {formatAmount(stats.totalAmount)} RUSD
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        {/* <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'all', label: 'All', count: stats.total },
            { key: 'active', label: 'Pending', count: stats.active },
            { key: 'approved', label: 'Approved', count: stats.approved },
            { key: 'rejected', label: 'Rejected', count: stats.rejected },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tab.key)}
              className="flex items-center space-x-1"
            >
              <Filter className="w-3 h-3" />
              <span>{tab.label}</span>
              <Badge variant="secondary" className="ml-1">
                {tab.count}
              </Badge>
            </Button>
          ))}
        </div> */}

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Withdrawal Requests</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "No withdrawal requests have been made for this project yet."
                : `No ${filter} withdrawal requests found.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests
              .slice(0, isExpanded ? filteredRequests.length : 3)
              .map((request, index) => {
                const statusConfig = getStatusConfig(request.isActive ? 'pending' : request.status);
                
                return (
                  <div
                    key={request._id || index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          request.isActive ? 'bg-yellow-100' : 
                          request.status?.toLowerCase() === 'approved' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {statusConfig.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Withdrawal Request #{index + 1}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {formatDate(request.timestamp)}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${statusConfig.color} flex items-center space-x-1`}>
                        {statusConfig.icon}
                        <span>{statusConfig.text}</span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Amount</p>
                          <p className="font-semibold text-gray-900">
                            {formatAmount(request.amount)} RUSD
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Requested On</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(Number(request.timestamp) * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="font-semibold text-gray-900">
                            {request.isActive ? 'Active' : 'Processed'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Proof/Evidence */}
                    {request.proof && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <p className="text-sm font-medium text-gray-700">Supporting Evidence</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <p className="text-sm text-gray-800 break-all">
                            {request.proof}
                          </p>
                          {request.proof.startsWith('http') && (
                            <a
                              href={request.proof}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm mt-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View Evidence</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Transaction Hash */}
                    {request.transactionHash && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">Transaction Hash</p>
                          <a
                            href={`https://testnet.bscscan.com/tx/${request.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <span className="font-mono">
                              {request.transactionHash.slice(0, 10)}...{request.transactionHash.slice(-8)}
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            
            {/* Show More/Less Button */}
            {filteredRequests.length > 3 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      Show Less
                      <EyeOff className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Show All ({filteredRequests.length - 3} more)
                      <Eye className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Updated and more comprehensive PropTypes
WithdrawalRequests.propTypes = {
  withdrawalRequests: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      isActive: PropTypes.bool,
      status: PropTypes.string,
      proof: PropTypes.string,
      transactionHash: PropTypes.string,
      projectContract: PropTypes.string,
      requester: PropTypes.string,
      createdAt: PropTypes.string,
      updatedAt: PropTypes.string
    })
  ),
  isLoading: PropTypes.bool,
  projectContract: PropTypes.string.isRequired,
  project: PropTypes.shape({
    projectContract: PropTypes.string,
    projectId: PropTypes.string,
    projectDetails: PropTypes.string,
    proposer: PropTypes.string,
    certificateId: PropTypes.string,
    isApproved: PropTypes.bool,
    emissionReductions: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    credits: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })
};

// Default props
WithdrawalRequests.defaultProps = {
  withdrawalRequests: [],
  isLoading: false,
  project: null
};

export default WithdrawalRequests;