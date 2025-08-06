/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import ProjectCard from '../projects/ProjectCard';
import { set } from 'date-fns';
import { useConnectWallet } from '@/context/walletcontext';
import { Link, useNavigate } from "react-router-dom";

const CertificatesTab = () => {
  const { getRetirementCertificatesForAllProject } = useContractInteraction();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [update, setUpdate] = useState(0);

  const { walletAddress } = useConnectWallet();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!walletAddress) return;
      setLoading(true);
      try {
        const count = await getRetirementCertificatesForAllProject();
        console.log('User retirement certificates count:', count);
        setProjects(count);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
      setLoading(false);
    };
    if (walletAddress ) {
      fetchUserProjects();
    }
  }, [walletAddress, update]);

  // Helper function to trim address
  const trimAddress = (addr) => {
    if (!addr) return "";
    return addr.slice(0, 4) + "..." + addr.slice(-4);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">BCO<sub>2</sub> Retirement Certificates</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
          {projects.map((project, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 rounded-2xl shadow-xl border border-blue-600 p-4 flex flex-col gap-4"
            >
              {/* Project Header */}
              <div className="mb-2">
                <div className="font-bold text-lg text-white break-all">
                  Project: {project.projectAddress}
                </div>
                <div className="text-blue-200 text-xs">
                  Certificates: {project.certificates.length}
                </div>
              </div>
              {/* Certificates List - horizontal */}
              <div className="flex flex-row gap-3 overflow-x-auto pb-2 justify-around">
                {project.certificates.length === 0 ? (
                  <div className="text-blue-100 text-sm">No certificates found.</div>
                ) : (
                  project.certificates.map((cert, j) => (
                    <div
                      key={j}
                      className="bg-white/90 rounded-xl shadow p-3 flex flex-col gap-1 min-w-[300px] max-w-sm cursor-pointer hover:bg-blue-100"
                      onClick={() =>
                        navigate("/ValidateCertificate", {
                          state: {
                            projectAddress: project.projectAddress,
                            account: cert.owner,
                            certificateIndex: j,
                            certificateId: cert.certificateId
                          }
                        })
                      }
                    >
                      <div className="font-semibold text-blue-900">
                        Certificate ID: <span className="break-all">{cert.certificateId || "N/A"}</span>
                      </div>
                      <div className="text-xs text-gray-700">
                        Owner: <span className="break-all">{trimAddress(cert.owner)}</span>
                      </div>
                      <div className="text-xs text-gray-700">
                        Tonnes Retired: <span className="font-bold">{cert.tonnesRetired} tCO<sub>2</sub></span> 
                      </div>
                      <div className="text-xs text-gray-700">
                        Retired At:{" "}
                        {cert.retireTimestamp
                          ? new Date(Number(cert.retireTimestamp) * 1000).toLocaleString()
                          : "N/A"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificatesTab;