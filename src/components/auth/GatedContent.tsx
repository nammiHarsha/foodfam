import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface GatedContentProps {
  title?: string;
  description?: string;
}

const GatedContent = ({ 
  title = "Join FoodFam to Explore", 
  description = "Login or join FoodFam to explore food experiences, connect with hosts, and discover amazing culinary adventures." 
}: GatedContentProps) => {
  return (
    <div className="relative min-h-[60vh] flex items-center justify-center">
      {/* Blurred background placeholder */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 blur-lg opacity-30">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-muted rounded-xl h-64" />
          ))}
        </div>
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      {/* CTA Content */}
      <div className="relative z-10 text-center px-6 py-12 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mb-4">
          {title}
        </h2>
        
        <p className="text-muted-foreground mb-8">
          {description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="hero" size="lg" asChild>
            <Link to="/auth?mode=signup">Join FoodFam</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GatedContent;
