import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Users, User, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const HoldersModal = ({ 
  onClose,
  holders, 
  holdersLoading, 
  holdersCurrentPage, 
  holdersTotalPages, 
  holdersTotalNFTs,
  holdersPerPage,
  holdersHasNextPage,
  holdersHasPrevPage,
  selectedTokenId,
  onPageChange,
  onLimitChange,
  onTokenIdFilterChange
}) => {
  
  const getHoldersPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, holdersCurrentPage - 2);
    const endPage = Math.min(holdersTotalPages, holdersCurrentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Project Holders</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {holdersLoading ? (
                  "Loading holders..."
                ) : (
                  `Showing ${((holdersCurrentPage - 1) * holdersPerPage) + 1} to ${Math.min(holdersCurrentPage * holdersPerPage, holdersTotalNFTs)} of ${holdersTotalNFTs} holders`
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Token ID Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Token ID:</label>
                <Select value={selectedTokenId} onValueChange={onTokenIdFilterChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Filter by Token ID" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="1">Minted</SelectItem>
                    <SelectItem value="2">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Per Page Selector */}
              <Select value={holdersPerPage.toString()} onValueChange={onLimitChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Per page" />
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

          {/* Token Filter Badge */}
          {selectedTokenId !== "all" && (
            <div className="mb-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                <span className="mr-2">Filtered by Token ID: {selectedTokenId}</span>
                <button
                  onClick={() => onTokenIdFilterChange("all")}
                  className="ml-1 hover:bg-blue-200 rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="max-h-[50vh] overflow-auto border border-gray-200 rounded-lg">
            {holdersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                <span className="ml-2 text-gray-600">Loading holders...</span>
              </div>
            ) : holders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Holders Found</h3>
                <p className="text-gray-600">
                  {selectedTokenId !== "all"
                    ? `No holders found for Token ID ${selectedTokenId}.`
                    : "This project doesn't have any token holders yet."
                  }
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holder Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Project Contract</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token ID</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (tCO₂)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {holders.map((holder, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {((holdersCurrentPage - 1) * holdersPerPage) + index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="min-w-0">
                            <a
                              href={`https://testnet.bscscan.com/address/${holder.owner}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                              title={holder.owner}
                            >
                              <span className="block sm:hidden">
                                {holder.owner ? `${holder.owner.slice(0, 6)}...${holder.owner.slice(-4)}` : "N/A"}
                              </span>
                              <span className="hidden sm:block">
                                {holder.owner ? `${holder.owner.slice(0, 10)}...${holder.owner.slice(-8)}` : "N/A"}
                              </span>
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                        <a
                          href={`https://testnet.bscscan.com/address/${holder.projectContract}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                          title={holder.projectContract}
                        >
                          {holder.projectContract ? `${holder.projectContract.slice(0, 10)}...${holder.projectContract.slice(-8)}` : "N/A"}
                        </a>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${holder.tokenId === 1
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                        }`}>
                          #{holder.tokenId} {holder.tokenId === 1 ? "(Mint)" : "(Retired)"}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {Number(holder.amount).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!holdersLoading && holdersTotalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Page {holdersCurrentPage} of {holdersTotalPages} • Total: {holdersTotalNFTs} holders
                {selectedTokenId !== "all" && ` (Token ID ${selectedTokenId})`}
              </div>

              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(holdersCurrentPage - 1)}
                  disabled={!holdersHasPrevPage}
                  className="flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {holdersCurrentPage > 3 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(1)}
                      >
                        1
                      </Button>
                      {holdersCurrentPage > 4 && <span className="px-2 text-gray-400">...</span>}
                    </>
                  )}

                  {getHoldersPageNumbers().map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={holdersCurrentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNumber)}
                      className={holdersCurrentPage === pageNumber ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {pageNumber}
                    </Button>
                  ))}

                  {holdersCurrentPage < holdersTotalPages - 2 && (
                    <>
                      {holdersCurrentPage < holdersTotalPages - 3 && <span className="px-2 text-gray-400">...</span>}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(holdersTotalPages)}
                      >
                        {holdersTotalPages}
                      </Button>
                    </>
                  )}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(holdersCurrentPage + 1)}
                  disabled={!holdersHasNextPage}
                  className="flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

HoldersModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  holders: PropTypes.arrayOf(
    PropTypes.shape({
      owner: PropTypes.string,
      projectContract: PropTypes.string,
      tokenId: PropTypes.number,
      amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ).isRequired,
  holdersLoading: PropTypes.bool.isRequired,
  holdersCurrentPage: PropTypes.number.isRequired,
  holdersTotalPages: PropTypes.number.isRequired,
  holdersTotalNFTs: PropTypes.number.isRequired,
  holdersPerPage: PropTypes.number.isRequired,
  holdersHasNextPage: PropTypes.bool.isRequired,
  holdersHasPrevPage: PropTypes.bool.isRequired,
  selectedTokenId: PropTypes.string.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onLimitChange: PropTypes.func.isRequired,
  onTokenIdFilterChange: PropTypes.func.isRequired,
};

export default HoldersModal;