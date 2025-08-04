/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useConnectWallet } from '@/context/walletcontext';
import { useToast } from '../ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { apihost } from '../contract/address';
import axios from 'axios';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Users,
  Vote,
  Timer,
  Wallet,
  RefreshCw
} from 'lucide-react';

const MyRequest = () => {
  const { walletAddress } = useConnectWallet();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const [requestsPerPage, setRequestsPerPage] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  const fetchWithdrawalRequests = async (page = 1, limit = requestsPerPage, showLoader = true) => {
    if (!walletAddress) return;
    
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await axios.get(
        `${apihost}/withdrawal/withdrawal-requests-by-requester/${walletAddress}?page=${page}&limit=${limit}`
      );
      
      const { requests: fetchedRequests, pagination } = response.data;
      
      setRequests(fetchedRequests);
      setCurrentPage(pagination.currentPage);
      setTotalPages(pagination.totalPages);
      setTotalRequests(pagination.totalRequests);
      setHasNextPage(pagination.hasNextPage);
      setHasPrevPage(pagination.hasPrevPage);
      
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch withdrawal requests",
        variant: "destructive",
      });
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchWithdrawalRequests(currentPage, requestsPerPage);
    } else {
      setLoading(false);
    }
  }, [walletAddress, currentPage, requestsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLimitChange = (newLimit) => {
    setRequestsPerPage(parseInt(newLimit));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchWithdrawalRequests(currentPage, requestsPerPage, false);
  };

  const getStatusInfo = (request) => {
    const now = Math.floor(Date.now() / 1000);
    const votingEnd = request.governanceExtended ? request.extendedVotingEnd : request.votingEnd;
    
    if (request.governanceApproved) {
      return {
        status: 'Approved',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle2 className="w-4 h-4" />,
        description: `Approved: ${request.governanceApprovedAmount} RUSD`
      };
    }
    
    if (!request.isActive) {
      return {
        status: 'Rejected',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="w-4 h-4" />,
        description: 'Request was rejected'
      };
    }
    
    if (now > votingEnd) {
      return {
        status: 'Voting Ended',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <Clock className="w-4 h-4" />,
        description: 'Voting period has ended'
      };
    }
    
    return {
      status: 'Under Review',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Timer className="w-4 h-4" />,
      description: 'Currently under review'
    };
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getVotingProgress = (request) => {
    const totalVotes = request.holderVotesFor + request.holderVotesAgainst;
    if (totalVotes === 0) return { forPercentage: 0, againstPercentage: 0 };
    
    const forPercentage = (request.holderVotesFor / totalVotes) * 100;
    const againstPercentage = (request.holderVotesAgainst / totalVotes) * 100;
    
    return { forPercentage, againstPercentage };
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Wallet Not Connected</h3>
                  <p className="text-red-700">Please connect your wallet to view your withdrawal requests.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Withdrawal Requests</h1>
                <p className="text-gray-600 mt-1">Track and manage your withdrawal requests</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            {/* <div className="hidden md:flex space-x-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="text-2xl font-bold text-blue-600">{totalRequests}</div>
                <div className="text-sm text-gray-600">Total Requests</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="text-2xl font-bold text-green-600">
                  {requests.filter(r => r.governanceApproved).length}
                </div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading requests...
                    </div>
                  ) : (
                    `Showing ${((currentPage - 1) * requestsPerPage) + 1} to ${Math.min(currentPage * requestsPerPage, totalRequests)} of ${totalRequests} requests`
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
              </div>
              
              <div className="flex items-center space-x-4">
                <Label htmlFor="perPage" className="text-sm font-medium">Items per page:</Label>
                <Select value={requestsPerPage.toString()} onValueChange={handleLimitChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 per page</SelectItem>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Requests</h3>
              <p className="text-gray-600">Fetching your withdrawal requests...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && requests.length === 0 && (
          <Card className="border-gray-200">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No Withdrawal Requests</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  You haven't made any withdrawal requests yet. When you request withdrawals from your projects, they will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Requests List */}
        {!loading && requests.length > 0 && (
          <div className="space-y-6 mb-8">
            {requests.map((request) => {
              const statusInfo = getStatusInfo(request);
              const votingProgress = getVotingProgress(request);
              const now = Math.floor(Date.now() / 1000);
              const votingEnd = request.governanceExtended ? request.extendedVotingEnd : request.votingEnd;
              const timeLeft = Math.max(0, votingEnd - now);
              
              return (
                <Card key={request.requestId} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Request #{request.requestId}</CardTitle>
                          <p className="text-sm text-gray-600">
                            Project: {formatAddress(request.projectContract)}
                          </p>
                        </div>
                      </div>
                      
                      <Badge className={`${statusInfo.color} border`}>
                        {statusInfo.icon}
                        <span className="ml-1">{statusInfo.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Request Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-green-700 mb-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-sm font-medium">Requested Amount</span>
                        </div>
                        <div className="text-lg font-bold text-green-800">
                          {Number(request.amount).toLocaleString()} RUSD
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-blue-700 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm font-medium">Requested</span>
                        </div>
                        <div className="text-sm font-semibold text-blue-800">
                          {formatDate(request.timestamp)}
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-orange-700 mb-1">
                          <Timer className="w-4 h-4" />
                          <span className="text-sm font-medium">Total RUSD Collected</span>
                        </div>
                        <div className="text-sm font-semibold text-orange-800">
                          {timeLeft > 0 ? `${Math.ceil(timeLeft / 86400)} days left` : 'Ended'}
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-purple-700 mb-1">
                          <Vote className="w-4 h-4" />
                          <span className="text-sm font-medium">Total Withdrawl</span>
                        </div>
                        <div className="text-lg font-bold text-purple-800">
                          {request.holderVotesFor + request.holderVotesAgainst}
                        </div>
                      </div>
                    </div>

                   
                    {(request.holderVotesFor > 0 || request.holderVotesAgainst > 0) && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">Voting Progress</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600">For: {request.holderVotesFor}</span>
                            <span className="text-red-600">Against: {request.holderVotesAgainst}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 flex overflow-hidden">
                            <div 
                              className="bg-green-500 h-full transition-all duration-300"
                              style={{ width: `${votingProgress.forPercentage}%` }}
                            />
                            <div 
                              className="bg-red-500 h-full transition-all duration-300"
                              style={{ width: `${votingProgress.againstPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Proof of Work */}
                    {request.proofOfWork && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Proof of Work</h4>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          {request.proofOfWork.startsWith('http') ? (
                            <a 
                              href={request.proofOfWork} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center space-x-1"
                            >
                              <span className="break-all">{request.proofOfWork}</span>
                              <ExternalLink className="w-4 h-4 flex-shrink-0" />
                            </a>
                          ) : (
                            <p className="text-sm text-gray-700 break-words">{request.proofOfWork}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Status Description */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">{statusInfo.description}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages} • {totalRequests} total requests
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrevPage}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center space-x-1">
                    {currentPage > 3 && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handlePageChange(1)}>
                          1
                        </Button>
                        {currentPage > 4 && <span className="px-2 text-gray-400">...</span>}
                      </>
                    )}

                    {getPageNumbers().map((pageNumber) => (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                        className={currentPage === pageNumber ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        {pageNumber}
                      </Button>
                    ))}

                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <span className="px-2 text-gray-400">...</span>}
                        <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages)}>
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyRequest;