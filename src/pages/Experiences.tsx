import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, MapPin, Users, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Experience } from "@/types/database";

const experienceTypeLabels = {
  meal: "🍽️ Meal",
  cooking_class: "👨‍🍳 Cooking Class",
  festival: "🎉 Festival",
};

const Experiences = () => {
  const { user, roles } = useAuth();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("all");

  const isHost = roles.includes("host");

  useEffect(() => {
    const fetchExperiences = async () => {
      let query = supabase
        .from("experiences")
        .select(`*, host:profiles!experiences_host_id_fkey(*)`)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (!error) {
        setExperiences(data as unknown as Experience[] || []);
      }
      setLoading(false);
    };

    fetchExperiences();
  }, []);

  const filteredExperiences = experiences.filter((exp) => {
    const matchesSearch =
      exp.title.toLowerCase().includes(search.toLowerCase()) ||
      exp.description?.toLowerCase().includes(search.toLowerCase()) ||
      exp.location?.toLowerCase().includes(search.toLowerCase());
    const matchesCuisine = cuisineFilter === "all" || exp.cuisine_type === cuisineFilter;
    return matchesSearch && matchesCuisine;
  });

  const cuisines = [...new Set(experiences.map((e) => e.cuisine_type).filter(Boolean))];

  return (
    <HelmetProvider>
      <SEOHead
        title="Food Experiences"
        description="Discover authentic dining experiences, cooking classes, and food festivals hosted by passionate locals around the world."
      />
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
                Food Experiences
              </h1>
              <p className="text-muted-foreground">
                Discover authentic culinary adventures hosted by passionate locals
              </p>
            </div>
            {isHost && (
              <Button variant="hero" className="mt-4 sm:mt-0" asChild>
                <Link to="/experiences/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Host Experience
                </Link>
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search experiences..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Cuisines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cuisines</SelectItem>
                {cuisines.map((cuisine) => (
                  <SelectItem key={cuisine} value={cuisine!}>
                    {cuisine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Experiences Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-6 space-y-3">
                    <div className="w-3/4 h-6 bg-muted rounded" />
                    <div className="w-1/2 h-4 bg-muted rounded" />
                    <div className="w-full h-4 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredExperiences.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">
                No experiences found. {isHost ? "Be the first to host one!" : "Check back soon!"}
              </p>
              {isHost && (
                <Button variant="hero" asChild>
                  <Link to="/experiences/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Experience
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiences.map((experience) => (
                <Link
                  key={experience.id}
                  to={`/experiences/${experience.id}`}
                  className="group bg-card rounded-2xl overflow-hidden shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={experience.image_url || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"}
                      alt={experience.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-sm font-medium">
                        {experienceTypeLabels[experience.experience_type]}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-4 w-4 fill-honey text-honey" />
                      <span className="font-semibold">4.9</span>
                      <span className="text-muted-foreground text-sm">(New)</span>
                    </div>

                    <h3 className="font-serif text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {experience.title}
                    </h3>

                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {experience.description}
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
                      <div className="flex items-center gap-2">
                        <img
                          src={experience.host?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${experience.host_id}`}
                          alt={experience.host?.full_name || "Host"}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-sm text-muted-foreground">
                          {experience.host?.full_name || "Host"}
                        </span>
                      </div>
                      <span className="font-semibold">
                        ${experience.price_per_person || 0}
                        <span className="text-muted-foreground font-normal text-sm"> / person</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </HelmetProvider>
  );
};

export default Experiences;
