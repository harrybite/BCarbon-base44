/* eslint-disable no-unused-vars */
/* eslint-disable no-constant-binary-expression */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { methodology } from '../contract/address';

// eslint-disable-next-line react/prop-types
const ProjectCard = ({ project }) => {
  console.log('ProjectCard project address:', project);
  const { userAddress, checkAuthorizedVVB,
    checkIsProjectOwner,
    checkIsOwner,
    rejectAndRemoveProject,
    getListedProjectDetails,
    mintWithETH,
    submitComment,
    checkRUSDAllowance,
    approveRUSD
  } = useContractInteraction();
  const { projectAddress } = useParams();
  const [details, setDetails] = useState({
    projectAddress: '',
    metadata: {},
    isApproved: false,
    creditAmount: 0,
    comments: [],
    offChainComments: [],
    methodology: ''
  });
  const [canComment, setCanComment] = useState(false);
  const [comment, setComment] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [reloadData, setReloadData] = useState(0);

  useEffect(() => {
    const fetchDetails = async () => {
      if (project) {
        try {
          const data = await getListedProjectDetails(project);
          console.log('Project details:', data);
          setDetails(data);
          setCanComment((await checkAuthorizedVVB()) || (await checkIsProjectOwner(projectAddress)));
          setIsOwner(await checkIsOwner());
        } catch (error) {
          console.error('Error fetching project details:', error);
        }
      }
    };
    fetchDetails();
  }, [userAddress, projectAddress, reloadData]);

  const handleComment = async () => {
    if (!comment) return;
    try {
      const tx = await submitComment(details.projectContract, comment);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert('Comment submitted successfully!');
        setComment(''); // Clear the textarea
        setReloadData(reloadData + 1); // Trigger a reload to fetch new comments
        // Optionally, refresh comments here
      } else {
        alert('Comment transaction failed!');
      }
    } catch (error) {
      alert(`Comment failed: ${error.message}`);
    }
  };

  const handleReject = async () => {
    try {
      const tx = await rejectAndRemoveProject(project);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert(`Project rejected! Transaction: ${tx.hash}`);
        setReloadData(reloadData + 1); // Trigger a reload to update project list
      } else {
        alert(`Transaction failed!`);
      }
    } catch (error) {
      alert(`Rejection failed: ${error.message}`);
    }
  };

  const handleMint = async () => {
    try {
      const allowance = await checkRUSDAllowance(details.projectContract);
      if (BigInt(allowance) <= BigInt(0)) {
      console.log("Insufficient allowance, approving RUSD first...");
      const approveTx = await approveRUSD(details.projectContract);
      const approveReceipt = await approveTx.wait();
      if (approveReceipt.status !== 1) {
        alert("RUSD approval failed");
        return;
      }
      console.log("RUSD approved successfully");
    }
    

      const amount = prompt('Enter amount to mint:');
      if (amount) {
        const tx = await mintWithETH(details.projectContract, amount);
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          alert(`Credits minted! Transaction: ${tx.hash}`);
          setReloadData(reloadData + 1); // Trigger a reload to update project details
        }
      } else {
        alert('Minting cancelled or invalid amount.');
      }
    } catch (error) {
      alert(`Minting failed: ${error.message}`);
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
  // empty space code is &nbsp; in HTML
return (
  <div className="border rounded p-4 w-full md:min-w-[450px]">
    <h3 className="text-lg font-bold mb-2">{details.projectId}</h3>
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
      
      <div className="flex items-center">
        <span className="font-medium text-gray-700 w-[180px]">Status:</span>
        <span className="font-semibold flex-grow text-right">  {getStatusText(details)}</span>
      </div>
      
      <div className="flex items-center">
        <span className="font-medium text-gray-700 w-[180px]">Credits Issued:</span>
        <span className="font-semibold flex-grow text-right">{Number(details.credits)} tCO<sub>2</sub></span>
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
      {/* {details.isApproved && (
        <button
          onClick={handleMint}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Mint Credits
        </button>
      )} */}
      {/* {!details.isApproved && isOwner && (
        <button
          onClick={handleReject}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Reject Project
        </button>
      )} */}
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