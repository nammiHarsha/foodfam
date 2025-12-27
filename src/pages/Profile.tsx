import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import { formatDistanceToNow } from "date-fns";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Globe, CheckCircle, Edit, Star, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PostCard from "@/components/community/PostCard";
import type { Profile, CommunityPost, Experience, Review } from "@/types/database";

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authLoading, profile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  // If viewing your own profile (/profile), require auth but don't redirect until auth is hydrated.
  useEffect(() => {
    if (id) return;
    if (authLoading) return;
    if (!user) navigate("/auth");
  }, [id, authLoading, user, navigate]);

  const isOwnProfile = user?.id === (id || user?.id);
  const profileId = id || user?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) return;

      // Check if blocked
      if (user && !isOwnProfile) {
        const { data: blockData } = await supabase
          .from("blocks")
          .select("id")
          .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`)
          .or(`blocker_id.eq.${profileId},blocked_id.eq.${profileId}`)
          .limit(1);

        if (blockData && blockData.length > 0) {
          setIsBlocked(true);
          setLoading(false);
          return;
        }
      }

      // Fetch profile
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", profileId)
        .maybeSingle();

      if (error || !profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData as Profile);

      // Fetch roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profileId);

      setRoles(rolesData?.map((r) => r.role) || []);

      // Fetch posts
      const { data: postsData } = await supabase
        .from("community_posts")
        .select("*")
        .eq("author_id", profileId)
        .order("created_at", { ascending: false });

      // Add author info to posts
      const postsWithAuthor = (postsData || []).map(post => ({
        ...post,
        author: profileData,
      }));

      setPosts(postsWithAuthor as CommunityPost[]);

      // Fetch experiences (if host)
      const { data: experiencesData } = await supabase
        .from("experiences")
        .select("*")
        .eq("host_id", profileId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setExperiences((experiencesData as unknown as Experience[]) || []);

      // Fetch reviews received
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewed_user_id", profileId)
        .order("created_at", { ascending: false });

      // Fetch reviewer profiles
      if (reviewsData && reviewsData.length > 0) {
        const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
        const { data: reviewerProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", reviewerIds);

        const reviewerMap = new Map(reviewerProfiles?.map(p => [p.user_id, p]) || []);
        const reviewsWithReviewers = reviewsData.map(review => ({
          ...review,
          reviewer: reviewerMap.get(review.reviewer_id) || null,
        }));
        setReviews(reviewsWithReviewers as Review[]);
      } else {
        setReviews([]);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [profileId, user, isOwnProfile]);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const isProfileComplete = profile?.full_name && profile?.bio && profile?.location;

  if (loading || (!id && authLoading)) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <Skeleton className="w-32 h-32 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isBlocked) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">This profile is not available.</p>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-serif text-2xl mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">This user doesn't exist or hasn't set up their profile yet.</p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <SEOHead
        title={`${profile.full_name || "User"} | FoodFam`}
        description={profile.bio || `Check out ${profile.full_name}'s profile on FoodFam`}
      />
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-card rounded-2xl p-6 md:p-8 shadow-warm mb-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <img
                    src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`}
                    alt={profile.full_name || "User"}
                    className="w-32 h-32 rounded-full border-4 border-border object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="font-serif text-2xl md:text-3xl font-semibold">
                      {profile.full_name || "FoodFam Member"}
                    </h1>
                    {isProfileComplete && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  {profile.username && (
                    <p className="text-muted-foreground mb-2">@{profile.username}</p>
                  )}

                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </span>
                    )}
                    {profile.languages && profile.languages.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        {profile.languages.join(", ")}
                      </span>
                    )}
                    {averageRating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-honey text-honey" />
                        {averageRating} ({reviews.length} reviews)
                      </span>
                    )}
                  </div>

                  {/* Roles */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {roles.map((role) => (
                      <Badge key={role} variant="outline" className="capitalize">
                        {role === "host" ? "🏠 Host" : role === "guest" ? "🍽️ Guest" : role === "admin" ? "⚙️ Admin" : role}
                      </Badge>
                    ))}
                  </div>

                  {profile.bio && (
                    <p className="text-foreground leading-relaxed">{profile.bio}</p>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-3">
                    {isOwnProfile ? (
                      <Button variant="outline" asChild>
                        <Link to="/settings/profile">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" asChild>
                        <Link to={`/messages?user=${profile.user_id}`}>
                          Message
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="about" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
                <TabsTrigger value="experiences">Experiences ({experiences.length})</TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-6">
                {/* Reviews Section */}
                <div className="bg-card rounded-xl p-6 shadow-warm">
                  <h3 className="font-serif text-xl font-semibold mb-4">
                    Reviews {reviews.length > 0 && `(${reviews.length})`}
                  </h3>
                  {reviews.length === 0 ? (
                    <p className="text-muted-foreground">No reviews yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.slice(0, 5).map((review) => (
                        <div key={review.id} className="border-b border-border pb-4 last:border-0">
                          <div className="flex items-center gap-3 mb-2">
                            <img
                              src={review.reviewer?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewer_id}`}
                              alt={review.reviewer?.full_name || "Reviewer"}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{review.reviewer?.full_name || "Guest"}</p>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < review.rating ? "fill-honey text-honey" : "text-muted"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {review.content && (
                            <p className="text-sm text-foreground">{review.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Posts Tab */}
              <TabsContent value="posts">
                {posts.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl">
                    <p className="text-muted-foreground">No posts yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Experiences Tab */}
              <TabsContent value="experiences">
                {experiences.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl">
                    <p className="text-muted-foreground">No experiences hosted yet.</p>
                    {isOwnProfile && roles.includes("host") && (
                      <Button variant="hero" className="mt-4" asChild>
                        <Link to="/experiences/create">Create Your First Experience</Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {experiences.map((exp) => (
                      <Link
                        key={exp.id}
                        to={`/experiences/${exp.id}`}
                        className="group bg-card rounded-xl overflow-hidden shadow-warm hover:shadow-warm-lg transition-all"
                      >
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={exp.image_url || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600"}
                            alt={exp.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">{exp.title}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {exp.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {exp.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Up to {exp.max_guests}
                            </span>
                          </div>
                          {exp.price_per_person && (
                            <p className="mt-2 font-semibold">${exp.price_per_person}/person</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default ProfilePage;
