import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

interface StatusBadgeProps {
  available: boolean;
  size?: "sm" | "default" | "lg";
}

export const StatusBadge = ({ available, size = "default" }: StatusBadgeProps) => {
  return (
    <Badge 
      variant={available ? "default" : "destructive"}
      className={`${size === "sm" ? "text-xs" : ""} gap-1 font-semibold`}
    >
      {available ? (
        <>
          <CheckCircle className="h-3 w-3" />
          Available
        </>
      ) : (
        <>
          <XCircle className="h-3 w-3" />
          Unavailable
        </>
      )}
    </Badge>
  );
};
