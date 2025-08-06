/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';

const HolderTable = ({ holders, holdersCurrentPage, holdersPerPage, holdersLoading, handleHoldersPageChange, holdersHasPrevPage, holdersHasNextPage, selectedTokenId }) => {
  return (
    <div className="max-h-[50vh] overflow-auto border border-gray-200 rounded-lg">
      {holdersLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 animate-spin border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="ml-2 text-gray-600">Loading holders...</span>
        </div>
      ) : holders.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400">👤</span>
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
                      <span className="text-green-600">👤</span>
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
  );
};

HolderTable.propTypes = {
  holders: [],
  holdersCurrentPage: PropTypes.number.isRequired,
  holdersPerPage: PropTypes.number.isRequired,
  holdersTotalNFTs: PropTypes.number.isRequired,
  holdersLoading: PropTypes.bool.isRequired,
  handleHoldersPageChange: PropTypes.func.isRequired,
  holdersHasPrevPage: PropTypes.bool.isRequired,
  holdersHasNextPage: PropTypes.bool.isRequired,
  selectedTokenId: PropTypes.string.isRequired,
};

export default HolderTable;