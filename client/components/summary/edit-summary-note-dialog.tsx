"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "@/lib/summary/datetime-local";
import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";
import { useEffect, useState, type FormEvent } from "react";

type EditSummaryNoteDialogProps = {
  note: SummaryNoteItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: SummaryNoteItem) => void;
};

export function EditSummaryNoteDialog({
  note,
  open,
  onOpenChange,
  onSave,
}: EditSummaryNoteDialogProps) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    if (!note) return;

    setTitle(note.title);
    setAssignee(note.assignee);
    setDateTime(toDateTimeLocalValue(note.dateTime));
  }, [note]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!note) return;

    const trimmedTitle = title.trim();
    const trimmedAssignee = assignee.trim();

    if (!trimmedTitle || !trimmedAssignee) return;

    onSave({
      ...note,
      title: trimmedTitle,
      assignee: trimmedAssignee,
      dateTime: fromDateTimeLocalValue(dateTime),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit note</DialogTitle>
          <DialogDescription>Update the note details for this meeting summary.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="summary-note-title">Title</Label>
            <Input
              id="summary-note-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="summary-note-assignee">Assignee</Label>
            <Input
              id="summary-note-assignee"
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="summary-note-date">Date &amp; time</Label>
            <Input
              id="summary-note-date"
              type="datetime-local"
              value={dateTime}
              onChange={(event) => setDateTime(event.target.value)}
            />
          </div>

          <DialogFooter className="-mx-4 -mb-4 mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !assignee.trim()}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
