/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useConnectWallet } from '@/context/walletcontext';
import { apihost } from '@/components/contract/address';

const CommentsSection = ({ comments, comment, setComment, isCommenting, handleSubmitComment }) => {
  const { walletAddress } = useConnectWallet();
  const [role, setRole] = React.useState("");
  const [commentsWithRole, setCommentsWithRole] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    // fetch user role from database
    const fetchUserRole = async () => {
      if (!comments || comments.length === 0) {
        setCommentsWithRole([]);
        return;
      }

      setLoading(true);
      try {
        const commentWithRole = [];
        
        for (let comment of comments) {
          try {
            const response = await fetch(`${apihost}/user/get-user-role/${comment.commenter}`);
            const data = await response.json();
            
            // Create a new object instead of modifying the existing one
            const commentWithRoleData = {
              commenter: comment[1],
              comment: comment[0],
              role: data.role || "Guest" // Add the role property
            };
            console.log("Comment with role:", commentWithRoleData);
            
            commentWithRole.push(commentWithRoleData);
          } catch (error) {
            console.error(`Error fetching role for ${comment.commenter}:`, error);
            // Add comment with default role if API fails
            const commentWithRoleData = {
              ...comment,
              role: "Guest"
            };
            commentWithRole.push(commentWithRoleData);
          }
        }
        
        setCommentsWithRole(commentWithRole);
      } catch (error) {
        console.error("Error fetching user roles:", error);
        // Fallback: create comments with Guest role
        const fallbackComments = comments.map(comment => ({
          ...comment,
          role: "Guest"
        }));
        setCommentsWithRole(fallbackComments);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [comments]); // Changed dependency from walletAddress to comments

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
                    {c.commenter && `${c.commenter.slice(0, 6)}...${c.commenter.slice(-4)}`} 
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
  comment: PropTypes.string.isRequired,
  setComment: PropTypes.func.isRequired,
  isCommenting: PropTypes.bool.isRequired,
  handleSubmitComment: PropTypes.func.isRequired,
};

CommentsSection.defaultProps = {
  comments: [],
};

export default CommentsSection;