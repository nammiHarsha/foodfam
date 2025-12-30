import { useState } from "react";
import { HelmetProvider } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, Clock } from "lucide-react";
import PostCard from "@/components/community/PostCard";
import CreatePostDialog from "@/components/community/CreatePostDialog";
import GatedContent from "@/components/auth/GatedContent";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";

const Community = () => {
  const { user, authLoading } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const { posts, loading, refetch } = usePosts(sortBy);

  // Show gated content for non-logged users
  if (!authLoading && !user) {
    return (
      <HelmetProvider>
        <SEOHead
          title="Community Feed"
          description="Share your food stories, recipes, and travel memories with the FoodFam community."
        />
        <Layout>
          <GatedContent
            title="Join the FoodFam Community"
            description="Login or join FoodFam to share food stories, discover recipes, and connect with food lovers worldwide."
          />
        </Layout>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <SEOHead
        title="Community Feed"
        description="Share your food stories, recipes, and travel memories with the FoodFam community."
      />
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
                Community Feed
              </h1>
              <p className="text-muted-foreground">
                Share stories, recipes, and memories with food lovers worldwide
              </p>
            </div>
            {user && (
              <Button variant="hero" className="mt-4 sm:mt-0" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            )}
          </div>

          {/* Sort Tabs */}
          <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as "latest" | "popular")} className="mb-6">
            <TabsList className="bg-secondary">
              <TabsTrigger value="latest" className="gap-2">
                <Clock className="h-4 w-4" />
                Latest
              </TabsTrigger>
              <TabsTrigger value="popular" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Popular
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Posts Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-2xl p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-muted" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-muted rounded" />
                      <div className="w-24 h-3 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="w-full h-48 bg-muted rounded-xl mb-4" />
                  <div className="space-y-2">
                    <div className="w-3/4 h-4 bg-muted rounded" />
                    <div className="w-1/2 h-4 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">
                No posts yet. Be the first to share something!
              </p>
              {user && (
                <Button variant="hero" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onUpdate={refetch} />
              ))}
            </div>
          )}
        </div>

        <CreatePostDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={refetch} />
      </Layout>
    </HelmetProvider>
  );
};

export default Community;
