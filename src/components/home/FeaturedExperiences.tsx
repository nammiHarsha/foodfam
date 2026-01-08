import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Users, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Experience } from "@/types/database";

// Placeholder experiences for the MVP (shown when not logged in)
const placeholderExperiences = [
  {
    id: "placeholder-1",
    title: "Traditional Italian Pasta Making",
    host: { full_name: "Maria R." },
    location: "Rome, Italy",
    cuisine_type: "Italian",
    rating: 4.9,
    reviews: 47,
    max_guests: 6,
    price_per_person: 2500,
    image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "placeholder-2",
    title: "Japanese Home Cooking Class",
    host: { full_name: "Yuki T." },
    location: "Tokyo, Japan",
    cuisine_type: "Japanese",
    rating: 5.0,
    reviews: 32,
    max_guests: 4,
    price_per_person: 3500,
    image_url: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "placeholder-3",
    title: "Mexican Street Food Fiesta",
    host: { full_name: "Carlos M." },
    location: "Mexico City, Mexico",
    cuisine_type: "Mexican",
    rating: 4.8,
    reviews: 89,
    max_guests: 8,
    price_per_person: 1800,
    image_url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=60",
  },
];

type ExperienceWithHost = Experience & {
  host?: { full_name: string | null };
  reviewsCount?: number;
  avgRating?: number;
};

const FeaturedExperiences = () => {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState<ExperienceWithHost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchExperiences = async () => {
      if (!user) {
        setExperiences([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("experiences")
        .select(`
          *,
          host:profiles!experiences_host_profile_fkey(full_name)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error fetching experiences:", error);
        setExperiences([]);
      } else {
        // Fetch review stats for each experience
        const experiencesWithReviews = await Promise.all(
          (data || []).map(async (exp) => {
            const { data: reviews } = await supabase
              .from("reviews")
              .select("rating")
              .eq("experience_id", exp.id);
            
            const reviewsCount = reviews?.length || 0;
            const avgRating = reviewsCount > 0 
              ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewsCount 
              : 0;
            
            return { ...exp, reviewsCount, avgRating };
          })
        );
        setExperiences(experiencesWithReviews as ExperienceWithHost[]);
      }
      setLoading(false);
    };

    fetchExperiences();
  }, [user]);

  // Use placeholder data when not logged in, real data when logged in
  const displayExperiences = user 
    ? (experiences.length > 0 ? experiences : [])
    : placeholderExperiences;

  const showPlaceholder = !user || (user && experiences.length === 0 && !loading);

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
              Featured Experiences
            </h2>
            <p className="text-muted-foreground">
              Discover authentic culinary adventures hosted by passionate locals
            </p>
          </div>
          <Button variant="ghost" asChild className="mt-4 sm:mt-0">
            <Link to="/experiences">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-warm">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : user && experiences.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl">
            <p className="text-muted-foreground mb-4">No experiences available yet.</p>
            <Button variant="hero" asChild>
              <Link to="/experiences">Browse All Experiences</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(user ? experiences : placeholderExperiences).map((experience) => {
              const isPlaceholder = experience.id.startsWith("placeholder-");
              const rating = 'avgRating' in experience ? experience.avgRating : ('rating' in experience ? experience.rating : 0);
              const reviewsCount = 'reviewsCount' in experience ? experience.reviewsCount : ('reviews' in experience ? experience.reviews : 0);
              const price = experience.price_per_person;
              const hostName = experience.host?.full_name || "Host";
              const cuisine = experience.cuisine_type || ('cuisine_type' in experience ? experience.cuisine_type : "");

              return (
                <Link
                  key={experience.id}
                  to={isPlaceholder ? "/experiences" : `/experiences/${experience.id}`}
                  className="group bg-card rounded-2xl overflow-hidden shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={experience.image_url || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"}
                      alt={experience.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {cuisine && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-sm font-medium">
                        {cuisine}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {(rating as number) > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 fill-honey text-honey" />
                        <span className="font-semibold text-foreground">{(rating as number).toFixed(1)}</span>
                        <span className="text-muted-foreground text-sm">
                          ({reviewsCount} {(reviewsCount as number) === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    )}

                    <h3 className="font-serif text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {experience.title}
                    </h3>

                    <p className="text-muted-foreground text-sm mb-3">
                      Hosted by {hostName}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {experience.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {experience.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Up to {experience.max_guests}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-foreground">
                        <span className="font-semibold text-lg">₹{price}</span>
                        <span className="text-muted-foreground text-sm"> / person</span>
                      </span>
                      <Button variant="terracotta" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedExperiences;
