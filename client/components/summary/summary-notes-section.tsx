"use client";

import { EditSummaryNoteDialog } from "@/components/summary/edit-summary-note-dialog";
import { SummaryNoteCard } from "@/components/summary/summary-note-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  isLoading?: boolean;
};

export function SummaryNotesSection({
  notes,
  onNotesChange,
  isLoading = false,
}: SummaryNotesSectionProps) {
  const [approvedIds, setApprovedIds] = useState<Set<string>>(() => new Set());
  const [editingNote, setEditingNote] = useState<SummaryNoteItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const approveNote = useCallback((noteId: string) => {
    setApprovedIds((current) => {
      const next = new Set(current);
      next.add(noteId);
      return next;
    });
  }, []);

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
                onApprove={() => approveNote(note.id)}
                onEdit={() => handleEditNote(note)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <EditSummaryNoteDialog
        note={editingNote}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveNote}
      />
    </>
  );
}
