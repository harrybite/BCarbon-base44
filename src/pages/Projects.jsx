/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, TreePine, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import ProjectCard from "../components/projects/ProjectCard";
import ProjectStats from "../components/projects/ProjectStats";
import { useConnectWallet } from "@/context/walletcontext";
import { apihost } from "@/components/contract/address";
import { useConnect } from "thirdweb/react";
import { jwtDecode } from "jwt-decode";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingUrl, setPendingUrl] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [projectsPerPage, setProjectsPerPage] = useState(6);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  const { walletAddress } = useConnectWallet();
  const { connect, } = useConnect();
  const navigate = useNavigate();

  // Check if user is authenticated
  const isUserAuthenticated = () => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return false;
      }
      return true;
    } catch (error) {
      localStorage.removeItem("token");
      return false;
    }
  };

  const isFullyAuthenticated = walletAddress && isUserAuthenticated();
  console.log("Is fully authenticated:", isFullyAuthenticated);

  useEffect(() => {
    loadProjects();
  }, [currentPage, projectsPerPage]); // Removed walletAddress dependency

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${apihost}/project/getallprojects?page=${currentPage}&limit=${projectsPerPage}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      
      const data = await response.json();
      
      if (data && data.projects) {
        setProjects(data.projects);
        setFilteredProjects(data.projects);
        
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalProjects(data.pagination.totalProjects);
          setHasNextPage(data.pagination.hasNextPage);
          setHasPrevPage(data.pagination.hasPrevPage);
        }
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter]);

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

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLimitChange = (newLimit) => {
    setProjectsPerPage(parseInt(newLimit));
    setCurrentPage(1); // Reset to first page when changing limit
  };

  // Generate page numbers for pagination
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
              <p className="text-gray-600">
                Discover and invest in verified carbon reduction projects 
                ({totalProjects} total projects)
              </p>
            </div>
          </div>
          
          {/* Authentication Notice for Non-authenticated Users */}
          {!isFullyAuthenticated && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TreePine className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-800 mb-1">
                    Limited Access Mode
                  </h3>
                  <p className="text-sm text-amber-700 mb-3">
                    You're viewing projects in read-only mode. To access full project details, 
                    mint credits, trade, or interact with projects, please login and connect your wallet.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => navigate("/login")}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Login to Platform
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/")}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats - Only show for authenticated users */}
        {isFullyAuthenticated && !isLoading && <ProjectStats />}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search projects by address..."
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

            <Select value={projectsPerPage.toString()} onValueChange={handleLimitChange}>
              <SelectTrigger className="w-full lg:w-32">
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

        {/* Projects Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2">
          {isLoading ? (
            Array(projectsPerPage).fill(0).map((_, index) => (
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
              <ProjectCard 
                key={project.projectContract} 
                project={project.projectContract}
                isAuthenticated={isFullyAuthenticated}
              />
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

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Pagination Info */}
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * projectsPerPage) + 1} to{' '}
                {Math.min(currentPage * projectsPerPage, totalProjects)} of{' '}
                {totalProjects} projects
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrevPage}
                  className="flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {currentPage > 3 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                      >
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
                      className={currentPage === pageNumber ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {pageNumber}
                    </Button>
                  ))}

                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="px-2 text-gray-400">...</span>}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage}
                  className="flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}