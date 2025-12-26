import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChefHat, UtensilsCrossed } from "lucide-react";

const roles = [
  {
    icon: ChefHat,
    title: "Become a Host",
    description: "Share your culinary heritage and connect with food lovers from around the world.",
    cta: "Start Hosting",
    href: "/auth?mode=signup&role=host",
    color: "primary",
  },
  {
    icon: UtensilsCrossed,
    title: "Join as Guest",
    description: "Discover authentic local cuisines, book experiences, and create unforgettable memories.",
    cta: "Start Exploring",
    href: "/auth?mode=signup&role=guest",
    color: "accent",
  },
];

const CTASection = () => {
  return (
    <section className="py-20 bg-warm-gradient">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
            How Will You Join the Table?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you're a passionate home cook ready to share your heritage or looking to discover 
            authentic culinary experiences, there's a place for you in our community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {roles.map((role) => (
            <div
              key={role.title}
              className="bg-card rounded-2xl p-8 text-center shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className={`inline-flex p-4 rounded-2xl mb-6 ${
                role.color === 'primary' ? 'bg-primary/10' :
                role.color === 'accent' ? 'bg-accent/10' : 'bg-honey/10'
              }`}>
                <role.icon className={`h-8 w-8 ${
                  role.color === 'primary' ? 'text-primary' :
                  role.color === 'accent' ? 'text-accent' : 'text-honey'
                }`} />
              </div>

              <h3 className="font-serif text-2xl font-semibold text-foreground mb-3">
                {role.title}
              </h3>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                {role.description}
              </p>

              <Button
                variant={role.color === 'primary' ? 'terracotta' : role.color === 'accent' ? 'sage' : 'default'}
                className="w-full"
                asChild
              >
                <Link to={role.href}>{role.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CTASection;
