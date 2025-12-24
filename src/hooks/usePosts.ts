import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CommunityPost } from "@/types/database";

export const usePosts = (sortBy: "latest" | "popular" = "latest") => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    
    let query = supabase
      .from("community_posts")
      .select(`
        *,
        author:profiles!community_posts_author_id_fkey(*)
      `);

    if (sortBy === "popular") {
      query = query.order("likes_count", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      setPosts(data as unknown as CommunityPost[] || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [sortBy]);

  return { posts, loading, refetch: fetchPosts };
};

export const usePostInteractions = (postId: string) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const checkStatus = async (userId: string) => {
    const [likeRes, saveRes] = await Promise.all([
      supabase.from("post_likes").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle(),
      supabase.from("saved_posts").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle(),
    ]);
    setLiked(!!likeRes.data);
    setSaved(!!saveRes.data);
  };

  const toggleLike = async (userId: string) => {
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
      setLiked(false);
      setLikesCount((c) => c - 1);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
      setLiked(true);
      setLikesCount((c) => c + 1);
    }
  };

  const toggleSave = async (userId: string) => {
    if (saved) {
      await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", userId);
      setSaved(false);
    } else {
      await supabase.from("saved_posts").insert({ post_id: postId, user_id: userId });
      setSaved(true);
    }
  };

  return { liked, saved, likesCount, setLikesCount, checkStatus, toggleLike, toggleSave };
};
