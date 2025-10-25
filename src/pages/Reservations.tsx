import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Table2, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Reservation {
  id: string;
  type: string;
  item_id: string;
  item_title: string;
  timestamp: string;
  status: string;
}

const Reservations = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchReservations();
      
      const channel = supabase
        .channel('reservations-realtime')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'reservations', filter: `user_id=eq.${user.id}` }, 
          () => {
            fetchReservations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchReservations = async () => {
    if (!user) return;
    
    setIsLoadingReservations(true);
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("timestamp", { ascending: false });

    if (error) {
      toast.error("Failed to fetch reservations");
    } else {
      setReservations(data || []);
    }
    setIsLoadingReservations(false);
  };

  const handleCancelReservation = async (reservation: Reservation) => {
    if (!user) return;

    // Update reservation status
    const { error: reservationError } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", reservation.id);

    if (reservationError) {
      toast.error("Failed to cancel reservation");
      return;
    }

    // Update book or table availability
    if (reservation.type === "book") {
      const { error: bookError } = await supabase
        .from("books")
        .update({
          available: true,
          borrowed_by: null,
          expected_return_date: null
        })
        .eq("id", reservation.item_id);

      if (bookError) {
        toast.error("Failed to update book status");
      }
    } else {
      const { error: tableError } = await supabase
        .from("library_tables")
        .update({
          booked: false,
          booked_by: null
        })
        .eq("id", reservation.item_id);

      if (tableError) {
        toast.error("Failed to update table status");
      }
    }

    toast.success("Reservation cancelled successfully!");
  };

  if (loading || isLoadingReservations) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Reservations</h1>
          <p className="text-muted-foreground">
            {reservations.length} active reservation{reservations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {reservations.length === 0 ? (
          <Card className="bg-gradient-card border-border">
            <CardHeader className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle>No Active Reservations</CardTitle>
              <CardDescription>
                You haven't made any reservations yet. Browse our books and tables to get started!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
              <Button onClick={() => navigate("/books")}>Browse Books</Button>
              <Button onClick={() => navigate("/tables")} variant="outline">View Tables</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reservations.map(reservation => (
              <Card key={reservation.id} className="bg-gradient-card border-border hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                        {reservation.type === "book" ? (
                          <BookOpen className="h-5 w-5 text-primary" />
                        ) : (
                          <Table2 className="h-5 w-5 text-primary" />
                        )}
                        {reservation.item_title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <Badge variant="secondary" className="font-medium">
                          {reservation.type === "book" ? "Book" : "Table"}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Reserved on {new Date(reservation.timestamp).toLocaleDateString()}
                  </div>

                  <Button
                    onClick={() => handleCancelReservation(reservation)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Cancel Reservation
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Reservations;
