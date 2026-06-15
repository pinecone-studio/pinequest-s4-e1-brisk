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
import { useToast } from "@/components/ui/toast";
import { generateNoteTitle } from "@/lib/api/summary-actions";
import { formatUserError } from "@/lib/errors/format-user-error";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "@/lib/summary/datetime-local";
import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";
import { Loader2Icon, SparklesIcon } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

type EditSummaryNoteDialogProps = {
  note: SummaryNoteItem | null;
  topics?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: SummaryNoteItem) => void;
};

export function EditSummaryNoteDialog({
  note,
  topics = [],
  open,
  onOpenChange,
  onSave,
}: EditSummaryNoteDialogProps) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  useEffect(() => {
    if (!note) return;

    setTitle(note.title);
    setAssignee(note.assignee);
    setDateTime(toDateTimeLocalValue(note.dateTime));
  }, [note]);

  const handleGenerateTitle = async () => {
    if (!note || !assignee.trim()) return;

    setIsGeneratingTitle(true);

    try {
      const generatedTitle = await generateNoteTitle({
        meetingTitle: note.meetingTitle,
        assignee: assignee.trim(),
        source: note.source,
        currentTitle: title,
        topics,
      });
      setTitle(generatedTitle);
      toast.add({
        title: "AI title generated",
        description: "Review the title before saving.",
        type: "success",
      });
    } catch (caughtError) {
      toast.add({
        title: "Could not generate title",
        description: formatUserError(caughtError),
        type: "error",
      });
    } finally {
      setIsGeneratingTitle(false);
    }
  };

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
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="summary-note-title">Title</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-full px-3"
                disabled={!assignee.trim() || isGeneratingTitle}
                onClick={() => void handleGenerateTitle()}
              >
                {isGeneratingTitle ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <SparklesIcon className="size-3.5" />
                )}
                Generate with AI
              </Button>
            </div>
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
