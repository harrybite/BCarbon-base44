import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowUpDown, Clock, CheckCircle2, AlertCircle } from "lucide-react";

import TradeForm from "../components/trade/TradeForm";

const API_BASE = "http://localhost:3001/api"; // Backend base URL

export default function Trade() {
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const transactionsRef = useRef(transactions);

  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      checkAllPendingTransactions();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch projects
      const resProjects = await axios.get(`${API_BASE}/sync-projects`);
      const approvedProjects = resProjects.data.projects.filter(p => p.isApproved);
      setProjects(approvedProjects);

      // Fetch recent transactions (you can add a route with a limit if needed)
      const resTransactions = await axios.get(`${API_BASE}/transactions`);
      setTransactions(resTransactions.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAllPendingTransactions = async () => {
    const pendingTxs = transactionsRef.current.filter(tx => tx.status === "pending");
    if (pendingTxs.length > 0) {
      await Promise.all(
        pendingTxs.map((tx) =>
          axios.get(`${API_BASE}/transaction/${tx.transactionHash}`)
        )
      );
      loadData();
    }
  };

  const handleTrade = async (tradeData) => {
    try {
      // Simulate actual transfer transaction here (or call smart contract via wallet)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const fakeTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;

      // Send to backend
      await axios.post(`${API_BASE}/transaction`, {
        transactionHash: fakeTxHash,
        projectAddress: tradeData.projectId,
        userAddress: tradeData.toAddress,
      });

      await loadData();
      checkAllPendingTransactions();

      return { success: true };
    } catch (error) {
      console.error("Trade execution failed:", error);
      throw new Error("Trade execution failed");
    }
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
      failed: AlertCircle
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
                              {tx.amount || '1'} Credits
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatAddress(tx.userAddress)} → {formatAddress(tx.projectAddress)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(tx.status)}
                          <div className="text-xs text-gray-500 mt-1">
                            Tx Hash: {formatAddress(tx.transactionHash)}
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
