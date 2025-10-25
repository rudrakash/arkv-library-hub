import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Table2, Users } from "lucide-react";

interface TableCardProps {
  id: string;
  tableNumber: number;
  seats: number;
  booked: boolean;
  bookedBy?: string;
  onReserve?: () => void;
  isAdmin?: boolean;
  onUpdateStatus?: (booked: boolean) => void;
}

export const TableCard = ({
  tableNumber,
  seats,
  booked,
  onReserve,
  isAdmin,
  onUpdateStatus
}: TableCardProps) => {
  return (
    <Card className="bg-gradient-card hover:shadow-md transition-all duration-300 border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl font-bold text-foreground">
            Table {tableNumber}
          </CardTitle>
          <Table2 className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">{seats} Seats</span>
        </div>
        
        <StatusBadge available={!booked} />
      </CardContent>
      
      <CardFooter>
        {isAdmin ? (
          <Button
            onClick={() => onUpdateStatus?.(!booked)}
            variant={booked ? "default" : "destructive"}
            size="sm"
            className="w-full"
          >
            Mark as {booked ? "Free" : "Reserved"}
          </Button>
        ) : (
          <Button
            onClick={onReserve}
            disabled={booked}
            size="sm"
            className="w-full"
          >
            {booked ? "Reserved" : "Reserve Now"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
