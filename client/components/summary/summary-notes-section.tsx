"use client";

import { EditSummaryNoteDialog } from "@/components/summary/edit-summary-note-dialog";
import { SummaryNoteCard } from "@/components/summary/summary-note-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { sendActionItemEmail } from "@/lib/api/summary-actions";
import { formatUserError } from "@/lib/errors/format-user-error";
import { formatSummaryNoteDateTime } from "@/lib/summary/format-summary-note-date";
import { resolveAssigneeEmail } from "@/lib/summary/resolve-assignee-email";
import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";
import { NotebookPenIcon } from "lucide-react";
import { useCallback, useState } from "react";

function SummaryNotesSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="flex flex-col gap-4 rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5"
        >
          <div className="flex items-start gap-3">
            <div className="size-10 animate-pulse rounded-xl bg-muted" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3 w-[80%] animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-[60%] animate-pulse rounded-full bg-muted/70" />
              <div className="flex gap-2 pt-1">
                <div className="h-5 w-20 animate-pulse rounded-full bg-muted/70" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-muted/70" />
              </div>
            </div>
          </div>
          <div className="h-8 w-full animate-pulse rounded-lg bg-muted/60" />
        </div>
      ))}
    </div>
  );
}

type SummaryNotesSectionProps = {
  notes: SummaryNoteItem[];
  onNotesChange: (notes: SummaryNoteItem[]) => void;
  topics?: string[];
  isLoading?: boolean;
};

export function SummaryNotesSection({
  notes,
  onNotesChange,
  topics = [],
  isLoading = false,
}: SummaryNotesSectionProps) {
  const toast = useToast();
  const [approvedIds, setApprovedIds] = useState<Set<string>>(() => new Set());
  const [sentEmailIds, setSentEmailIds] = useState<Set<string>>(() => new Set());
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<SummaryNoteItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const approveNote = useCallback((noteId: string) => {
    setApprovedIds((current) => {
      const next = new Set(current);
      next.add(noteId);
      return next;
    });
  }, []);

  const sendNoteEmail = useCallback(
    async (note: SummaryNoteItem) => {
      const assigneeEmail = resolveAssigneeEmail(note.assignee);
      if (!assigneeEmail) {
        toast.add({
          title: "No email for assignee",
          description: "Edit the card and use a name from your team or a full email address.",
          type: "info",
        });
        return;
      }

      setSendingEmailId(note.id);

      try {
        await sendActionItemEmail({
          meetingId: note.meetingId,
          meetingTitle: note.meetingTitle,
          noteTitle: note.title,
          assignee: note.assignee,
          assigneeEmail,
          dateTimeLabel: formatSummaryNoteDateTime(note.dateTime),
          source: note.source,
        });

        setSentEmailIds((current) => {
          const next = new Set(current);
          next.add(note.id);
          return next;
        });

        toast.add({
          title: "Email sent",
          description: `Action item emailed to ${assigneeEmail}.`,
          type: "success",
        });
      } catch (caughtError) {
        toast.add({
          title: "Could not send email",
          description: formatUserError(caughtError),
          type: "error",
        });
      } finally {
        setSendingEmailId(null);
      }
    },
    [toast],
  );

  const handleEditNote = useCallback((note: SummaryNoteItem) => {
    setEditingNote(note);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveNote = useCallback(
    (updatedNote: SummaryNoteItem) => {
      onNotesChange(notes.map((note) => (note.id === updatedNote.id ? updatedNote : note)));
      setEditingNote(null);
    },
    [notes, onNotesChange],
  );

  const pendingCount = notes.filter((note) => !approvedIds.has(note.id)).length;

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <NotebookPenIcon className="size-4 text-primary" />
            Notes
            {!isLoading ? (
              <Badge variant="secondary" className="h-5 px-2 text-[10px] font-semibold uppercase">
                {pendingCount}
              </Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-4">
          {isLoading ? (
            <SummaryNotesSkeleton />
          ) : notes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground">No notes yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Action items and protocols from this meeting will appear here as cards.
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <SummaryNoteCard
                key={note.id}
                note={note}
                approved={approvedIds.has(note.id)}
                emailSent={sentEmailIds.has(note.id)}
                isSendingEmail={sendingEmailId === note.id}
                assigneeEmail={resolveAssigneeEmail(note.assignee)}
                onApprove={() => approveNote(note.id)}
                onSendEmail={() => void sendNoteEmail(note)}
                onEdit={() => handleEditNote(note)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <EditSummaryNoteDialog
        note={editingNote}
        topics={topics}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveNote}
      />
    </>
  );
}
