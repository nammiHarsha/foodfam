import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { PostComment } from "@/types/database";

interface CommentsDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentAdded?: (newCount: number) => void;
}

const CommentsDialog = ({ postId, open, onOpenChange, onCommentAdded }: CommentsDialogProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("post_comments")
      .select(`*, author:profiles!post_comments_author_profile_fkey(*)`)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setComments(data as unknown as PostComment[] || []);
  };

  useEffect(() => {
    if (open) {
      fetchComments();
    }
  }, [open, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      author_id: user.id,
      content: newComment.trim(),
    });

    if (error) {
      toast.error("Failed to post comment");
    } else {
      // Update comments count in the post
      const { data: commentsData } = await supabase
        .from("post_comments")
        .select("id")
        .eq("post_id", postId);
      
      const newCount = commentsData?.length || 0;
      await supabase.from("community_posts").update({ comments_count: newCount }).eq("id", postId);
      
      setNewComment("");
      fetchComments();
      onCommentAdded?.(newCount);
      toast.success("Comment posted");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif">Comments</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <img
                  src={comment.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author_id}`}
                  alt={comment.author?.full_name || "User"}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 bg-secondary rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{comment.author?.full_name || "Anonymous"}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {user ? (
          <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[60px] resize-none"
            />
            <Button type="submit" disabled={loading || !newComment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <p className="text-center text-muted-foreground py-4 border-t">
            Sign in to comment
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CommentsDialog;
