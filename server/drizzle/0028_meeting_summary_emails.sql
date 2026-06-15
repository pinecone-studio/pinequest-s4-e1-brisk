ALTER TABLE `meeting_transcriptions` ADD `participant_emails` text;
ALTER TABLE `meeting_transcriptions` ADD `summary_emails_sent_at` integer;
ALTER TABLE `meeting_transcriptions` ADD `summary_emails_error` text;
