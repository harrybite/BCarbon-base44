/* eslint-disable no-unused-vars */
/* eslint-disable no-constant-binary-expression */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { apihost, methodology } from '../contract/address';
import { useToast } from '../ui/use-toast';
import { useConnectWallet } from '@/context/walletcontext';

// eslint-disable-next-line react/prop-types
const ProjectCard = ({ project }) => {
  const { 
    checkAuthorizedVVB,
    checkIsProjectOwner,
    checkIsOwner,
    getListedProjectDetails,
    submitComment,
  } = useContractInteraction();

  const [details, setDetails] = useState({
    projectAddress: '',
    metadata: {},
    isApproved: false,
    creditAmount: 0,
    comments: [],
    offChainComments: [],
    methodology: '',
    projectContract: '',
    projectId: '',
    proposer: '',
    location: '',
    defaultVintage: '',
    defaultValidity: ''
  });
  const { walletAddress } = useConnectWallet();
  const [canComment, setCanComment] = useState(false);
  const [comment, setComment] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [reloadData, setReloadData] = useState(0);
  const { toster } = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      if (project) {
        try {
          // const data = await getListedProjectDetails(project);
          // fetch project details from the backend
          // if (!data) {
          //   console.error('No project data found');
          //   return;
          // }
          const projectdetails =await fetch(`${apihost}/project/getproject/${project}`);
          if (!projectdetails.ok) {
            console.error('Failed to fetch project details');
            return;
          }
          const projectData = await projectdetails.json();
          console.log("Project detials:", projectData);
          setDetails(projectData.projectDetails);
        
          setCanComment((await checkAuthorizedVVB()) || (await checkIsProjectOwner(project)));
          setIsOwner(await checkIsOwner());
        } catch (error) {
          console.error('Error fetching project details:', error);
        }
      }
    };
    if (walletAddress ) {
      fetchDetails();
    }
  }, [walletAddress, reloadData]);

  const handleComment = async () => {
    if (!comment) return;
    try {
      const tx = await submitComment(details.projectContract, comment);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        toster({
          title: "Comment Submitted",
          description: `Transaction successful!`,
          variant: "success",
        });
        setComment(''); // Clear the textarea
        setReloadData(reloadData + 1); // Trigger a reload to fetch new comments
      } else {
        toster({
          title: "Comment Failed",
          description: `Transaction failed!`,
          variant: "error",
        });
      }
    } catch (error) {
      // Handle error silently as per original code
    }
  };

  const getStatusText = (details) => {
    if (details.isApproved) {
      return 'Approved';
    }
    if (!details.isValidated) {
      return 'Pending Validation';
    }
    if (!details.isVerified) {
      return 'Pending Verification';
    }
    if (details.isValidated && details.isVerified) {
      return 'Pending Approval';
    }
    return 'Pending';
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending Validation':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending Verification':
        return 'bg-orange-100 text-orange-800';
      case 'Pending Approval':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Convert epoch timestamp to readable date
  const formatVintageDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  // Parse and format location string into multiple lines
    const formatLocations = (locationString) => {
    if (!locationString) return ['N/A']; // Always return an array
    const locations = locationString.split(', ').map(loc => {
      const match = loc.match(/Location (\d+) - \(([^,]+), ([^)]+)\)/);
      if (match) {
        return `Location ${match[1]}: (${match[2]}, ${match[3]})`;
      }
      return loc;
    });
    return locations.length > 0 ? locations : ['N/A']; // Ensure the return value is always an array
    };

  return (
    <div className="border rounded p-4 w-full md:min-w-[450px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold">{details.projectId}</h3>
        <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(getStatusText(details))}`}>
          {getStatusText(details)}
        </span>
      </div>
      <p className="font-semibold mb-4">{details.projectDetails}</p>
      
      <div className="space-y-3">
        {/* Key-value pairs with labels on left, values on right */}
        <div className="flex items-center">
          <span className="font-medium text-gray-700 w-[180px]">Emission Reductions:</span>
          <span className="font-semibold flex-grow text-right">{Number(details.emissionReductions)} tCO<sub>2</sub></span>
        </div>
        
        <div className="flex items-center">
          <span className="font-medium text-gray-700 w-[180px]">Methodology:</span>
          <span 
            className="font-semibold flex-grow text-right truncate cursor-help"
            title={methodology[Number(details.methodology)] || "Unknown"}
          >
            {methodology[Number(details.methodology)]?.length > 30 
              ? `${methodology[Number(details.methodology)].substring(0, 30)}...` 
              : methodology[Number(details.methodology)] || "Unknown"}
          </span>
        </div>
        
        <div className="flex items-start">
          <span className="font-medium text-gray-700 w-[180px]">Locations:</span>
          <div className="font-semibold flex-grow text-right">
            {formatLocations(details.location).map((loc, index) => (
              <p 
                key={index} 
                className="truncate cursor-help" 
                title={loc}
              >
                {loc.length > 30 ? `${loc.substring(0, 30)}...` : loc}
              </p>
            ))}
          </div>
        </div>
        
        <div className="flex items-center">
          <span className="font-medium text-gray-700 w-[180px]">Proposer:</span>
          <span className="font-semibold flex-grow text-right truncate cursor-help" title={details.proposer || "N/A"}>
            {details.proposer ? `${details.proposer.slice(0, 6)}...${details.proposer.slice(-4)}` : "N/A"}
          </span>
        </div>
        
        <div className="flex items-center">
          <span className="font-medium text-gray-700 w-[180px]">Project Contract:</span>
          <span className="font-semibold flex-grow text-right truncate cursor-help" title={details.projectContract || "N/A"}>
            {details.projectContract ? `${details.projectContract.slice(0, 6)}...${details.projectContract.slice(-4)}` : "N/A"}
          </span>
        </div>
        
        <div className="flex items-center">
          <span className="font-medium text-gray-700 w-[180px]">Vintage:</span>
          <span className="font-semibold flex-grow text-right">{formatVintageDate(details.defaultVintage)}</span>
        </div>
        
        <div className="flex items-center">
          <span className="font-medium text-gray-700 w-[180px]">Validity:</span>
          <span className="font-semibold flex-grow text-right">
            {details.defaultIsPermanent ? 'Permanent' : `${details.defaultValidity} years`}
          </span>
        </div>
        
        <div className="flex items-center">
          <span className="font-medium text-gray-700 w-[180px]">Credits Issued:</span>
          <span
          className="font-semibold flex-grow text-right"
          dangerouslySetInnerHTML={{
            __html: details.isApproved
              ? `${Number(details.credits)} tCO<sub>2</sub>`
              : 'Pending Approval',
          }}
        ></span>
        </div>
      </div>
      <div className="mt-6">
        <Link to={`/ProjectDetails/${details.projectContract}`}>
          <button className="w-full bg-transparent border border-blue-600 text-blue-600 py-2 px-4 rounded-2xl font-semibold transition hover:bg-blue-50">
            View Project Details
          </button>
        </Link>
      </div>

      {/* Buttons */}
      <div className="flex mt-4 space-x-2">
      </div>

      {/* Improved comment section */}
      {canComment && (
        <div className="mt-6 border-t pt-4">
          <h4 className="text-lg font-semibold mb-3">Comments</h4>
          
          {details.comments && details.comments.length > 0 ? (
            <div className="space-y-3 mb-4">
              {details.comments.map((c, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span className="font-medium">
                      {c.commenter && `${c.commenter.slice(0, 6)}...${c.commenter.slice(-4)}`}
                    </span>
                    {/* <span>{c.timestamp && new Date(Number(c.timestamp) * 1000).toLocaleString()}</span> */}
                  </div>
                  <p className="text-gray-800">{c.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic mb-4">No comments yet</p>
          )}
          
          <div className="border rounded overflow-hidden">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border-b"
              rows="3"
              placeholder={
                Date.now() / 1000 > Number(details.commentPeriodEnd)
                  ? "Comment period is over"
                  : "Add a comment..."
              }
              disabled={Date.now() / 1000 > Number(details.commentPeriodEnd)}
            />
            <div className="bg-gray-50 px-3 py-2 text-center">
              <button
                onClick={handleComment}
                disabled={!comment || Date.now() / 1000 > Number(details.commentPeriodEnd)}
                className={`px-4 py-1 rounded text-white ${
                  !comment || Date.now() / 1000 > Number(details.commentPeriodEnd)
                    ? "bg-blue-300 cursor-not-allowed" 
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                Submit Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCard;