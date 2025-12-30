import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Bookmark, Flag, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { usePostInteractions } from "@/hooks/usePosts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CommunityPost } from "@/types/database";
import CommentsDialog from "./CommentsDialog";
import ReportDialog from "./ReportDialog";
import EditPostDialog from "./EditPostDialog";
import LikesDialog from "./LikesDialog";

interface PostCardProps {
  post: CommunityPost;
  onUpdate?: () => void;
}

const postTypeLabels = {
  cultural_dish: "🍜 Cultural Dish",
  recipe: "📝 Recipe",
  travel_memory: "✈️ Travel Memory",
  experience_memory: "🎉 Experience",
};

const PostCard = ({ post, onUpdate }: PostCardProps) => {
  const { user } = useAuth();
  const { liked, saved, likesCount, setLikesCount, checkStatus, toggleLike, toggleSave } = usePostInteractions(post.id);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user?.id === post.author_id;

  useEffect(() => {
    setLikesCount(post.likes_count || 0);
    if (user) {
      checkStatus(user.id);
    }
  }, [user, post.id, post.likes_count]);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }
    await toggleLike(user.id);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save posts");
      return;
    }
    await toggleSave(user.id);
    toast.success(saved ? "Removed from saved" : "Saved to your collection");
  };

  const handleBlock = async () => {
    if (!user || !post.author_id) return;
    await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: post.author_id });
    toast.success("User blocked. Their content will be hidden.");
    onUpdate?.();
  };

  const handleDelete = async () => {
    if (!user || !isOwner) return;
    setDeleting(true);
    const { error } = await supabase.from("community_posts").delete().eq("id", post.id);
    if (error) {
      toast.error("Failed to delete post");
    } else {
      toast.success("Post deleted");
      onUpdate?.();
    }
    setDeleting(false);
    setDeleteOpen(false);
  };

  return (
    <article className="bg-card rounded-2xl p-6 shadow-warm hover:shadow-warm-lg transition-shadow">
      {/* Author Header */}
      <div className="flex items-center justify-between mb-4">
        <Link to={`/profile/${post.author_id}`} className="flex items-center gap-3 group">
          <img
            src={post.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_id}`}
            alt={post.author?.full_name || "User"}
            className="w-12 h-12 rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors"
          />
          <div>
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {post.author?.full_name || "Anonymous"}
            </p>
            <p className="text-sm text-muted-foreground">
              {post.author?.location || "Earth"} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner && (
              <>
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => setReportOpen(true)}>
              <Flag className="h-4 w-4 mr-2" />
              Report Post
            </DropdownMenuItem>
            {user && user.id !== post.author_id && (
              <DropdownMenuItem onClick={handleBlock} className="text-destructive">
                Block User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Post Type Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="px-3 py-1 bg-secondary rounded-full text-sm font-medium">
          {postTypeLabels[post.post_type] || "Post"}
        </span>
        {post.cuisine && (
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {post.cuisine}
          </span>
        )}
      </div>

      {/* Title & Content */}
      {post.title && (
        <h3 className="font-serif text-xl font-semibold text-foreground mb-2">{post.title}</h3>
      )}
      <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>

      {/* Image */}
      {post.image_url && (
        <div className="rounded-xl overflow-hidden mb-4">
          <img
            src={post.image_url}
            alt={post.title || "Post image"}
            className="w-full aspect-video object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 transition-colors ${
              liked ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={() => setLikesOpen(true)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {likesCount}
          </button>
        </div>

        <button
          onClick={() => setCommentsOpen(true)}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{post.comments_count || 0}</span>
        </button>

        <button
          onClick={handleSave}
          className={`flex items-center gap-2 ml-auto transition-colors ${
            saved ? "text-honey" : "text-muted-foreground hover:text-honey"
          }`}
        >
          <Bookmark className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>

      <CommentsDialog postId={post.id} open={commentsOpen} onOpenChange={setCommentsOpen} />
      <ReportDialog postId={post.id} open={reportOpen} onOpenChange={setReportOpen} />
      <EditPostDialog post={post} open={editOpen} onOpenChange={setEditOpen} onSuccess={onUpdate} />
      <LikesDialog postId={post.id} open={likesOpen} onOpenChange={setLikesOpen} likesCount={likesCount} />
      
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
};

export default PostCard;
