import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, Flag, AlertTriangle, Trash2, Ban, Eye, EyeOff, MapPin } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

interface Report {
  id: string;
  reason: string;
  status: string | null;
  created_at: string;
  reporter_id: string;
  post_id: string | null;
  user_id: string | null;
}

interface CommunityPost {
  id: string;
  title: string | null;
  content: string;
  author_id: string;
  created_at: string;
  author?: { full_name: string | null } | null;
}

interface Experience {
  id: string;
  title: string;
  host_id: string;
  created_at: string;
  is_active: boolean | null;
}

interface Event {
  id: string;
  title: string;
  host_id: string;
  created_at: string;
}

const AdminPortal = () => {
  const { user, roles, authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; title: string } | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalExperiences: 0,
    pendingReports: 0,
  });

  const isAdmin = roles.includes("admin" as any);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || !isAdmin) {
      navigate("/");
      return;
    }

    fetchData();
  }, [isAdmin, user, authLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch profiles
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (profilesData) {
      setUsers(profilesData);
      setStats((prev) => ({ ...prev, totalUsers: profilesData.length }));
    }

    // Fetch reports
    const { data: reportsData } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (reportsData) {
      setReports(reportsData);
      setStats((prev) => ({
        ...prev,
        pendingReports: reportsData.filter((r) => r.status === "pending").length,
      }));
    }

    // Fetch posts
    const { data: postsData } = await supabase
      .from("community_posts")
      .select(`*, author:profiles!community_posts_author_profile_fkey(full_name)`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (postsData) {
      setPosts(postsData as CommunityPost[]);
      setStats((prev) => ({ ...prev, totalPosts: postsData.length }));
    }

    // Fetch experiences
    const { data: experiencesData } = await supabase
      .from("experiences")
      .select("id, title, host_id, created_at, is_active")
      .order("created_at", { ascending: false })
      .limit(50);

    if (experiencesData) {
      setExperiences(experiencesData);
      setStats((prev) => ({ ...prev, totalExperiences: experiencesData.length }));
    }

    // Fetch events
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, title, host_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (eventsData) {
      setEvents(eventsData);
    }

    setLoading(false);
  };

  const handleReportStatus = async (reportId: string, newStatus: string) => {
    const { error } = await supabase
      .from("reports")
      .update({ status: newStatus })
      .eq("id", reportId);

    if (error) {
      toast.error("Failed to update report status");
    } else {
      toast.success(`Report marked as ${newStatus}`);
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    let error = null;

    switch (deleteTarget.type) {
      case "post":
        ({ error } = await supabase.from("community_posts").delete().eq("id", deleteTarget.id));
        break;
      case "experience":
        ({ error } = await supabase.from("experiences").delete().eq("id", deleteTarget.id));
        break;
      case "event":
        ({ error } = await supabase.from("events").delete().eq("id", deleteTarget.id));
        break;
    }

    if (error) {
      toast.error(`Failed to delete ${deleteTarget.type}`);
    } else {
      toast.success(`${deleteTarget.type} deleted successfully`);
      fetchData();
    }
    setDeleteTarget(null);
  };

  const handleBlockUser = async (userId: string) => {
    // For MVP, we'll just mark the user in a report or log
    toast.info("User blocking requires backend implementation");
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <Layout>
      <SEOHead
        title="Admin Portal | FoodFam"
        description="Admin portal for managing FoodFam platform"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="font-serif text-3xl font-bold">Admin Portal</h1>
          <Badge variant="destructive">Admin Access</Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Posts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Experiences</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExperiences}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reports</CardTitle>
              <Flag className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.pendingReports}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="experiences">Experiences</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{u.full_name || "Anonymous"}</p>
                        <p className="text-sm text-muted-foreground">@{u.username || "no-username"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {u.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {u.location}
                            </span>
                          )}
                          <span>Joined {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBlockUser(u.user_id)}
                        className="text-destructive"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Community Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{post.title || post.content.slice(0, 50)}</p>
                        <p className="text-sm text-muted-foreground">
                          by {post.author?.full_name || "Unknown"} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget({ type: "post", id: post.id, title: post.title || "Post" })}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experiences">
            <Card>
              <CardHeader>
                <CardTitle>Experiences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{exp.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(exp.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={exp.is_active ? "default" : "secondary"}>
                          {exp.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget({ type: "experience", id: exp.id, title: exp.title })}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget({ type: "event", id: event.id, title: event.title })}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Content Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No reports found</p>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge
                              variant={
                                report.status === "resolved"
                                  ? "default"
                                  : report.status === "dismissed"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {report.status || "pending"}
                            </Badge>
                            <p className="mt-2 font-medium">
                              {report.post_id ? "Post Report" : "User Report"}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">Reason: {report.reason}</p>
                        {report.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReportStatus(report.id, "resolved")}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReportStatus(report.id, "dismissed")}
                            >
                              <EyeOff className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default AdminPortal;
