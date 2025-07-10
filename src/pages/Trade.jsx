import React, { useState, useEffect, useRef } from "react";
import { Project } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowUpDown, Clock, CheckCircle2, AlertCircle } from "lucide-react";

import TradeForm from "../components/trade/TradeForm";
import { checkTransactionStatus } from "@/api/functions";

export default function Trade() {
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // useRef to hold the latest transactions state for the interval callback
  const transactionsRef = useRef(transactions);

  // Update the ref whenever transactions state changes
  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  useEffect(() => {
    loadData();
    // Set up an interval to check pending transactions
    const interval = setInterval(() => {
        checkAllPendingTransactions();
    }, 15000); // every 15 seconds

    return () => clearInterval(interval);
  }, []); // Empty dependency array to run once, relying on ref for latest state

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectsData, transactionsData] = await Promise.all([
        Project.list(),
        Transaction.list('-created_date', 10)
      ]);
      setProjects(projectsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAllPendingTransactions = async () => {
    // Access the latest transactions via the ref
    const pendingTxs = transactionsRef.current.filter(tx => tx.status === 'pending');
    if (pendingTxs.length > 0) {
        // We can run these in parallel
        await Promise.all(pendingTxs.map(tx => 
            checkTransactionStatus({ transactionHash: tx.transactionHash })
        ));
        // Refresh the list after checking
        loadData();
    }
  };

  const handleTrade = async (tradeData) => {
    try {
      // Simulate trade execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this hash would come from the wallet signing response
      const fakeTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      // Create transaction record
      await Transaction.create({
        transactionHash: fakeTxHash,
        type: "transfer",
        projectId: tradeData.projectId,
        amount: parseFloat(tradeData.amount),
        fromAddress: tradeData.fromAddress || "0x...",
        toAddress: tradeData.toAddress,
        status: "pending"
      });
      
      // Refresh transactions immediately to show the new pending one
      await loadData();

      // Trigger backend check for the newly created transaction
      checkTransactionStatus({ transactionHash: fakeTxHash });
      
      return { success: true };
    } catch (error) {
      throw new Error("Trade execution failed");
    }
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-green-100 text-green-800 border-green-200",
      failed: "bg-red-100 text-red-800 border-red-200"
    };
    
    const icons = {
      pending: Clock,
      confirmed: CheckCircle2,
      failed: AlertCircle // Changed failed icon
    };
    
    const Icon = icons[status] || Clock;
    
    return (
      <Badge className={styles[status]}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trade Carbon Credits</h1>
              <p className="text-gray-600">Transfer carbon credits between addresses</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Trade Form */}
          <div className="lg:col-span-2">
            <TradeForm projects={projects} onTrade={handleTrade} />
          </div>

          {/* Recent Transactions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowUpDown className="w-5 h-5 text-gray-600" />
                  <span>Recent Transactions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    Array(3).fill(0).map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : transactions.length > 0 ? (
                    transactions.map((tx, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <ArrowUpDown className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {tx.amount} Credits
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatAddress(tx.fromAddress)} → {formatAddress(tx.toAddress)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(tx.status)}
                          <div className="text-xs text-gray-500 mt-1">
                            Project #{tx.projectId}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <ArrowUpDown className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No transactions yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}