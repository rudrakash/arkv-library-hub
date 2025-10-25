import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { BookOpen, User, Calendar } from "lucide-react";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  category: string;
  available: boolean;
  borrowedBy?: string;
  expectedReturnDate?: string;
  onBorrow?: () => void;
  isAdmin?: boolean;
  onUpdateStatus?: (available: boolean) => void;
}

export const BookCard = ({
  title,
  author,
  category,
  available,
  borrowedBy,
  expectedReturnDate,
  onBorrow,
  isAdmin,
  onUpdateStatus
}: BookCardProps) => {
  return (
    <Card className="bg-gradient-card hover:shadow-md transition-all duration-300 border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-foreground line-clamp-1">
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <User className="h-3 w-3" />
              {author}
            </p>
          </div>
          <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <Badge variant="secondary" className="font-medium">
          {category}
        </Badge>
        
        <div className="flex items-center justify-between">
          <StatusBadge available={available} />
        </div>

        {!available && expectedReturnDate && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Expected: {new Date(expectedReturnDate).toLocaleDateString()}
          </p>
        )}
      </CardContent>
      
      <CardFooter>
        {isAdmin ? (
          <Button
            onClick={() => onUpdateStatus?.(!available)}
            variant={available ? "destructive" : "default"}
            size="sm"
            className="w-full"
          >
            Mark as {available ? "Borrowed" : "Available"}
          </Button>
        ) : (
          <Button
            onClick={onBorrow}
            disabled={!available}
            size="sm"
            className="w-full"
          >
            {available ? "Borrow Now" : "Not Available"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
