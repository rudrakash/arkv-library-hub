import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { BookCard } from "@/components/BookCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StudentDetailsDialog, StudentDetails } from "@/components/StudentDetailsDialog";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  available: boolean;
  borrowed_by: string | null;
  expected_return_date: string | null;
}

const Books = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isSubmittingBorrow, setIsSubmittingBorrow] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBooks();
      
      const channel = supabase
        .channel('books-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => {
          fetchBooks();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    filterBooks();
  }, [books, searchTerm, categoryFilter]);

  const fetchBooks = async () => {
    setIsLoadingBooks(true);
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("title");

    if (error) {
      toast.error("Failed to fetch books");
    } else {
      setBooks(data || []);
      const uniqueCategories = Array.from(new Set(data?.map(b => b.category) || []));
      setCategories(uniqueCategories);
    }
    setIsLoadingBooks(false);
  };

  const filterBooks = () => {
    let filtered = books;

    if (searchTerm) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(book => book.category === categoryFilter);
    }

    setFilteredBooks(filtered);
  };

  const handleBorrowBook = (bookId: string) => {
    setSelectedBookId(bookId);
    setIsStudentDialogOpen(true);
  };

  const handleStudentDetailsSubmit = async (details: StudentDetails) => {
    if (!user || !selectedBookId) return;

    setIsSubmittingBorrow(true);

    // Create pending reservation
    const book = books.find(b => b.id === selectedBookId);
    const { data: reservationData, error: reservationError } = await supabase
      .from("reservations")
      .insert({
        user_id: user.id,
        type: "book",
        item_id: selectedBookId,
        item_title: book?.title || "Unknown",
        status: "pending"
      })
      .select()
      .single();

    if (reservationError || !reservationData) {
      toast.error("Failed to create reservation");
      setIsSubmittingBorrow(false);
      return;
    }

    // Save student details
    const { error: studentError } = await supabase
      .from("student_details")
      .insert({
        reservation_id: reservationData.id,
        user_id: user.id,
        ...details
      });

    if (studentError) {
      toast.error("Failed to save student details");
    } else {
      toast.success("Book request submitted! Waiting for admin approval.");
      setIsStudentDialogOpen(false);
      setSelectedBookId(null);
    }

    setIsSubmittingBorrow(false);
  };

  const handleUpdateBookStatus = async (bookId: string, available: boolean) => {
    const { error } = await supabase
      .from("books")
      .update({
        available,
        borrowed_by: available ? null : undefined,
        expected_return_date: available ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq("id", bookId);

    if (error) {
      toast.error("Failed to update book status");
    } else {
      toast.success(`Book marked as ${available ? "available" : "borrowed"}`);
    }
  };

  const handleAddBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { error } = await supabase
      .from("books")
      .insert({
        title: formData.get("title") as string,
        author: formData.get("author") as string,
        category: formData.get("category") as string,
        available: true
      });

    if (error) {
      toast.error("Failed to add book");
    } else {
      toast.success("Book added successfully!");
      setIsAddDialogOpen(false);
    }
  };

  if (loading || isLoadingBooks) {
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
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {isAdmin ? "Manage Books" : "Browse Books"}
          </h1>
          <p className="text-muted-foreground">
            {filteredBooks.length} books found
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isAdmin && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Book
            </Button>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBooks.map(book => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              author={book.author}
              category={book.category}
              available={book.available}
              expectedReturnDate={book.expected_return_date || undefined}
              onBorrow={() => handleBorrowBook(book.id)}
              isAdmin={isAdmin}
              onUpdateStatus={(available) => handleUpdateBookStatus(book.id, available)}
            />
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No books found matching your criteria.</p>
          </div>
        )}
      </main>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Book</DialogTitle>
            <DialogDescription>
              Add a new book to the library collection
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddBook}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Book title" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input id="author" name="author" placeholder="Author name" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="e.g. Fiction, Science, History" required />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Book</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <StudentDetailsDialog
        open={isStudentDialogOpen}
        onOpenChange={setIsStudentDialogOpen}
        onSubmit={handleStudentDetailsSubmit}
        loading={isSubmittingBorrow}
      />
    </div>
  );
};

export default Books;
