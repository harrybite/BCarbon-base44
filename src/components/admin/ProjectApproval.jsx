import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TreePine,
  AlertTriangle,
  FileText
} from "lucide-react";

export default function ProjectApproval({ projects, onApprove, onReject }) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingProject, setProcessingProject] = React.useState(null);

  const handleApproval = async (projectId, action) => {
    setIsProcessing(true);
    setProcessingProject(projectId);
    
    try {
      if (action === 'approve') {
        await onApprove(projectId);
      } else {
        await onReject(projectId);
      }
    } catch (error) {
      console.error(`Error ${action}ing project:`, error);
    } finally {
      setIsProcessing(false);
      setProcessingProject(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      listed: { color: "bg-blue-100 text-blue-800", icon: Clock, label: "Awaiting Approval" },
      approved: { color: "bg-green-100 text-green-800", icon: CheckCircle2, label: "Approved" },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Rejected" }
    };
    
    const config = statusConfig[status] || statusConfig.listed;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const pendingProjects = projects.filter(p => p.status === 'listed' || !p.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TreePine className="w-5 h-5 text-green-600" />
          <span>Project Approval Queue</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Review and approve carbon credit projects for issuance
        </p>
      </CardHeader>
      
      <CardContent>
        {pendingProjects.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No projects are currently pending approval.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {pendingProjects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      Project #{project.projectId}
                    </h3>
                    <p className="text-gray-600">{project.certificateId}</p>
                    <div className="mt-2">
                      {getStatusBadge(project.status)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Mint Price</p>
                    <p className="font-semibold">{project.mintPrice} ETH</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Methodology</p>
                    <p className="font-medium">{project.methodology}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vintage</p>
                    <p className="font-medium">{project.vintage || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Batch Number</p>
                    <p className="font-medium">{project.batchNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Permanent</p>
                    <Badge variant={project.isPermanent ? "default" : "outline"}>
                      {project.isPermanent ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>

                {project.repoLink && (
                  <div className="mb-4">
                    <a
                      href={project.repoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:underline text-sm"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View Project Documentation
                    </a>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleApproval(project.id, 'approve')}
                    disabled={isProcessing && processingProject === project.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {isProcessing && processingProject === project.id ? "Approving..." : "Approve"}
                  </Button>
                  
                  <Button
                    onClick={() => handleApproval(project.id, 'reject')}
                    disabled={isProcessing && processingProject === project.id}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {isProcessing && processingProject === project.id ? "Rejecting..." : "Reject"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}