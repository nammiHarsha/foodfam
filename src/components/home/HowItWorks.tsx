import { UserPlus, Search, CalendarCheck, Heart } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Tell us about yourself, your food preferences, and what kind of experiences you're looking for.",
  },
  {
    icon: Search,
    title: "Discover Experiences",
    description: "Browse authentic dining experiences hosted by locals, from traditional family recipes to fusion cuisine.",
  },
  {
    icon: CalendarCheck,
    title: "Book & Connect",
    description: "Reserve your spot, message your host, and get ready for an unforgettable culinary adventure.",
  },
  {
    icon: Heart,
    title: "Share the Love",
    description: "Leave reviews, share your experience with the community, and become part of the FoodFam family.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
            How FoodFam Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join our community in four simple steps and start creating memorable food experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-border" />
              )}

              <div className="relative z-10 flex flex-col items-center text-center p-6">
                {/* Step number */}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-warm">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors duration-300">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>

                {/* Content */}
                <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
