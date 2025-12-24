import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, ArrowRight } from "lucide-react";

// Placeholder community posts
const communityPosts = [
  {
    id: "1",
    author: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
      location: "San Francisco, USA",
    },
    content: "Just had the most incredible dumpling-making experience in Shanghai! The grandmother who taught us has been making these for 60 years. This is what FoodFam is all about! 🥟✨",
    image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&auto=format&fit=crop&q=60",
    likes: 128,
    comments: 24,
    timeAgo: "2 hours ago",
  },
  {
    id: "2",
    author: {
      name: "Marco B.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
      location: "Barcelona, Spain",
    },
    content: "Sharing my grandmother's secret paella recipe with my FoodFam guests tonight! Nothing brings people together like food and stories. Who's joining us next week? 🥘",
    likes: 89,
    comments: 15,
    timeAgo: "5 hours ago",
  },
];

const CommunityPreview = () => {
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {communityPosts.map((post) => (
            <article
              key={post.id}
              className="bg-card rounded-2xl p-6 shadow-warm hover:shadow-warm-lg transition-shadow duration-300"
            >
              {/* Author */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-foreground">{post.author.name}</p>
                  <p className="text-sm text-muted-foreground">{post.author.location}</p>
                </div>
                <span className="ml-auto text-sm text-muted-foreground">{post.timeAgo}</span>
              </div>

              {/* Content */}
              <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>

              {/* Image */}
              {post.image && (
                <div className="rounded-xl overflow-hidden mb-4">
                  <img
                    src={post.image}
                    alt="Post image"
                    className="w-full aspect-video object-cover"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-6 pt-4 border-t border-border">
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Heart className="h-5 w-5" />
                  <span className="text-sm font-medium">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{post.comments}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunityPreview;
