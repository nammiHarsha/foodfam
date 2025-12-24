import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { format, isPast } from "date-fns";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Search, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type EventWithRSVP = {
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
  rsvp_count: number;
  has_rsvped: boolean;
};

type EventWithRSVP = Event & {
  rsvp_count: number;
  has_rsvped: boolean;
};

const Events = () => {
  const { user, roles } = useAuth();
  const [events, setEvents] = useState<EventWithRSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rsvping, setRsvping] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (!eventsData) {
        setLoading(false);
        return;
      }

      // Get RSVP counts and user's RSVPs
      const eventsWithRSVP = await Promise.all(
        eventsData.map(async (event) => {
          const { count } = await supabase
            .from("event_rsvps")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id);

          let has_rsvped = false;
          if (user) {
            const { data: rsvp } = await supabase
              .from("event_rsvps")
              .select("id")
              .eq("event_id", event.id)
              .eq("user_id", user.id)
              .maybeSingle();
            has_rsvped = !!rsvp;
          }

          return {
            ...event,
            rsvp_count: count || 0,
            has_rsvped,
          } as EventWithRSVP;
        })
      );

      setEvents(eventsWithRSVP);
      setLoading(false);
    };

    fetchEvents();
  }, [user]);

  const handleRSVP = async (eventId: string) => {
    if (!user) {
      toast.error("Please sign in to RSVP");
      return;
    }

    setRsvping(eventId);
    const event = events.find((e) => e.id === eventId);

    if (event?.has_rsvped) {
      // Cancel RSVP
      const { error } = await supabase
        .from("event_rsvps")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      if (!error) {
        setEvents(events.map((e) => 
          e.id === eventId 
            ? { ...e, has_rsvped: false, rsvp_count: e.rsvp_count - 1 }
            : e
        ));
        toast.success("RSVP cancelled");
      }
    } else {
      // Add RSVP
      const { error } = await supabase
        .from("event_rsvps")
        .insert({ event_id: eventId, user_id: user.id });

      if (!error) {
        setEvents(events.map((e) => 
          e.id === eventId 
            ? { ...e, has_rsvped: true, rsvp_count: e.rsvp_count + 1 }
            : e
        ));
        toast.success("RSVP confirmed!");
      }
    }
    setRsvping(null);
  };

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(search.toLowerCase()) ||
    event.location?.toLowerCase().includes(search.toLowerCase())
  );

  const upcomingEvents = filteredEvents.filter((e) => !isPast(new Date(e.event_date)));
  const pastEvents = filteredEvents.filter((e) => isPast(new Date(e.event_date)));

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <HelmetProvider>
      <SEOHead
        title="Community Events | FoodFam"
        description="Join food festivals, cooking workshops, and community gatherings"
      />
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold">Community Events</h1>
              <p className="text-muted-foreground mt-1">
                Food festivals, cooking workshops, and community gatherings
              </p>
            </div>
            {roles.includes("host") && (
              <Button variant="hero" asChild>
                <Link to="/events/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-serif text-xl mb-2">No events yet</h2>
              <p className="text-muted-foreground mb-6">Be the first to create a community event!</p>
              {roles.includes("host") && (
                <Button variant="hero" asChild>
                  <Link to="/events/create">Create Event</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <section className="mb-12">
                  <h2 className="font-serif text-2xl font-semibold mb-6">Upcoming Events</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingEvents.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event} 
                        onRSVP={handleRSVP}
                        rsvping={rsvping === event.id}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Past Events */}
              {pastEvents.length > 0 && (
                <section>
                  <h2 className="font-serif text-2xl font-semibold mb-6 text-muted-foreground">Past Events</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                    {pastEvents.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event} 
                        onRSVP={handleRSVP}
                        rsvping={rsvping === event.id}
                        isPast
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </Layout>
    </HelmetProvider>
  );
};

const EventCard = ({ 
  event, 
  onRSVP, 
  rsvping,
  isPast = false 
}: { 
  event: EventWithRSVP; 
  onRSVP: (id: string) => void;
  rsvping: boolean;
  isPast?: boolean;
}) => (
  <Link
    to={`/events/${event.id}`}
    className="group bg-card rounded-xl overflow-hidden shadow-warm hover:shadow-warm-lg transition-all"
  >
    <div className="aspect-video overflow-hidden relative">
      <img
        src={event.image_url || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600"}
        alt={event.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      {isPast && (
        <Badge className="absolute top-3 left-3 bg-foreground/80">Past Event</Badge>
      )}
      <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
        <p className="text-xs font-medium text-primary uppercase">
          {format(new Date(event.event_date), "MMM")}
        </p>
        <p className="text-xl font-bold">
          {format(new Date(event.event_date), "d")}
        </p>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
        {event.title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{event.description}</p>
      
      <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
        {event.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {event.location}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {event.rsvp_count} {event.max_attendees ? `/ ${event.max_attendees}` : ""} attending
        </span>
      </div>

      {!isPast && (
        <Button
          variant={event.has_rsvped ? "secondary" : "hero"}
          size="sm"
          className="w-full mt-4"
          disabled={rsvping}
          onClick={(e) => {
            e.preventDefault();
            onRSVP(event.id);
          }}
        >
          {event.has_rsvped ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              RSVP'd
            </>
          ) : (
            "RSVP"
          )}
        </Button>
      )}
    </div>
  </Link>
);

export default Events;
