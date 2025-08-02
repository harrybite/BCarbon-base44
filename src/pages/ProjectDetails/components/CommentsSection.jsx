/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const CommentsSection = ({ comments, comment, setComment, isCommenting, handleSubmitComment }) => {
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

        {comments && comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((c, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span className="font-medium">
                    {c.commenter && `${c.commenter.slice(0, 6)}...${c.commenter.slice(-4)}`}
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