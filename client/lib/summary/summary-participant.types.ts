export type SummaryParticipant = {
  id: string;
  name: string;
  initials: string;
  email?: string | null;
  avatarUrl?: string | null;
};

export type SummaryTopic = {
  id: string;
  label: string;
};
