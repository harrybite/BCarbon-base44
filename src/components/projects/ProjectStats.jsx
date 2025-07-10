import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TreePine, Recycle, DollarSign } from "lucide-react";

export default function ProjectStats({ projects }) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.mintingActive).length;
  const totalCredits = projects.reduce((sum, p) => sum + (p.totalSupply || 0), 0);
  const totalRetired = projects.reduce((sum, p) => sum + (p.totalRetired || 0), 0);

  const stats = [
    {
      title: "Total Projects",
      value: totalProjects,
      icon: TreePine,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Active Projects",
      value: activeProjects,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Total Credits",
      value: totalCredits.toLocaleString(),
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Credits Retired",
      value: totalRetired.toLocaleString(),
      icon: Recycle,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}