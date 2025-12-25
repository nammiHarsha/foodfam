import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, Flag, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    username: string | null;
  };
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

interface BookingWithDetails {
  id: string;
  status: string | null;
  booking_date: string | null;
  guests_count: number | null;
  created_at: string;
  experience: {
    title: string;
  } | null;
  guest: {
    full_name: string | null;
  } | null;
}

const Admin = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    pendingReports: 0,
  });

  const isAdmin = roles.includes("admin" as any); // Only users with admin role can access

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (!loading && !isAdmin) {
      navigate("/");
      toast.error("Access denied. Admin only.");
      return;
    }

    if (user && isAdmin) {
      fetchData();
    }
  }, [user, loading, isAdmin, navigate]);

  const fetchData = async () => {
    // Fetch profiles as users
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (profilesData) {
      setUsers(
        profilesData.map((p) => ({
          id: p.user_id,
          email: p.username || "No email",
          created_at: p.created_at,
          profile: {
            full_name: p.full_name,
            username: p.username,
          },
        }))
      );
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

    // Fetch bookings
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select(`
        *,
        experience:experiences(title)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (bookingsData) {
      // Fetch guest profiles separately
      const guestIds = [...new Set(bookingsData.map(b => b.guest_id))];
      const { data: guestProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", guestIds);

      const guestMap = new Map(guestProfiles?.map(p => [p.user_id, p]) || []);
      
      const bookingsWithGuests = bookingsData.map(b => ({
        ...b,
        guest: guestMap.get(b.guest_id) || null,
      }));

      setBookings(bookingsWithGuests as BookingWithDetails[]);
      setStats((prev) => ({ ...prev, totalBookings: bookingsData.length }));
    }
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

  if (loading) {
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

  return (
    <Layout>
      <SEOHead
        title="Admin Dashboard | FoodFam"
        description="Admin dashboard for managing FoodFam platform"
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Bookings
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Reports
              </CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReports}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No users found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {u.profile?.full_name || "Anonymous"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{u.profile?.username || "no-username"}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(u.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No bookings found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {booking.experience?.title || "Unknown Experience"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Guest: {booking.guest?.full_name || "Unknown"}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              booking.status === "approved"
                                ? "default"
                                : booking.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {booking.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {booking.booking_date
                              ? new Date(booking.booking_date).toLocaleDateString()
                              : "No date"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                  <p className="text-muted-foreground text-center py-8">
                    No reports found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="p-4 border rounded-lg space-y-3"
                      >
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
                            {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Reason: {report.reason}
                        </p>
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
    </Layout>
  );
};

export default Admin;
