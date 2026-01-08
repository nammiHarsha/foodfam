import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { formatDistanceToNow, format } from "date-fns";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Users, Check, X, Clock, MessageCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Booking, Experience } from "@/types/database";

type BookingWithDetails = Booking & {
  experience: Experience;
  guest: { full_name: string | null; avatar_url: string | null; user_id: string };
};

const statusColors = {
  requested: "bg-honey/20 text-honey-foreground border-honey",
  approved: "bg-sage/20 text-sage-foreground border-sage",
  rejected: "bg-destructive/20 text-destructive border-destructive",
};

const HostDashboard = () => {
  // Auth and role checks are handled by ProtectedRoute wrapper
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleteExpId, setDeleteExpId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(`
          *,
          experience:experiences(*),
          guest:profiles!bookings_guest_profile_fkey(full_name, avatar_url, user_id)
        `)
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });

      setBookings((bookingsData as unknown as BookingWithDetails[]) || []);

      // Fetch experiences
      const { data: experiencesData } = await supabase
        .from("experiences")
        .select("*")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });

      setExperiences((experiencesData as unknown as Experience[]) || []);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const updateBookingStatus = async (bookingId: string, status: "approved" | "rejected") => {
    setUpdating(bookingId);
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId);

    if (error) {
      toast.error("Failed to update booking");
    } else {
      toast.success(`Booking ${status}`);
      setBookings(bookings.map((b) => 
        b.id === bookingId ? { ...b, status } : b
      ));
    }
    setUpdating(null);
  };

  const handleDeleteExperience = async () => {
    if (!deleteExpId) return;
    setDeleting(true);
    const { error } = await supabase.from("experiences").delete().eq("id", deleteExpId);
    if (error) {
      toast.error("Failed to delete experience");
    } else {
      toast.success("Experience deleted");
      setExperiences(experiences.filter(e => e.id !== deleteExpId));
    }
    setDeleting(false);
    setDeleteExpId(null);
  };

  const requestedBookings = bookings.filter((b) => b.status === "requested");
  const upcomingBookings = bookings.filter((b) => b.status === "approved");
  const pastBookings = bookings.filter((b) => b.status === "rejected");

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

  return (
    <HelmetProvider>
      <SEOHead title="Host Dashboard | FoodFam" description="Manage your experiences and bookings" />
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="font-serif text-3xl font-semibold">Host Dashboard</h1>
                <p className="text-muted-foreground">Manage your experiences and guest bookings</p>
              </div>
              <Button variant="hero" asChild>
                <Link to="/experiences/create">
                  <Plus className="h-4 w-4 mr-2" />
                  New Experience
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Experiences</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{experiences.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Pending Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-honey">{requestedBookings.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Confirmed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-sage">{upcomingBookings.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="requests" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="requests" className="relative">
                  Requests
                  {requestedBookings.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {requestedBookings.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="experiences">Experiences</TabsTrigger>
              </TabsList>

              {/* Requests Tab */}
              <TabsContent value="requests" className="space-y-4">
                {requestedBookings.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No pending booking requests</p>
                  </div>
                ) : (
                  requestedBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Guest Info */}
                          <div className="flex items-center gap-3 flex-1">
                            <img
                              src={booking.guest?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.guest_id}`}
                              alt={booking.guest?.full_name || "Guest"}
                              className="w-12 h-12 rounded-full"
                            />
                            <div>
                              <Link 
                                to={`/profile/${booking.guest?.user_id}`}
                                className="font-semibold hover:text-primary"
                              >
                                {booking.guest?.full_name || "Guest"}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>

                          {/* Booking Details */}
                          <div className="flex-1">
                            <Link 
                              to={`/experiences/${booking.experience_id}`}
                              className="font-medium hover:text-primary"
                            >
                              {booking.experience?.title}
                            </Link>
                            <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
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
                            {booking.message && (
                              <p className="mt-2 text-sm bg-secondary p-2 rounded">{booking.message}</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 items-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-sage text-sage hover:bg-sage hover:text-sage-foreground"
                              disabled={updating === booking.id}
                              onClick={() => updateBookingStatus(booking.id, "approved")}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              disabled={updating === booking.id}
                              onClick={() => updateBookingStatus(booking.id, "rejected")}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                            <Button size="sm" variant="ghost" asChild>
                              <Link to={`/messages?user=${booking.guest?.user_id}`}>
                                <MessageCircle className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Upcoming Tab */}
              <TabsContent value="upcoming" className="space-y-4">
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No upcoming confirmed bookings</p>
                  </div>
                ) : (
                  upcomingBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                          <div className="flex items-center gap-3 flex-1">
                            <img
                              src={booking.guest?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.guest_id}`}
                              alt={booking.guest?.full_name || "Guest"}
                              className="w-12 h-12 rounded-full"
                            />
                            <div>
                              <Link 
                                to={`/profile/${booking.guest?.user_id}`}
                                className="font-semibold hover:text-primary"
                              >
                                {booking.guest?.full_name || "Guest"}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                {booking.guests_count} guests
                              </p>
                            </div>
                          </div>

                          <div className="flex-1 text-center md:text-left">
                            <Link 
                              to={`/experiences/${booking.experience_id}`}
                              className="font-medium hover:text-primary"
                            >
                              {booking.experience?.title}
                            </Link>
                            {booking.booking_date && (
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(booking.booking_date), "EEEE, MMMM d, yyyy")}
                              </p>
                            )}
                          </div>

                          <Badge className={statusColors.approved}>Confirmed</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Experiences Tab */}
              <TabsContent value="experiences" className="space-y-4">
                {experiences.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl">
                    <p className="text-muted-foreground mb-4">You haven't created any experiences yet</p>
                    <Button variant="hero" asChild>
                      <Link to="/experiences/create">Create Your First Experience</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="group bg-card rounded-xl overflow-hidden shadow-warm hover:shadow-warm-lg transition-all">
                        <Link to={`/experiences/${exp.id}`}>
                          <div className="aspect-video overflow-hidden">
                            <img
                              src={exp.image_url || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600"}
                              alt={exp.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </Link>
                        <div className="p-4">
                          <Link to={`/experiences/${exp.id}`}>
                            <h3 className="font-semibold group-hover:text-primary transition-colors">{exp.title}</h3>
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">
                            ₹{exp.price_per_person}/person · Up to {exp.max_guests} guests
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/experiences/${exp.id}/edit`}>
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => setDeleteExpId(exp.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <AlertDialog open={!!deleteExpId} onOpenChange={(open) => !open && setDeleteExpId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Experience</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this experience? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteExperience} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Layout>
    </HelmetProvider>
  );
};

export default HostDashboard;
