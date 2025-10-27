import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Table2, Calendar, Loader2, CheckCircle, XCircle, GraduationCap, User } from "lucide-react";
import { toast } from "sonner";

interface StudentDetails {
  student_name: string;
  registration_number: string;
  class: string;
  section: string;
  year: string;
  created_at: string;
}

interface PendingReservation {
  id: string;
  type: string;
  item_id: string;
  item_title: string;
  timestamp: string;
  user_id: string;
  student_details?: StudentDetails;
}

const AdminApprovals = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [pendingReservations, setPendingReservations] = useState<PendingReservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (!loading && user && !isAdmin) {
      navigate("/");
      toast.error("Access denied. Admin only.");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchPendingReservations();
      
      const channel = supabase
        .channel('pending-reservations-realtime')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'reservations', filter: 'status=eq.pending' }, 
          () => {
            fetchPendingReservations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin]);

  const fetchPendingReservations = async () => {
    setIsLoadingReservations(true);
    const { data: reservationsData, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("status", "pending")
      .order("timestamp", { ascending: false });

    if (error) {
      toast.error("Failed to fetch pending reservations");
      setIsLoadingReservations(false);
      return;
    }

    const reservationsWithDetails = await Promise.all(
      (reservationsData || []).map(async (reservation) => {
        const { data: studentData } = await supabase
          .from("student_details")
          .select("*")
          .eq("reservation_id", reservation.id)
          .single();

        return {
          ...reservation,
          student_details: studentData || undefined
        };
      })
    );

    setPendingReservations(reservationsWithDetails);
    setIsLoadingReservations(false);
  };

  const handleApprove = async (reservation: PendingReservation) => {
    const { error: reservationError } = await supabase
      .from("reservations")
      .update({ status: "approved" })
      .eq("id", reservation.id);

    if (reservationError) {
      toast.error("Failed to approve reservation");
      return;
    }

    if (reservation.type === "book") {
      const { error: bookError } = await supabase
        .from("books")
        .update({
          available: false,
          borrowed_by: reservation.user_id
        })
        .eq("id", reservation.item_id);

      if (bookError) {
        toast.error("Failed to update book status");
        return;
      }
    } else {
      const { error: tableError } = await supabase
        .from("library_tables")
        .update({
          booked: true,
          booked_by: reservation.user_id
        })
        .eq("id", reservation.item_id);

      if (tableError) {
        toast.error("Failed to update table status");
        return;
      }
    }

    toast.success("Reservation approved successfully!");
  };

  const handleReject = async (reservation: PendingReservation) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "rejected" })
      .eq("id", reservation.id);

    if (error) {
      toast.error("Failed to reject reservation");
      return;
    }

    toast.success("Reservation rejected");
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
          <h1 className="text-4xl font-bold text-foreground mb-2">Pending Approvals</h1>
          <p className="text-muted-foreground">
            {pendingReservations.length} pending request{pendingReservations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {pendingReservations.length === 0 ? (
          <Card className="bg-gradient-card border-border">
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle>All Clear!</CardTitle>
              <CardDescription>
                No pending reservations to approve at the moment.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pendingReservations.map(reservation => (
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
                          {reservation.type === "book" ? "Book Request" : "Table Request"}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Requested on {new Date(reservation.timestamp).toLocaleDateString()}
                  </div>

                  {reservation.student_details ? (
                    <div className="bg-primary/10 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        <span>{reservation.student_details.student_name}</span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground pl-6">
                        <p className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          Reg: {reservation.student_details.registration_number}
                        </p>
                        <p>{reservation.student_details.class} - Section {reservation.student_details.section}</p>
                        <p>Year: {reservation.student_details.year}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground text-center">
                      Student details not available
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(reservation)}
                      size="sm"
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(reservation)}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminApprovals;
