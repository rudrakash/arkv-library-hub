import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Table2, Calendar, Loader2, User, GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface StudentDetails {
  student_name: string;
  registration_number: string;
  class: string;
  section: string;
  year: string;
  created_at: string;
}

interface Reservation {
  id: string;
  type: string;
  item_id: string;
  item_title: string;
  timestamp: string;
  status: string;
  user_id: string;
  student_details?: StudentDetails;
}

const AdminReservations = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "book" | "table">("all");

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
      fetchAllReservations();
      
      const channel = supabase
        .channel('admin-reservations-realtime')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'reservations' }, 
          () => {
            fetchAllReservations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin]);

  const fetchAllReservations = async () => {
    setIsLoadingReservations(true);
    const { data: reservationsData, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("status", "active")
      .order("timestamp", { ascending: false });

    if (error) {
      toast.error("Failed to fetch reservations");
      setIsLoadingReservations(false);
      return;
    }

    // Fetch student details for each reservation
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

    setReservations(reservationsWithDetails);
    setIsLoadingReservations(false);
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

  const filteredReservations = reservations.filter(r => 
    filterType === "all" ? true : r.type === filterType
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">All Active Reservations</h1>
          <p className="text-muted-foreground">
            {filteredReservations.length} active reservation{filteredReservations.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <Badge 
            variant={filterType === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterType("all")}
          >
            All ({reservations.length})
          </Badge>
          <Badge 
            variant={filterType === "book" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterType("book")}
          >
            Books ({reservations.filter(r => r.type === "book").length})
          </Badge>
          <Badge 
            variant={filterType === "table" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterType("table")}
          >
            Tables ({reservations.filter(r => r.type === "table").length})
          </Badge>
        </div>

        {filteredReservations.length === 0 ? (
          <Card className="bg-gradient-card border-border">
            <CardHeader className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle>No Active Reservations</CardTitle>
              <CardDescription>
                There are no active reservations at the moment.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReservations.map(reservation => (
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
                        <p className="text-xs pt-1 border-t border-border">
                          Borrowed: {new Date(reservation.student_details.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground text-center">
                      Student details not available
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminReservations;
