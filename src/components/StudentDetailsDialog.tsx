import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface StudentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (details: StudentDetails) => void;
  loading?: boolean;
}

export interface StudentDetails {
  student_name: string;
  registration_number: string;
  class: string;
  section: string;
  year: string;
}

export const StudentDetailsDialog = ({
  open,
  onOpenChange,
  onSubmit,
  loading = false
}: StudentDetailsDialogProps) => {
  const [details, setDetails] = useState<StudentDetails>({
    student_name: "",
    registration_number: "",
    class: "",
    section: "",
    year: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(details);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student_name">Full Name *</Label>
            <Input
              id="student_name"
              value={details.student_name}
              onChange={(e) => setDetails({ ...details, student_name: e.target.value })}
              required
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="registration_number">Registration Number *</Label>
            <Input
              id="registration_number"
              value={details.registration_number}
              onChange={(e) => setDetails({ ...details, registration_number: e.target.value })}
              required
              placeholder="Enter your registration number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="class">Class *</Label>
            <Input
              id="class"
              value={details.class}
              onChange={(e) => setDetails({ ...details, class: e.target.value })}
              required
              placeholder="e.g., Computer Science"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="section">Section *</Label>
            <Input
              id="section"
              value={details.section}
              onChange={(e) => setDetails({ ...details, section: e.target.value })}
              required
              placeholder="e.g., A, B, C"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="year">Year *</Label>
            <Input
              id="year"
              value={details.year}
              onChange={(e) => setDetails({ ...details, year: e.target.value })}
              required
              placeholder="e.g., 1st Year, 2nd Year"
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit & Confirm"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
