export type PostMeetingTask = {
  id: string;
  text: string;
  assignedTo: string;
  enabled: boolean;
};

export type PostMeetingFormState = {
  recordingName: string;
  assignedTeammateId: string;
  scheduleFollowUp: boolean;
  followUpDate: Date;
  tasks: PostMeetingTask[];
};

export type PostMeetingTeammateOption = {
  id: string;
  name: string;
  email: string;
};
