import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Users, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CreateEvent = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    event_date: "",
    event_time: "",
    max_attendees: "",
    image_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to create an event");
      return;
    }

    if (!formData.title || !formData.event_date || !formData.event_time) {
      toast.error("Please fill in required fields");
      return;
    }

    setSubmitting(true);

    const eventDateTime = new Date(`${formData.event_date}T${formData.event_time}`);

    const { data, error } = await supabase.from("events").insert({
      host_id: user.id,
      title: formData.title,
      description: formData.description || null,
      location: formData.location || null,
      event_date: eventDateTime.toISOString(),
      max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
      image_url: formData.image_url || null,
    }).select().single();

    if (error) {
      toast.error("Failed to create event");
      console.error(error);
    } else {
      toast.success("Event created!");
      navigate(`/events/${data.id}`);
    }
    setSubmitting(false);
  };

  if (!roles.includes("host")) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-serif text-2xl mb-4">Host Access Required</h1>
          <p className="text-muted-foreground">Only hosts can create events.</p>
        </div>
      </Layout>
    );
  }

  return (
    <HelmetProvider>
      <SEOHead title="Create Event | FoodFam" description="Create a new community event" />
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="font-serif text-3xl font-semibold mb-2">Create Event</h1>
            <p className="text-muted-foreground mb-8">Organize a community food gathering</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Italian Pasta Night, Korean BBQ Festival..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell people what this event is about..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-[120px]"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="Event venue or address"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Max Attendees */}
              <div className="space-y-2">
                <Label htmlFor="max_attendees">Maximum Attendees</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="max_attendees"
                    type="number"
                    min={1}
                    placeholder="Leave empty for unlimited"
                    value={formData.max_attendees}
                    onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="image_url">Cover Image URL</Label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="image_url"
                    placeholder="https://..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button type="submit" variant="hero" disabled={submitting} className="flex-1">
                  {submitting ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </HelmetProvider>
  );
};

export default CreateEvent;
