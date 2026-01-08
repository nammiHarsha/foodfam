import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { ExperienceType } from "@/types/database";

const EditExperience = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, roles, authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    story: "",
    cuisine_type: "",
    location: "",
    max_guests: 6,
    price_per_person: 0,
    image_url: "",
    experience_type: "meal" as ExperienceType,
  });

  useEffect(() => {
    const fetchExperience = async () => {
      if (!id || !user) return;

      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        toast.error("Experience not found");
        navigate("/host-dashboard");
        return;
      }

      if (data.host_id !== user.id) {
        toast.error("You can only edit your own experiences");
        navigate("/host-dashboard");
        return;
      }

      setFormData({
        title: data.title || "",
        description: data.description || "",
        story: data.story || "",
        cuisine_type: data.cuisine_type || "",
        location: data.location || "",
        max_guests: data.max_guests || 6,
        price_per_person: data.price_per_person || 0,
        image_url: data.image_url || "",
        experience_type: data.experience_type || "meal",
      });
      setLoading(false);
    };

    if (!authLoading && user) {
      fetchExperience();
    }
  }, [id, user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("experiences")
        .update({
          title: formData.title,
          description: formData.description,
          story: formData.story || null,
          cuisine_type: formData.cuisine_type || null,
          location: formData.location || null,
          max_guests: formData.max_guests,
          price_per_person: formData.price_per_person,
          image_url: formData.image_url || null,
          experience_type: formData.experience_type,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Experience updated successfully!");
      navigate("/host-dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to update experience");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (!roles.includes("host")) {
    navigate("/");
    return null;
  }

  return (
    <HelmetProvider>
      <SEOHead
        title="Edit Experience"
        description="Update your food experience details"
      />
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
            Edit Experience
          </h1>
          <p className="text-muted-foreground mb-8">
            Update your experience details
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Experience Type</Label>
              <Select
                value={formData.experience_type}
                onValueChange={(v) => setFormData({ ...formData, experience_type: v as ExperienceType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meal">🍽️ Meal / Dinner</SelectItem>
                  <SelectItem value="cooking_class">👨‍🍳 Cooking Class</SelectItem>
                  <SelectItem value="festival">🎉 Festival Experience</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Traditional Italian Pasta Making"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what guests will experience..."
                className="min-h-[120px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="story">Your Story (optional)</Label>
              <Textarea
                id="story"
                value={formData.story}
                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                placeholder="Share the story behind this experience..."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cuisine">Cuisine Type</Label>
                <Input
                  id="cuisine"
                  value={formData.cuisine_type}
                  onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
                  placeholder="e.g., Italian, Thai"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Rome, Italy"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guests">Max Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min={1}
                  max={20}
                  value={formData.max_guests}
                  onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per Person (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.price_per_person}
                  onChange={(e) => setFormData({ ...formData, price_per_person: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Cover Image URL</Label>
              <Input
                id="image"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-xl mt-2"
                />
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Layout>
    </HelmetProvider>
  );
};

export default EditExperience;
