import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { TableCard } from "@/components/TableCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LibraryTable {
  id: string;
  table_number: number;
  seats: number;
  booked: boolean;
  booked_by: string | null;
}

const Tables = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState<LibraryTable[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTables();
      
      const channel = supabase
        .channel('tables-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'library_tables' }, () => {
          fetchTables();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchTables = async () => {
    setIsLoadingTables(true);
    const { data, error } = await supabase
      .from("library_tables")
      .select("*")
      .order("table_number");

    if (error) {
      toast.error("Failed to fetch tables");
    } else {
      setTables(data || []);
    }
    setIsLoadingTables(false);
  };

  const handleReserveTable = async (tableId: string) => {
    if (!user) return;

    const { error: tableError } = await supabase
      .from("library_tables")
      .update({
        booked: true,
        booked_by: user.id
      })
      .eq("id", tableId);

    if (tableError) {
      toast.error("Failed to reserve table");
      return;
    }

    const table = tables.find(t => t.id === tableId);
    const { error: reservationError } = await supabase
      .from("reservations")
      .insert({
        user_id: user.id,
        type: "table",
        item_id: tableId,
        item_title: `Table ${table?.table_number}`,
        status: "active"
      });

    if (reservationError) {
      toast.error("Failed to create reservation");
    } else {
      toast.success("Table reserved successfully!");
    }
  };

  const handleUpdateTableStatus = async (tableId: string, booked: boolean) => {
    const { error } = await supabase
      .from("library_tables")
      .update({
        booked,
        booked_by: booked ? undefined : null
      })
      .eq("id", tableId);

    if (error) {
      toast.error("Failed to update table status");
    } else {
      toast.success(`Table marked as ${booked ? "reserved" : "free"}`);
    }
  };

  const handleAddTable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { error } = await supabase
      .from("library_tables")
      .insert({
        table_number: parseInt(formData.get("tableNumber") as string),
        seats: parseInt(formData.get("seats") as string),
        booked: false
      });

    if (error) {
      toast.error("Failed to add table");
    } else {
      toast.success("Table added successfully!");
      setIsAddDialogOpen(false);
    }
  };

  if (loading || isLoadingTables) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const availableTables = tables.filter(t => !t.booked).length;
  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
  const availableSeats = tables.filter(t => !t.booked).reduce((sum, t) => sum + t.seats, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {isAdmin ? "Manage Tables" : "Reserve a Table"}
          </h1>
          <p className="text-muted-foreground">
            {availableTables} of {tables.length} tables available • {availableSeats} of {totalSeats} seats free
          </p>
        </div>

        {isAdmin && (
          <div className="mb-6">
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Table
            </Button>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map(table => (
            <TableCard
              key={table.id}
              id={table.id}
              tableNumber={table.table_number}
              seats={table.seats}
              booked={table.booked}
              onReserve={() => handleReserveTable(table.id)}
              isAdmin={isAdmin}
              onUpdateStatus={(booked) => handleUpdateTableStatus(table.id, booked)}
            />
          ))}
        </div>

        {tables.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tables available yet.</p>
            {isAdmin && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                Add Your First Table
              </Button>
            )}
          </div>
        )}
      </main>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>
              Add a new study table to the library
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddTable}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Table Number</Label>
                <Input id="tableNumber" name="tableNumber" type="number" min="1" placeholder="e.g. 1" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="seats">Number of Seats</Label>
                <Input id="seats" name="seats" type="number" min="1" max="10" placeholder="e.g. 4" required />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Table</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tables;
