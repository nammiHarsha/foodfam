import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Users, ArrowRight } from "lucide-react";

// Placeholder experiences for the MVP
const featuredExperiences = [
  {
    id: "1",
    title: "Traditional Italian Pasta Making",
    host: "Maria R.",
    location: "Rome, Italy",
    cuisine: "Italian",
    rating: 4.9,
    reviews: 47,
    maxGuests: 6,
    price: 45,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "2",
    title: "Japanese Home Cooking Class",
    host: "Yuki T.",
    location: "Tokyo, Japan",
    cuisine: "Japanese",
    rating: 5.0,
    reviews: 32,
    maxGuests: 4,
    price: 55,
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "3",
    title: "Mexican Street Food Fiesta",
    host: "Carlos M.",
    location: "Mexico City, Mexico",
    cuisine: "Mexican",
    rating: 4.8,
    reviews: 89,
    maxGuests: 8,
    price: 35,
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=60",
  },
];

const FeaturedExperiences = () => {
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredExperiences.map((experience) => (
            <Link
              key={experience.id}
              to={`/experiences/${experience.id}`}
              className="group bg-card rounded-2xl overflow-hidden shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={experience.image}
                  alt={experience.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-sm font-medium">
                  {experience.cuisine}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 fill-honey text-honey" />
                  <span className="font-semibold text-foreground">{experience.rating}</span>
                  <span className="text-muted-foreground text-sm">
                    ({experience.reviews} reviews)
                  </span>
                </div>

                <h3 className="font-serif text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {experience.title}
                </h3>

                <p className="text-muted-foreground text-sm mb-3">
                  Hosted by {experience.host}
                </p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {experience.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Up to {experience.maxGuests}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-foreground">
                    <span className="font-semibold text-lg">${experience.price}</span>
                    <span className="text-muted-foreground text-sm"> / person</span>
                  </span>
                  <Button variant="terracotta" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedExperiences;
