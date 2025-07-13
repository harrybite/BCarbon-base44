import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TreePine } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import ProjectCard from "../components/projects/ProjectCard";
import ProjectStats from "../components/projects/ProjectStats";
import { useContractInteraction } from "@/components/contract/ContractInteraction";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState();
  const [statusFilter, setStatusFilter] = useState("all");

    const {userAddress, getListedProjects } = useContractInteraction();

  useEffect(() => {
    loadProjects();
  }, [userAddress]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter, userAddress]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await getListedProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

const filterProjects = () => {
  let filtered = [...projects];

  // Search filter
  if (searchTerm && searchTerm.trim() !== "") {
    filtered = filtered.filter(project =>
      project?.projectContract?.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
  }

  // Status filter
  if (statusFilter === "approved") {
    filtered = filtered.filter(project => project.isApproved);
  } else if (statusFilter === "validated") {
    filtered = filtered.filter(project => project.isValidated && !project.isApproved);
  } else if (statusFilter === "verified") {
    filtered = filtered.filter(project => project.isVerified && !project.isApproved);
  }

  setFilteredProjects(filtered);
};

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TreePine className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Carbon Credit Projects</h1>
              <p className="text-gray-600">Discover and invest in verified carbon reduction projects</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {!isLoading && <ProjectStats />}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search projects by address."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                 <SelectItem value="validated">Validated</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
              </SelectContent>
            </Select>

            {/* <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="projectAddress">Project Address</SelectItem>
                <SelectItem value="mintPrice">Mint Price</SelectItem>
                <SelectItem value="totalSupply">Total Supply</SelectItem>
                <SelectItem value="totalRetired">Total Retired</SelectItem>
              </SelectContent>
            </Select> */}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2">
          {isLoading ? (
            Array(6).fill(0).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))
          ) : filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
                <ProjectCard key={project.projectContract} project={project.projectContract} />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TreePine className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}