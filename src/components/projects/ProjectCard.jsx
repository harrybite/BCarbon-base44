/* eslint-disable no-constant-binary-expression */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import { useParams } from 'react-router-dom';

// eslint-disable-next-line react/prop-types
const ProjectCard = ({ project }) => {
  console.log('ProjectCard project address:', project);
  const { userAddress, checkAuthorizedVVB,
    checkIsProjectOwner,
    checkIsOwner,
    rejectAndRemoveProject,
    getListedProjectDetails,
    mintWithETH,
    submitComment
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
      const amount = prompt('Enter amount to mint:');
      if (amount) {
        const tx = await mintWithETH(project, amount);
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

  // empty space code is &nbsp; in HTML
  return (
    <div className="border rounded p-4">
      <h3 className="text-lg font-bold">{details.projectId}</h3>
      <p className='font-semibold' >{details.projectDetails}</p>
      <div className="space-y-2">
        <div className="flex w-full justify-between">
          <span className="">Emission Reductions:</span>
          <span className="font-semibold">{Number(details.emissionReductions)}</span>
        </div>
        <div className="flex w-full justify-between">
          <span className="">Methodology:</span>
          <span className="font-semibold">{Number(details.methodology)}</span>
        </div>
        <div className="flex w-full justify-between">
          <span className="">Status:</span>
          <span className="font-semibold">{details.isApproved ? 'Approved' : 'Pending'}</span>
        </div>
        <div className="flex w-full justify-between">
          <span className="">Credits Issued:</span>
          <span className="font-semibold">{Number(details.credits)}</span>
        </div>
      </div>
      {details.isApproved && (
        <button
          onClick={handleMint}
          className="bg-green-500 text-white px-4 py-2 rounded mt-2 mr-2"
        >
          Mint Credits
        </button>
      )}
      {!details.isApproved && isOwner && (
        <button
          onClick={handleReject}
          className="bg-red-500 text-white px-4 py-2 rounded mt-2"
        >
          Reject Project
        </button>
      )}
      {canComment && (
        <div className="mt-4">
          <h4 className="font-semibold">Comments</h4>
          {details.comments.map((c, i) => (
            <p key={i}>
              {`${c.commenter.slice(0, 6)}...${c.commenter.slice(-4)}`}
              <br />
              {c.comment}
            </p>
          ))}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border rounded px-2 py-1 mt-2"
            placeholder={
              Date.now() / 1000 > Number(details.commentPeriodEnd)
                ? "Comment period is over"
                : "Add a comment..."
            }
            disabled={Date.now() / 1000 > Number(details.commentPeriodEnd)}
          />
          <button
            onClick={handleComment}
            disabled={Date.now() / 1000 > Number(details.commentPeriodEnd)}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
          >
            Submit Comment
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectCard;