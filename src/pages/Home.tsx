import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Table2, TrendingUp, Users, BookMarked, Calendar } from "lucide-react";

const Home = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    totalTables: 0,
    availableTables: 0,
    myReservations: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
      
      // Set up realtime subscriptions
      const booksChannel = supabase
        .channel('books-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => {
          fetchStats();
        })
        .subscribe();

      const tablesChannel = supabase
        .channel('tables-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'library_tables' }, () => {
          fetchStats();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(booksChannel);
        supabase.removeChannel(tablesChannel);
      };
    }
  }, [user]);

  const fetchStats = async () => {
    const [booksRes, tablesRes, reservationsRes] = await Promise.all([
      supabase.from("books").select("*", { count: "exact" }),
      supabase.from("library_tables").select("*", { count: "exact" }),
      user ? supabase.from("reservations").select("*", { count: "exact" }).eq("user_id", user.id).eq("status", "active") : null
    ]);

    const availableBooks = booksRes.data?.filter(b => b.available).length || 0;
    const availableTables = tablesRes.data?.filter(t => !t.booked).length || 0;

    setStats({
      totalBooks: booksRes.count || 0,
      availableBooks,
      totalTables: tablesRes.count || 0,
      availableTables,
      myReservations: reservationsRes?.count || 0
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {isAdmin ? "Admin Dashboard" : "Welcome to ARKV"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Manage your library resources" 
              : "Browse books and reserve study tables"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-card border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Books
              </CardTitle>
              <BookMarked className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalBooks}</div>
              <p className="text-xs text-success mt-1">
                {stats.availableBooks} available
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Study Tables
              </CardTitle>
              <Table2 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalTables}</div>
              <p className="text-xs text-success mt-1">
                {stats.availableTables} free
              </p>
            </CardContent>
          </Card>

          {!isAdmin && (
            <Card className="bg-gradient-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  My Reservations
                </CardTitle>
                <Calendar className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.myReservations}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active bookings
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gradient-card border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Availability
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {Math.round(((stats.availableBooks + stats.availableTables) / (stats.totalBooks + stats.totalTables || 1)) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Resources free
              </p>
            </CardContent>
          </Card>
        </div>

        {!isAdmin && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gradient-hero text-primary-foreground shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  Browse Books
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 opacity-90">
                  Explore our collection of {stats.totalBooks} books across various categories.
                </p>
                <Button 
                  onClick={() => navigate("/books")}
                  variant="secondary"
                  className="w-full"
                >
                  View All Books
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Table2 className="h-6 w-6 text-primary" />
                  Reserve a Table
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  Book a study table for your next session. {stats.availableTables} tables available.
                </p>
                <Button 
                  onClick={() => navigate("/tables")}
                  className="w-full"
                >
                  View Tables
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {isAdmin && (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-gradient-card border-border shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5 text-primary" />
                  Manage Books
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Update book availability and manage inventory
                </p>
                <Button onClick={() => navigate("/books")} className="w-full">
                  Manage Books
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table2 className="h-5 w-5 text-primary" />
                  Manage Tables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Update table status and availability
                </p>
                <Button onClick={() => navigate("/tables")} className="w-full">
                  Manage Tables
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Overall system health and utilization
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Books Borrowed</span>
                    <span className="font-medium">{stats.totalBooks - stats.availableBooks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tables Reserved</span>
                    <span className="font-medium">{stats.totalTables - stats.availableTables}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
