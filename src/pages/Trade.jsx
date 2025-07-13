import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import TradeForm from "../components/trade/TradeForm";
import MarketplaceInteraction from "../components/contract/MarketplaceInteraction";

const API_BASE = "http://localhost:3001/api"; // Backend base URL

export default function Trade() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch projects
      const resProjects = await axios.get(`${API_BASE}/sync-projects`);
      const approvedProjects = resProjects.data.projects.filter(p => p.isApproved);
      setProjects(approvedProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrade = async (tradeData) => {
    try {
      // The TradeForm component handles the actual contract interaction
      return { success: true };
    } catch (error) {
      console.error("Trade execution failed:", error);
      throw new Error("Trade execution failed");
    }
  };

  return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Carbon Credit NFT Marketplace</h1>
                <p className="text-gray-600">Buy non-retired carbon credit NFTs (tCO2) from listed projects</p>
              </div>
            </div>
          </div>

          <TradeForm projects={projects} onTrade={handleTrade} isLoading={isLoading} />
        </div>
      </div>
  );
}