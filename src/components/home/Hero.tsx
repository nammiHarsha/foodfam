import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Utensils, Globe } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-hero-gradient overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 text-6xl opacity-20 animate-float">🥘</div>
      <div className="absolute bottom-40 left-10 text-5xl opacity-15 animate-float" style={{ animationDelay: "1s" }}>🍜</div>
      <div className="absolute top-40 left-1/4 text-4xl opacity-10 animate-float" style={{ animationDelay: "0.5s" }}>🥗</div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-secondary/80 backdrop-blur-sm rounded-full px-4 py-2 mb-8 animate-fade-in">
            <span className="text-sm font-medium text-muted-foreground">
              Join 10,000+ food lovers worldwide
            </span>
          </div>

          {/* Main headline */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-foreground leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Where Every Meal
            <br />
            <span className="text-primary">Becomes a Story</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Connect with passionate home cooks and travelers. Share authentic food experiences, 
            discover new cultures, and build friendships that last beyond the dinner table.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <Link to="/experiences">Explore Experiences</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-card shadow-warm">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">5,000+</p>
                <p className="text-sm text-muted-foreground">Active Hosts</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-card shadow-warm">
              <div className="p-2 rounded-lg bg-accent/10">
                <Utensils className="h-5 w-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">50+</p>
                <p className="text-sm text-muted-foreground">Cuisines</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-card shadow-warm">
              <div className="p-2 rounded-lg bg-honey/10">
                <Globe className="h-5 w-5 text-honey" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">120+</p>
                <p className="text-sm text-muted-foreground">Countries</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
