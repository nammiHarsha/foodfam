import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { formatDistanceToNow } from "date-fns";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Users, Clock, Star, MessageCircle, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Experience, Review } from "@/types/database";

const experienceTypeLabels = {
  meal: "🍽️ Meal",
  cooking_class: "👨‍🍳 Cooking Class",
  festival: "🎉 Festival Experience",
};

const ExperienceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    guests_count: 1,
    booking_date: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchExperience = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("experiences")
        .select(`*, host:profiles!experiences_host_profile_fkey(*)`)
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        navigate("/experiences");
        return;
      }

      setExperience(data as unknown as Experience);

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select(`*, reviewer:profiles!reviews_reviewer_profile_fkey(*)`)
        .eq("experience_id", id)
        .order("created_at", { ascending: false });

      setReviews(reviewsData as unknown as Review[] || []);
      setLoading(false);
    };

    fetchExperience();
  }, [id, navigate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !experience) return;

    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      experience_id: experience.id,
      guest_id: user.id,
      host_id: experience.host_id,
      guests_count: bookingData.guests_count,
      booking_date: bookingData.booking_date || null,
      message: bookingData.message || null,
    });

    if (error) {
      toast.error("Failed to request booking");
      console.error(error);
    } else {
      toast.success("Booking requested! The host will review your request.");
      setBookingOpen(false);
    }
    setSubmitting(false);
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="w-full aspect-[21/9] bg-muted rounded-2xl" />
            <div className="w-1/2 h-10 bg-muted rounded" />
            <div className="w-1/3 h-6 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!experience) return null;

  return (
    <HelmetProvider>
      <SEOHead
        title={experience.title}
        description={experience.description || `Join ${experience.host?.full_name} for an authentic ${experience.cuisine_type} experience`}
      />
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Hero Image */}
          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-8">
            <img
              src={experience.image_url || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200"}
              alt={experience.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="inline-block px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
                {experienceTypeLabels[experience.experience_type]}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-primary-foreground">
                {experience.title}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Info */}
              <div className="flex flex-wrap gap-4">
                {experience.location && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{experience.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Up to {experience.max_guests} guests</span>
                </div>
                {experience.cuisine_type && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl">
                    <span>🍽️ {experience.cuisine_type}</span>
                  </div>
                )}
                {averageRating && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl">
                    <Star className="h-4 w-4 fill-honey text-honey" />
                    <span>{averageRating} ({reviews.length} reviews)</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <section>
                <h2 className="font-serif text-2xl font-semibold mb-4">About This Experience</h2>
                <p className="text-foreground leading-relaxed whitespace-pre-line">
                  {experience.description}
                </p>
              </section>

              {/* Story */}
              {experience.story && (
                <section>
                  <h2 className="font-serif text-2xl font-semibold mb-4">The Story Behind</h2>
                  <p className="text-foreground leading-relaxed whitespace-pre-line">
                    {experience.story}
                  </p>
                </section>
              )}

              {/* Reviews */}
              <section>
                <h2 className="font-serif text-2xl font-semibold mb-4">
                  Reviews {reviews.length > 0 && `(${reviews.length})`}
                </h2>
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews yet. Be the first to experience this!</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-card rounded-xl p-4 shadow-warm">
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={review.reviewer?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewer_id}`}
                            alt={review.reviewer?.full_name || "Reviewer"}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium">{review.reviewer?.full_name || "Guest"}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? "fill-honey text-honey" : "text-muted"}`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="ml-auto text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {review.content && (
                          <p className="text-foreground">{review.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar - Booking Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-2xl p-6 shadow-warm-lg">
                {/* Host Info */}
                <Link to={`/profile/${experience.host_id}`} className="flex items-center gap-3 mb-6 group">
                  <img
                    src={experience.host?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${experience.host_id}`}
                    alt={experience.host?.full_name || "Host"}
                    className="w-14 h-14 rounded-full border-2 border-border group-hover:border-primary transition-colors"
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">Hosted by</p>
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {experience.host?.full_name || "Host"}
                    </p>
                  </div>
                </Link>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-3xl font-bold">₹{experience.price_per_person || 0}</span>
                  <span className="text-muted-foreground"> / person</span>
                </div>

                {/* Actions */}
                {user ? (
                  user.id === experience.host_id ? (
                    <p className="text-center text-muted-foreground py-4">
                      This is your experience
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <Button variant="hero" className="w-full" onClick={() => setBookingOpen(true)}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Request Booking
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to={`/messages?user=${experience.host_id}`}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message Host
                        </Link>
                      </Button>
                    </div>
                  )
                ) : (
                  <Button variant="hero" className="w-full" asChild>
                    <Link to="/auth?mode=signup">Sign up to Book</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Dialog */}
        <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Request Booking</DialogTitle>
              <DialogDescription>
                Send a booking request to {experience.host?.full_name}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guests">Number of Guests</Label>
                  <Input
                    id="guests"
                    type="number"
                    min={1}
                    max={experience.max_guests}
                    value={bookingData.guests_count}
                    onChange={(e) => setBookingData({ ...bookingData, guests_count: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Preferred Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={bookingData.booking_date}
                    onChange={(e) => setBookingData({ ...bookingData, booking_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message to Host</Label>
                <Textarea
                  id="message"
                  placeholder="Introduce yourself and share any dietary requirements..."
                  value={bookingData.message}
                  onChange={(e) => setBookingData({ ...bookingData, message: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>

              <div className="bg-secondary rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span>₹{experience.price_per_person} × {bookingData.guests_count} guests</span>
                  <span>₹{(experience.price_per_person || 0) * bookingData.guests_count}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>₹{(experience.price_per_person || 0) * bookingData.guests_count}</span>
                </div>
              </div>

              <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
                {submitting ? "Sending..." : "Send Request"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </Layout>
    </HelmetProvider>
  );
};

export default ExperienceDetail;
