import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface LikeUser {
  user_id: string;
  profile: {
    user_id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface LikesDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  likesCount: number;
}

const LikesDialog = ({ postId, open, onOpenChange, likesCount }: LikesDialogProps) => {
  const [likes, setLikes] = useState<LikeUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && likesCount > 0) {
      fetchLikes();
    }
  }, [open, postId]);

  const fetchLikes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("post_likes")
      .select("user_id")
      .eq("post_id", postId)
      .limit(50);

    if (data && data.length > 0) {
      // Fetch profiles for these users
      const userIds = data.map((l) => l.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      
      setLikes(
        data.map((l) => ({
          user_id: l.user_id,
          profile: profileMap.get(l.user_id) || null,
        }))
      );
    } else {
      setLikes([]);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">Liked by</DialogTitle>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto space-y-3 py-2">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="w-24 h-4 bg-muted rounded" />
                    <div className="w-16 h-3 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : likes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No likes yet</p>
          ) : (
            likes.map((like) => (
              <Link
                key={like.user_id}
                to={`/profile/${like.user_id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                onClick={() => onOpenChange(false)}
              >
                <img
                  src={like.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${like.user_id}`}
                  alt={like.profile?.full_name || "User"}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-sm">{like.profile?.full_name || "Anonymous"}</p>
                  {like.profile?.username && (
                    <p className="text-xs text-muted-foreground">@{like.profile.username}</p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LikesDialog;
