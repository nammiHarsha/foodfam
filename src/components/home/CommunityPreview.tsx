import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { CommunityPost } from "@/types/database";

// Placeholder community posts (shown when not logged in)
const placeholderPosts = [
  {
    id: "placeholder-1",
    author: {
      full_name: "Sarah Chen",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
      location: "San Francisco, USA",
    },
    content: "Just had the most incredible dumpling-making experience in Shanghai! The grandmother who taught us has been making these for 60 years. This is what FoodFam is all about! 🥟✨",
    image_url: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&auto=format&fit=crop&q=60",
    likes_count: 128,
    comments_count: 24,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "placeholder-2",
    author: {
      full_name: "Marco B.",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
      location: "Barcelona, Spain",
    },
    content: "Sharing my grandmother's secret paella recipe with my FoodFam guests tonight! Nothing brings people together like food and stories. Who's joining us next week? 🥘",
    likes_count: 89,
    comments_count: 15,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
];

const CommunityPreview = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) {
        setPosts([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          author:profiles!community_posts_author_profile_fkey(*)
        `)
        .order("created_at", { ascending: false })
        .limit(2);

      if (error) {
        console.error("Error fetching posts:", error);
        setPosts([]);
      } else {
        setPosts(data as unknown as CommunityPost[] || []);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [user]);

  // Use placeholder when not logged in, real data when logged in
  const displayPosts = user ? posts : placeholderPosts;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
              From Our Community
            </h2>
            <p className="text-muted-foreground">
              Stories, tips, and moments shared by our global food family
            </p>
          </div>
          <Button variant="ghost" asChild className="mt-4 sm:mt-0">
            <Link to="/community">
              Join the Conversation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-6 shadow-warm">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="aspect-video w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : user && posts.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl">
            <p className="text-muted-foreground mb-4">No community posts yet. Be the first to share!</p>
            <Button variant="hero" asChild>
              <Link to="/community">Visit Community</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {displayPosts.map((post) => {
              const isPlaceholder = post.id.startsWith("placeholder-");
              const author = post.author;
              
              return (
                <article
                  key={post.id}
                  className="bg-card rounded-2xl p-6 shadow-warm hover:shadow-warm-lg transition-shadow duration-300"
                >
                  {/* Author */}
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.id}`}
                      alt={author?.full_name || "User"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-foreground">{author?.full_name || "Anonymous"}</p>
                      <p className="text-sm text-muted-foreground">{author?.location || "Earth"}</p>
                    </div>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>

                  {/* Image */}
                  {post.image_url && (
                    <div className="rounded-xl overflow-hidden mb-4">
                      <img
                        src={post.image_url}
                        alt="Post image"
                        className="w-full aspect-video object-cover"
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-6 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Heart className="h-5 w-5" />
                      <span className="text-sm font-medium">{post.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">{post.comments_count || 0}</span>
                    </div>
                    {!isPlaceholder && (
                      <Link 
                        to="/community" 
                        className="ml-auto text-sm text-primary hover:underline"
                      >
                        View in Community
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default CommunityPreview;
