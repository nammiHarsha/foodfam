import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { format, isPast } from "date-fns";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Calendar, MapPin, Users, Clock, Check, Share2, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Profile } from "@/types/database";

type EventWithDetails = {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  image_url: string | null;
  max_attendees: number | null;
  created_at: string;
  updated_at: string;
  host: Profile | null;
  attendees: { user_id: string; profile: Profile }[];
  rsvp_count: number;
  has_rsvped: boolean;
};

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvping, setRsvping] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user?.id === event?.host_id;

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      const { data: eventData, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !eventData) {
        navigate("/events");
        return;
      }

      // Fetch host profile separately
      const { data: hostProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", eventData.host_id)
        .maybeSingle();

      // Get RSVPs
      const { data: rsvps } = await supabase
        .from("event_rsvps")
        .select("user_id")
        .eq("event_id", id);

      const attendeeIds = rsvps?.map((r) => r.user_id) || [];
      
      // Get attendee profiles
      let attendees: { user_id: string; profile: Profile }[] = [];
      if (attendeeIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", attendeeIds);

        attendees = profiles?.map((p) => ({ user_id: p.user_id, profile: p as Profile })) || [];
      }

      const has_rsvped = user ? attendeeIds.includes(user.id) : false;

      setEvent({
        ...eventData,
        host: hostProfile as Profile | null,
        attendees,
        rsvp_count: attendeeIds.length,
        has_rsvped,
      });

      setLoading(false);
    };

    fetchEvent();
  }, [id, user, navigate]);

  const handleRSVP = async () => {
    if (!user || !event) {
      toast.error("Please sign in to RSVP");
      return;
    }

    setRsvping(true);

    if (event.has_rsvped) {
      const { error } = await supabase
        .from("event_rsvps")
        .delete()
        .eq("event_id", event.id)
        .eq("user_id", user.id);

      if (!error) {
        setEvent({
          ...event,
          has_rsvped: false,
          rsvp_count: event.rsvp_count - 1,
          attendees: event.attendees.filter((a) => a.user_id !== user.id),
        });
        toast.success("RSVP cancelled");
      }
    } else {
      const { error } = await supabase
        .from("event_rsvps")
        .insert({ event_id: event.id, user_id: user.id });

      if (!error) {
        // Get current user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        setEvent({
          ...event,
          has_rsvped: true,
          rsvp_count: event.rsvp_count + 1,
          attendees: [...event.attendees, { user_id: user.id, profile: profile as Profile }],
        });
        toast.success("RSVP confirmed!");
      }
    }
    setRsvping(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Event link copied to clipboard!");
  };

  const handleDelete = async () => {
    if (!event) return;
    setDeleting(true);
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) {
      toast.error("Failed to delete event");
    } else {
      toast.success("Event deleted");
      navigate("/events");
    }
    setDeleting(false);
  };

  const eventIsPast = event ? isPast(new Date(event.event_date)) : false;

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="w-full aspect-[21/9] rounded-2xl mb-8" />
          <Skeleton className="h-10 w-1/2 mb-4" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      </Layout>
    );
  }

  if (!event) return null;

  return (
    <HelmetProvider>
      <SEOHead
        title={`${event.title} | FoodFam Events`}
        description={event.description || `Join us for ${event.title}`}
      />
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Hero Image */}
          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-8">
            <img
              src={event.image_url || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200"}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              {eventIsPast && (
                <Badge className="mb-4 bg-foreground/80">Past Event</Badge>
              )}
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-primary-foreground">
                {event.title}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Details */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{format(new Date(event.event_date), "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{format(new Date(event.event_date), "h:mm a")}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl">
                  <Users className="h-4 w-4 text-primary" />
                  <span>
                    {event.rsvp_count} attending
                    {event.max_attendees && ` / ${event.max_attendees} max`}
                  </span>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <section>
                  <h2 className="font-serif text-2xl font-semibold mb-4">About This Event</h2>
                  <p className="text-foreground leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                </section>
              )}

              {/* Attendees */}
              <section>
                <h2 className="font-serif text-2xl font-semibold mb-4">
                  Who's Coming ({event.rsvp_count})
                </h2>
                {event.attendees.length === 0 ? (
                  <p className="text-muted-foreground">Be the first to RSVP!</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {event.attendees.slice(0, 20).map((attendee) => (
                      <Link
                        key={attendee.user_id}
                        to={`/profile/${attendee.user_id}`}
                        className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
                      >
                        <img
                          src={attendee.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${attendee.user_id}`}
                          alt={attendee.profile?.full_name || "Attendee"}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm font-medium">
                          {attendee.profile?.full_name || "Guest"}
                        </span>
                      </Link>
                    ))}
                    {event.attendees.length > 20 && (
                      <span className="flex items-center px-3 py-2 text-sm text-muted-foreground">
                        +{event.attendees.length - 20} more
                      </span>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-2xl p-6 shadow-warm-lg">
                {/* Host */}
                <Link to={`/profile/${event.host?.user_id}`} className="flex items-center gap-3 mb-6 group">
                  <img
                    src={event.host?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.host_id}`}
                    alt={event.host?.full_name || "Host"}
                    className="w-14 h-14 rounded-full border-2 border-border group-hover:border-primary transition-colors"
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">Hosted by</p>
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {event.host?.full_name || "Host"}
                    </p>
                  </div>
                </Link>

                {/* Actions */}
                {!eventIsPast && (
                  <div className="space-y-3">
                    <Button
                      variant={event.has_rsvped ? "secondary" : "hero"}
                      className="w-full"
                      disabled={rsvping}
                      onClick={handleRSVP}
                    >
                      {event.has_rsvped ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          RSVP'd - Cancel
                        </>
                      ) : (
                        "RSVP to Event"
                      )}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Event
                    </Button>
                    {isOwner && (
                      <>
                        <Button variant="outline" className="w-full" asChild>
                          <Link to={`/events/${event.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Event
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => setDeleteOpen(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Event
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {eventIsPast && (
                  <p className="text-center text-muted-foreground">
                    This event has ended
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this event? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Layout>
    </HelmetProvider>
  );
};

export default EventDetail;
