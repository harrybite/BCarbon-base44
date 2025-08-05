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
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { apihost } from '@/components/contract/address';

const WithdrawalRequests = ({ 
  withdrawalRequests: initialRequests, 
  isLoading: initialLoading, 
  projectContract, 
  project,
  isOwner,
  onGovernanceDecision
}) => {
  const [requests, setRequests] = useState(initialRequests || []);
  const [isLoading, setIsLoading] = useState(initialLoading || false);
  const [filter, setFilter] = useState('all'); // all, active, approved, rejected
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState(new Set());
  const [approvalAmounts, setApprovalAmounts] = useState({});
  const { toast } = useToast();

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

  // Handle governance decision (approve/reject)
  const handleGovernanceDecision = async (requestId, decision, amount = null) => {
    if (processingRequests.has(requestId)) return;

    // Validate approval amount if approving
    if (decision && (!amount || parseFloat(amount) <= 0)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid approval amount",
        variant: "destructive",
      });
      return;
    }

    setProcessingRequests(prev => new Set(prev).add(requestId));

    try {
      // Call the parent component's governance decision handler
      const success = await onGovernanceDecision(requestId, decision, amount);
      
      if (success) {
        // Update the request in the backend to get latest blockchain data
        const updateResponse = await fetch(`${apihost}/withdrawal/update-withdrawal-request/${requestId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        });

        if (updateResponse.ok) {
          const updatedRequest = await updateResponse.json();
          
          // Update the specific request in the local state
          setRequests(prevRequests => 
            prevRequests.map(request => 
              request.requestId === requestId 
                ? { ...request, ...updatedRequest }
                : request
            )
          );

          toast({
            title: "Success",
            description: `Request #${requestId} has been ${decision ? 'approved' : 'rejected'} successfully`,
            variant: "default",
          });

          // Clear the approval amount input
          setApprovalAmounts(prev => {
            const newAmounts = { ...prev };
            delete newAmounts[requestId];
            return newAmounts;
          });
        }
      }
    } catch (error) {
      console.error("Error processing governance decision:", error);
      toast({
        title: "Error",
        description: `Failed to ${decision ? 'approve' : 'reject'} request: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // Handle approval amount change
  const handleApprovalAmountChange = (requestId, value) => {
    setApprovalAmounts(prev => ({
      ...prev,
      [requestId]: value
    }));
  };

  // Get status configuration
  const getStatusConfig = (request) => {
    if (request.governanceApproved) {
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle2 className="w-4 h-4" />,
        text: 'Approved'
      };
    }
    
    if (!request.isActive) {
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="w-4 h-4" />,
        text: 'Rejected'
      };
    }
    
    return {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Clock className="w-4 h-4" />,
      text: 'Pending'
    };
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
    if (filter === 'approved') return request.governanceApproved;
    if (filter === 'rejected') return !request.isActive && !request.governanceApproved;
    return true;
  });

  // Get summary stats
  const getSummaryStats = () => {
    const total = requests.length;
    const active = requests.filter(r => r.isActive).length;
    const approved = requests.filter(r => r.governanceApproved).length;
    const rejected = requests.filter(r => !r.isActive && !r.governanceApproved).length;
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
            {isOwner && (
              <Badge variant="secondary" className="ml-2 flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>Gov Access</span>
              </Badge>
            )}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
        </div>

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
        <div className="flex flex-wrap gap-2 mb-4">
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
        </div>

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
                const statusConfig = getStatusConfig(request);
                const isProcessing = processingRequests.has(request.requestId);
                const approvalAmount = approvalAmounts[request.requestId] || request.amount;
                
                return (
                  <div
                    key={request._id || index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          request.governanceApproved ? 'bg-green-100' : 
                          !request.isActive ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          {statusConfig.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Request #{request.requestId}
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
                          <p className="text-sm text-gray-600">Requested Amount</p>
                          <p className="font-semibold text-gray-900">
                            {formatAmount(request.amount)} RUSD
                          </p>
                        </div>
                      </div>
                      
                      {request.governanceApproved && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <div>
                            <p className="text-sm text-gray-600">Approved Amount</p>
                            <p className="font-semibold text-green-700">
                              {formatAmount(request.governanceApprovedAmount)} RUSD
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Requested On</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(Number(request.timestamp) * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Governance Actions - Only show for Owner and Active requests */}
                    {isOwner && request.isActive && !request.governanceApproved && (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h5 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Governance Decision
                          </h5>
                          
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor={`approval-amount-${request.requestId}`} className="text-sm font-medium">
                                Approval Amount (RUSD)
                              </Label>
                              <Input
                                id={`approval-amount-${request.requestId}`}
                                type="number"
                                placeholder="Enter approval amount"
                                value={approvalAmount}
                                onChange={(e) => handleApprovalAmountChange(request.requestId, e.target.value)}
                                max={request.amount}
                                min="0"
                                step="0.01"
                                className="mt-1"
                                disabled={isProcessing}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Maximum: {formatAmount(request.amount)} RUSD
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <Button
                                size="sm"
                                onClick={() => handleGovernanceDecision(request.requestId, true, approvalAmount)}
                                disabled={isProcessing}
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <ThumbsUp className="w-4 h-4" />
                                )}
                                <span>Approve</span>
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleGovernanceDecision(request.requestId, false)}
                                disabled={isProcessing}
                                className="flex items-center space-x-2"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <ThumbsDown className="w-4 h-4" />
                                )}
                                <span>Reject</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Proof/Evidence */}
                    {request.proofOfWork && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <p className="text-sm font-medium text-gray-700">Proof of Work</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          {request.proofOfWork.startsWith('http') ? (
                            <a
                              href={request.proofOfWork}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <span className="break-all">{request.proofOfWork}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <p className="text-sm text-gray-800 break-words">{request.proofOfWork}</p>
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

// Updated PropTypes
WithdrawalRequests.propTypes = {
  withdrawalRequests: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      requestId: PropTypes.number,
      amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      isActive: PropTypes.bool,
      governanceApproved: PropTypes.bool,
      governanceApprovedAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      proofOfWork: PropTypes.string,
      transactionHash: PropTypes.string,
      projectContract: PropTypes.string,
      requester: PropTypes.string,
      createdAt: PropTypes.string,
      updatedAt: PropTypes.string
    })
  ),
  isLoading: PropTypes.bool,
  projectContract: PropTypes.string.isRequired,
  project: PropTypes.object,
  isOwner: PropTypes.bool,
  onGovernanceDecision: PropTypes.func.isRequired
};

// Default props
WithdrawalRequests.defaultProps = {
  withdrawalRequests: [],
  isLoading: false,
  project: null,
  isOwner: false
};

export default WithdrawalRequests;