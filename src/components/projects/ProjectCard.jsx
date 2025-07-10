
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  TreePine, 
  TrendingUp, 
  Calendar, 
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function ProjectCard({ project }) {
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  const getStatusBadge = () => {
    if (project.mintingActive) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-gray-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Inactive
        </Badge>
      );
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <TreePine className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg group-hover:text-green-700 transition-colors">
                Project #{project.projectId}
              </CardTitle>
              <p className="text-sm text-gray-500">{project.certificateId}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Total Supply</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatNumber(project.totalSupply)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Retired</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatNumber(project.totalRetired)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Mint Price</span>
            <span className="font-semibold text-green-600">
              {project.mintPrice} ETH
            </span>
          </div>
          
          {project.methodology && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Methodology</span>
              <span className="text-sm font-medium">{project.methodology}</span>
            </div>
          )}
          
          {project.vintage && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Vintage</span>
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                {project.vintage}
              </Badge>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Link to={createPageUrl(`ProjectDetails?id=${project.id}`)}>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 group-hover:bg-green-700 transition-colors"
              size="sm"
            >
              View Details
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
