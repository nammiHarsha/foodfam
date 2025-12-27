import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { formatDistanceToNow, format, isPast } from "date-fns";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, MapPin, Star, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ReviewDialog from "@/components/reviews/ReviewDialog";
import type { Booking, Experience } from "@/types/database";

type BookingWithDetails = Booking & {
  experience: Experience & {
    host: { full_name: string | null; avatar_url: string | null; user_id: string };
  };
};

const statusColors = {
  requested: "bg-honey/20 text-honey-foreground border-honey",
  approved: "bg-sage/20 text-sage-foreground border-sage",
  rejected: "bg-destructive/20 text-destructive border-destructive",
};

const statusLabels = {
  requested: "Pending",
  approved: "Confirmed",
  rejected: "Declined",
};

const MyTrips = () => {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewBooking, setReviewBooking] = useState<BookingWithDetails | null>(null);
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());

  // Protected route guard: never redirect while auth is still hydrating.
  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-10 w-48" />
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  useEffect(() => {
    const fetchBookings = async () => {
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(`
          *,
          experience:experiences(
            *,
            host:profiles!experiences_host_id_fkey(full_name, avatar_url, user_id)
          )
        `)
        .eq("guest_id", user.id)
        .order("created_at", { ascending: false });

      setBookings((bookingsData as unknown as BookingWithDetails[]) || []);

      // Check which bookings have reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("experience_id")
        .eq("reviewer_id", user.id);

      const reviewedIds = new Set(reviewsData?.map((r) => r.experience_id) || []);
      setReviewedBookings(reviewedIds as Set<string>);

      setLoading(false);
    };

    fetchBookings();
  }, [user, authLoading, navigate]);

  const upcomingBookings = bookings.filter((b) => 
    b.status === "approved" && (!b.booking_date || !isPast(new Date(b.booking_date)))
  );
  const pastBookings = bookings.filter((b) => 
    b.status === "approved" && b.booking_date && isPast(new Date(b.booking_date))
  );
  const pendingBookings = bookings.filter((b) => b.status === "requested");
  const declinedBookings = bookings.filter((b) => b.status === "rejected");

  const canReview = (booking: BookingWithDetails) => {
    return (
      booking.status === "approved" &&
      booking.booking_date &&
      isPast(new Date(booking.booking_date)) &&
      !reviewedBookings.has(booking.experience_id)
    );
  };

  const handleReviewSubmitted = (experienceId: string) => {
    setReviewedBookings((prev) => new Set([...prev, experienceId]));
    setReviewBooking(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-10 w-48" />
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const BookingCard = ({ booking }: { booking: BookingWithDetails }) => (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <Link 
            to={`/experiences/${booking.experience_id}`}
            className="md:w-48 aspect-video md:aspect-square shrink-0 overflow-hidden"
          >
            <img
              src={booking.experience?.image_url || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"}
              alt={booking.experience?.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Content */}
          <div className="flex-1 p-4 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <Link 
                to={`/experiences/${booking.experience_id}`}
                className="font-serif text-lg font-semibold hover:text-primary"
              >
                {booking.experience?.title}
              </Link>
              <Badge className={statusColors[booking.status]}>
                {statusLabels[booking.status]}
              </Badge>
            </div>

            {/* Host */}
            <Link 
              to={`/profile/${booking.experience?.host?.user_id}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
            >
              <img
                src={booking.experience?.host?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.experience?.host_id}`}
                alt={booking.experience?.host?.full_name || "Host"}
                className="w-6 h-6 rounded-full"
              />
              <span>Hosted by {booking.experience?.host?.full_name || "Host"}</span>
            </Link>

            {/* Details */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
              {booking.experience?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {booking.experience.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {booking.guests_count} guests
              </span>
              {booking.booking_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(booking.booking_date), "MMM d, yyyy")}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {canReview(booking) && (
                <Button
                  size="sm"
                  variant="hero"
                  onClick={() => setReviewBooking(booking)}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Leave Review
                </Button>
              )}
              {reviewedBookings.has(booking.experience_id) && (
                <Badge variant="secondary">
                  <Star className="h-3 w-3 mr-1 fill-honey text-honey" />
                  Reviewed
                </Badge>
              )}
              <Button size="sm" variant="outline" asChild>
                <Link to={`/messages?user=${booking.experience?.host?.user_id}`}>
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Message
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <HelmetProvider>
      <SEOHead title="My Trips | FoodFam" description="View your upcoming and past food experiences" />
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="font-serif text-3xl font-semibold">My Trips</h1>
              <p className="text-muted-foreground">Your food experience journey</p>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="font-serif text-xl mb-2">No trips yet</h2>
                <p className="text-muted-foreground mb-6">Discover amazing food experiences and book your first trip!</p>
                <Button variant="hero" asChild>
                  <Link to="/experiences">Explore Experiences</Link>
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="upcoming" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="upcoming">
                    Upcoming ({upcomingBookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    Pending ({pendingBookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="past">
                    Past ({pastBookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="declined">
                    Declined ({declinedBookings.length})
                  </TabsTrigger>
                </TabsList>

                {/* Upcoming */}
                <TabsContent value="upcoming" className="space-y-4">
                  {upcomingBookings.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl">
                      <p className="text-muted-foreground">No upcoming trips</p>
                    </div>
                  ) : (
                    upcomingBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))
                  )}
                </TabsContent>

                {/* Pending */}
                <TabsContent value="pending" className="space-y-4">
                  {pendingBookings.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl">
                      <p className="text-muted-foreground">No pending requests</p>
                    </div>
                  ) : (
                    pendingBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))
                  )}
                </TabsContent>

                {/* Past */}
                <TabsContent value="past" className="space-y-4">
                  {pastBookings.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl">
                      <p className="text-muted-foreground">No past trips</p>
                    </div>
                  ) : (
                    pastBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))
                  )}
                </TabsContent>

                {/* Declined */}
                <TabsContent value="declined" className="space-y-4">
                  {declinedBookings.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl">
                      <p className="text-muted-foreground">No declined bookings</p>
                    </div>
                  ) : (
                    declinedBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>

        {/* Review Dialog */}
        {reviewBooking && (
          <ReviewDialog
            open={!!reviewBooking}
            onOpenChange={(open) => !open && setReviewBooking(null)}
            experienceId={reviewBooking.experience_id}
            hostId={reviewBooking.host_id}
            experienceTitle={reviewBooking.experience?.title || "Experience"}
            onReviewSubmitted={() => handleReviewSubmitted(reviewBooking.experience_id)}
          />
        )}
      </Layout>
    </HelmetProvider>
  );
};

export default MyTrips;
