/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useConnectWallet } from '@/context/walletcontext';
import { apihost } from '@/components/contract/address';

const CommentsSection = ({ comments, comment, setComment, isCommenting, handleSubmitComment, projectContract }) => {
  const { walletAddress } = useConnectWallet();
  const [role, setRole] = React.useState("");
  const [commentsWithRole, setCommentsWithRole] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    // fetch user role from database
    const fetchUserRole = async () => {

      setLoading(true);
      try {
        
        const response = await fetch(`${apihost}/vvb/project-comments/${projectContract}`);
        const data = await response.json();
        setCommentsWithRole(data.comments || []);
        console.log("Fetched comments:", data.comments);

      } catch (error) {
        console.error("Error fetching user roles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [projectContract]); // Changed dependency from walletAddress to comments

  console.log("Comments with role:", commentsWithRole);
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            disabled={isCommenting}
          />
          <Button
            className="mt-2"
            onClick={handleSubmitComment}
            disabled={isCommenting || !comment.trim()}
          >
            {isCommenting ? "Submitting..." : "Submit Comment"}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Loading comments...</p>
          </div>
        ) : commentsWithRole && commentsWithRole.length > 0 ? (
          <div className="space-y-3">
            {commentsWithRole.map((c, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span className="font-medium">
                    {c.author && `${c.author.slice(0, 6)}...${c.author.slice(-4)}`} 
                    <span className='font-bold ml-1'>({c?.role || "Guest"})</span> 
                  </span>
                </div>
                <p className="text-gray-800">{c.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No comments yet.</p>
        )}
      </CardContent>
    </Card>
  );
};

CommentsSection.propTypes = {
  comments: PropTypes.arrayOf(
    PropTypes.shape({
      commenter: PropTypes.string,
      comment: PropTypes.string,
    })
  ),
  projectContract: PropTypes.string.isRequired,
  comment: PropTypes.string.isRequired,
  setComment: PropTypes.func.isRequired,
  isCommenting: PropTypes.bool.isRequired,
  handleSubmitComment: PropTypes.func.isRequired,
};

CommentsSection.defaultProps = {
  comments: [],
};

export default CommentsSection;