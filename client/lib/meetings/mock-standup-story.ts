import type { MeetingListItem } from "@/app/meeting";
import type { StandaloneRecording } from "@/app/recordings/types";
import type { AgendaEvent } from "@/lib/home/agenda-types";
import { getDateKey } from "@/lib/home/google-agenda-utils";
import { getClerkProfile } from "@/lib/meetings/clerk-profile";
import { getClerkInitials } from "@/lib/meetings/get-clerk-display-name";
import { users } from "@/lib/mock-data";
import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";
import type { SummaryParticipant } from "@/lib/summary/summary-participant.types";
import type { SearchSuggestion } from "@/lib/search/search-suggestion.types";
import { getEmailAvatarUrl } from "@/lib/user/email-avatar-url";

/** Legacy id — resolves to day 4 for older links and search entries. */
export const LEGACY_MOCK_SUMMARY_MEETING_ID = "mock-summary-meeting";

export const MOCK_STANDUP_STORY_INTRO = {
  title: "4 хоногийн Brisk standup",
  description:
    "PineQuest-ийн Brisk баг 4 хоног Brisk-ээр өдөр бүрийн standup-аа хийж, яриаг бичиж, хураангуйлж, дараагийн алхмуудаа тодорхойлсон.",
  tagline: "Бид Brisk-ийг өөрсдийн standup-д ашигласан.",
};

export const MOCK_STANDUP_PARTICIPANTS: SummaryParticipant[] = users.slice(0, 4).map(
  (user) => ({
    id: user.id,
    name: user.name,
    initials: user.initials,
    avatarUrl: user.avatarUrl ?? getEmailAvatarUrl(user.email),
  }),
);

export function getPersonalizedStandupParticipants(): SummaryParticipant[] {
  const profile = getClerkProfile();
  if (!profile) return MOCK_STANDUP_PARTICIPANTS;

  const currentUser: SummaryParticipant = {
    id: profile.clerkId,
    name: profile.name || profile.email,
    initials: getClerkInitials(profile.name || profile.email),
    avatarUrl: profile.avatarUrl ?? getEmailAvatarUrl(profile.email),
  };

  return [
    currentUser,
    ...MOCK_STANDUP_PARTICIPANTS.filter((participant) => participant.id !== "u1").slice(0, 3),
  ];
}

const formatAgendaTime = (value: Date) =>
  value.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

export function buildStandupAgendaEvents(): AgendaEvent[] {
  const profile = getClerkProfile();

  return MOCK_STANDUP_DAYS.map((day) => {
    const start = new Date(day.listItem.createdAt ?? standupBaseDate.toISOString());
    const end = new Date(day.listItem.updatedAt ?? start.toISOString());

    return {
      id: `standup-agenda-${day.id}`,
      title: day.title.replace(/^Standup — /, "Standup · "),
      startLabel: formatAgendaTime(start),
      endLabel: formatAgendaTime(end),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      dateKey: getDateKey(start),
      organizer: profile?.name || profile?.email || "You",
      isOwner: true,
      meetingUrl: `/meetings/${day.id}`,
      isNow: false,
      autoJoinDefault: false,
    };
  });
}

export type MockStandupDay = {
  day: number;
  id: string;
  dateLabel: string;
  title: string;
  meetingContent: string;
  briskRole: string;
  listItem: MeetingListItem;
  topics: string[];
  notes: SummaryNoteItem[];
};

const standupBaseDate = new Date("2026-06-11T09:00:00.000Z");

const buildStandupTimes = (dayIndex: number, durationMinutes: number) => {
  const start = new Date(standupBaseDate);
  start.setDate(start.getDate() + dayIndex);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return {
    createdAt: start.toISOString(),
    updatedAt: end.toISOString(),
  };
};

export const MOCK_STANDUP_DAYS: MockStandupDay[] = [
  {
    day: 1,
    id: "mock-standup-day-1",
    dateLabel: "6 сарын 11",
    title: "Standup — 1-р өдөр: Аудио урсгал ба баазын бүтэц",
    meetingContent:
      "Багийнхан Brisk платформын гол цөм болох LiveKit-ээр дамжуулж аудиог хэрхэн тасралтгүй авах, Cloudflare D1 өгөгдлийн санд уулзалтын мэдээллийг хэрхэн бүтэцжүүлж хадгалах, мөн Clerk ашиглан багуудын нэвтрэх хэсгийг хэлэлцсэн.",
    briskRole:
      'Багийн анхны уулзалтын аудиог Brisk өөрөө бичиж авснаар "LiveKit болон D1 холболтыг хэн хариуцах" даалгавруудыг автоматаар ялган тэмдэглэж, note хөтлөх цагийг хэмнэсэн.',
    listItem: {
      id: "mock-standup-day-1",
      title: "Standup — 1-р өдөр: Аудио урсгал ба баазын бүтэц",
      ...buildStandupTimes(0, 22),
      transcriptionStatus: "done",
      summaryPreview:
        "LiveKit аудио урсгал, Cloudflare D1 схем, Clerk нэвтрэлт — Brisk даалгавруудыг автоматаар action item болгосон.",
    },
    topics: ["LiveKit аудио", "Cloudflare D1", "Clerk нэвтрэлт", "Egress бичлэг"],
    notes: [
      {
        id: "standup-d1-n1",
        title: "LiveKit болон D1 холболтын integration flow-ийг Temuulen хариуцна.",
        assignee: "Temuulen Ganbat",
        dateTime: buildStandupTimes(0, 22).updatedAt,
        meetingId: "mock-standup-day-1",
        meetingTitle: "Standup — 1-р өдөр: Аудио урсгал ба баазын бүтэц",
        source: "action",
      },
      {
        id: "standup-d1-n2",
        title: "Clerk SSO болон meeting token metadata-д email нэмэх ажлыг Anna эхлүүлнэ.",
        assignee: "Anna Kim",
        dateTime: buildStandupTimes(0, 22).updatedAt,
        meetingId: "mock-standup-day-1",
        meetingTitle: "Standup — 1-р өдөр: Аудио урсгал ба баазын бүтэц",
        source: "action",
      },
      {
        id: "standup-d1-n3",
        title: "D1 migration-ийн эхний хүснэгтүүдийг Wilson review хийнэ.",
        assignee: "Wilson Reed",
        dateTime: buildStandupTimes(0, 22).updatedAt,
        meetingId: "mock-standup-day-1",
        meetingTitle: "Standup — 1-р өдөр: Аудио урсгал ба баазын бүтэц",
        source: "action",
      },
      {
        id: "standup-d1-n4",
        title: "Brisk анхны standup-ийг бүрэн бичиж, note хөтлөх шаардлагагүй болсон.",
        assignee: "Баг",
        dateTime: buildStandupTimes(0, 22).updatedAt,
        meetingId: "mock-standup-day-1",
        meetingTitle: "Standup — 1-р өдөр: Аудио урсгал ба баазын бүтэц",
        source: "protocol",
      },
    ],
  },
  {
    day: 2,
    id: "mock-standup-day-2",
    dateLabel: "6 сарын 12",
    title: "Standup — 2-р өдөр: Chimege API интеграц",
    meetingContent:
      "Chimege API-ийг системдээ холбож, уулзалтын явцад ярьж буй Монгол яриаг алдаагүй, шууд (live) бичвэр болгон буулгах логикийг хэлэлцсэн. Мөн фронтент талдаа уулзалтын түүх харагддаг үндсэн нүүр хуудасны бүтцийг Tailwind CSS болон shadcn/ui-аар босгохоор ярилцав.",
    briskRole:
      "Уулзалтын үеэр гарсан Chimege API-ийн latency (хоцролт) болон аудио форматын асуудлыг шийдвэрлэх техникийн яриаг Brisk текст болгон хадгалж, дараагийн алхмуудыг тодорхойлсон.",
    listItem: {
      id: "mock-standup-day-2",
      title: "Standup — 2-р өдөр: Chimege API интеграц",
      ...buildStandupTimes(1, 25),
      transcriptionStatus: "done",
      summaryPreview:
        "Chimege live транскрипц, latency шийдэл, Home page UI бүтэц — техникийн шийдвэрүүд Brisk-д хадгалагдсан.",
    },
    topics: ["Chimege API", "Live транскрипц", "Home page UI", "Latency"],
    notes: [
      {
        id: "standup-d2-n1",
        title: "Chimege webhook latency-г 3 секундоос доош буулгах туршилт хийнэ.",
        assignee: "Anna Kim",
        dateTime: buildStandupTimes(1, 25).updatedAt,
        meetingId: "mock-standup-day-2",
        meetingTitle: "Standup — 2-р өдөр: Chimege API интеграц",
        source: "action",
      },
      {
        id: "standup-d2-n2",
        title: "Home dashboard дээр recent meetings feed-ийг Saraa загварлана.",
        assignee: "Saraa Batbold",
        dateTime: buildStandupTimes(1, 25).updatedAt,
        meetingId: "mock-standup-day-2",
        meetingTitle: "Standup — 2-р өдөр: Chimege API интеграц",
        source: "action",
      },
      {
        id: "standup-d2-n3",
        title: "MP3 split + Chimege форматын pipeline-ийг server дээр баталгаажуулна.",
        assignee: "Temuulen Ganbat",
        dateTime: buildStandupTimes(1, 25).updatedAt,
        meetingId: "mock-standup-day-2",
        meetingTitle: "Standup — 2-р өдөр: Chimege API интеграц",
        source: "action",
      },
      {
        id: "standup-d2-n4",
        title: "Latency болон форматын асуудлыг standup дунд Brisk transcript-оор буцаж шалгасан.",
        assignee: "Баг",
        dateTime: buildStandupTimes(1, 25).updatedAt,
        meetingId: "mock-standup-day-2",
        meetingTitle: "Standup — 2-р өдөр: Chimege API интеграц",
        source: "protocol",
      },
    ],
  },
  {
    day: 3,
    id: "mock-standup-day-3",
    dateLabel: "6 сарын 13",
    title: "Standup — 3-р өдөр: Gemini AI хураангуй",
    meetingContent:
      "Бичигдсэн Монгол бичвэрээс Gemini AI ашиглан уулзалтын гол санаа, хураангуй (Summary) болон хэн юу хийх ёстойг (Action Items) автоматаар ялгаж, спикерүүдийг таних промптыг эцэслэн тохирохоор уулзсан.",
    briskRole:
      "Энэхүү хүнд сэдвийг хэлэлцэж байх үед уулзалтаас хоцорсон гишүүн Brisk-ийн архивыг нээж, өмнөх минутуудад юу яригдсаныг гүйцэж уншаад багтайгаа шууд нэгдсэн.",
    listItem: {
      id: "mock-standup-day-3",
      title: "Standup — 3-р өдөр: Gemini AI хураангуй",
      ...buildStandupTimes(2, 28),
      transcriptionStatus: "done",
      summaryPreview:
        "Gemini summary, action item ялгалт, speaker diarization — хоцорсон гишүүн transcript архиваар нэгдсэн.",
    },
    topics: ["Gemini AI", "Action items", "Speaker diarization", "Summary UI"],
    notes: [
      {
        id: "standup-d3-n1",
        title: "Gemini prompt-д монгол action item формат нэмж server дээр туршина.",
        assignee: "Wilson Reed",
        dateTime: buildStandupTimes(2, 28).updatedAt,
        meetingId: "mock-standup-day-3",
        meetingTitle: "Standup — 3-р өдөр: Gemini AI хураангуй",
        source: "action",
      },
      {
        id: "standup-d3-n2",
        title: "Summary page дээр topic tracker болон note card UI-ийг Saraa дуусгана.",
        assignee: "Saraa Batbold",
        dateTime: buildStandupTimes(2, 28).updatedAt,
        meetingId: "mock-standup-day-3",
        meetingTitle: "Standup — 3-р өдөр: Gemini AI хураангуй",
        source: "action",
      },
      {
        id: "standup-d3-n3",
        title: "Speaker stats-ийг summary participants хэсэгт холбоно.",
        assignee: "Temuulen Ganbat",
        dateTime: buildStandupTimes(2, 28).updatedAt,
        meetingId: "mock-standup-day-3",
        meetingTitle: "Standup — 3-р өдөр: Gemini AI хураангуй",
        source: "action",
      },
      {
        id: "standup-d3-n4",
        title: "Хоцорсон гишүүн transcript архиваар standup-д дахин нэгдсэн — Brisk-ийн гол үнэ цэн.",
        assignee: "Баг",
        dateTime: buildStandupTimes(2, 28).updatedAt,
        meetingId: "mock-standup-day-3",
        meetingTitle: "Standup — 3-р өдөр: Gemini AI хураангуй",
        source: "protocol",
      },
    ],
  },
  {
    day: 4,
    id: "mock-standup-day-4",
    dateLabel: "6 сарын 14",
    title: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
    meetingContent:
      "Бичлэгийг ард талд (background) цarцаахгүйгээр боловсруулах Cloudflare Workers болон Queue (дараалал)-ийн холболтыг шалгах, Монгол хэлний кирилл үсгийн валидацийг Regex-ээр эцэслэн шалгаж, оройны 8 минутын бүтэн илтгэл (Pitch)-дээ бэлдэхээр ярилцсан.",
    briskRole:
      "Уулзалт дуусмагц тэмдэглэл бичихэд зарцуулдаг байсан 30 минутыг 0 минут болгон хэмнэж, багийн гишүүдэд демо илтгэлдээ бүрэн анхаарлаа хандуулах боломжийг олгосон.",
    listItem: {
      id: "mock-standup-day-4",
      title: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
      ...buildStandupTimes(3, 30),
      transcriptionStatus: "done",
      summaryPreview:
        "Cloudflare Queue pipeline, кирилл regex validation, 8 минутын pitch demo script — 30 минут note хөтлөлт хэмнэгдсэн.",
    },
    topics: ["Cloudflare Queue", "Background processing", "Кирилл validation", "Pitch demo"],
    notes: [
      {
        id: "standup-d4-n1",
        title: "Queue consumer + transcription retry логикийг production-д бэлдэнэ.",
        assignee: "Anna Kim",
        dateTime: buildStandupTimes(3, 30).updatedAt,
        meetingId: "mock-standup-day-4",
        meetingTitle: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
        source: "action",
      },
      {
        id: "standup-d4-n2",
        title: "Pitch demo script-ийг монголоор Wilson эцэслэн бичнэ.",
        assignee: "Wilson Reed",
        dateTime: buildStandupTimes(3, 30).updatedAt,
        meetingId: "mock-standup-day-4",
        meetingTitle: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
        source: "action",
      },
      {
        id: "standup-d4-n3",
        title: "4 хоногийн standup түүхийг Home page дээр mock story болгон харуулна.",
        assignee: "Saraa Batbold",
        dateTime: buildStandupTimes(3, 30).updatedAt,
        meetingId: "mock-standup-day-4",
        meetingTitle: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
        source: "action",
      },
      {
        id: "standup-d4-n4",
        title: "Уулзалт дуусмагц summary бэлэн — note хөтлөх 30 минут хэмнэгдсэн.",
        assignee: "Баг",
        dateTime: buildStandupTimes(3, 30).updatedAt,
        meetingId: "mock-standup-day-4",
        meetingTitle: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
        source: "protocol",
      },
    ],
  },
];

const standupDayById = new Map<string, MockStandupDay>(
  MOCK_STANDUP_DAYS.flatMap((day) => [
    [day.id, day] as const,
    ...(day.id === "mock-standup-day-4"
      ? ([[LEGACY_MOCK_SUMMARY_MEETING_ID, day]] as const)
      : []),
  ]),
);

export const MOCK_STANDUP_MEETING_IDS = [
  ...MOCK_STANDUP_DAYS.map((day) => day.id),
  LEGACY_MOCK_SUMMARY_MEETING_ID,
];

export const MOCK_SUMMARY_MEETING_ID = "mock-standup-day-4";

export function isMockStandupMeeting(meetingId: string) {
  return standupDayById.has(meetingId);
}

/** @deprecated Use isMockStandupMeeting */
export const isMockSummaryMeeting = isMockStandupMeeting;

export function getMockStandupDay(meetingId: string): MockStandupDay | undefined {
  return standupDayById.get(meetingId);
}

export function getMockStandupMeetings(): MeetingListItem[] {
  return MOCK_STANDUP_DAYS.map((day) => day.listItem);
}

export function prependMockStandupMeetings(meetings: MeetingListItem[]): MeetingListItem[] {
  const mockMeetings = getMockStandupMeetings();
  const withoutDupes = meetings.filter(
    (meeting) => !standupDayById.has(meeting.id) && meeting.id !== LEGACY_MOCK_SUMMARY_MEETING_ID,
  );
  return [...mockMeetings, ...withoutDupes];
}

/** @deprecated Use prependMockStandupMeetings */
export const prependMockSummaryMeeting = prependMockStandupMeetings;

export type MockStandupMeetingDisplay = {
  day: MockStandupDay;
  participants: SummaryParticipant[];
  topics: string[];
  notes: SummaryNoteItem[];
  listItem: MeetingListItem;
};

export function getMockStandupMeetingDisplay(meetingId: string): MockStandupMeetingDisplay | null {
  const day = getMockStandupDay(meetingId);
  if (!day) return null;

  return {
    day,
    listItem: day.listItem,
    participants: getPersonalizedStandupParticipants(),
    topics: day.topics,
    notes: day.notes,
  };
}

/** @deprecated Use getMockStandupMeetingDisplay */
export function getMockSummaryMeetingDisplay(): MockStandupMeetingDisplay {
  const display = getMockStandupMeetingDisplay(MOCK_SUMMARY_MEETING_ID);
  if (!display) {
    throw new Error("Mock standup day 4 is missing");
  }
  return display;
}

export function buildMockStandupSearchSuggestions(): SearchSuggestion[] {
  return MOCK_STANDUP_DAYS.flatMap((day) => {
    const href = `/meetings/${day.id}`;
    return [
      {
        id: `standup-meeting-${day.id}`,
        title: day.title,
        subtitle: day.listItem.summaryPreview ?? day.meetingContent,
        href,
        category: "Meeting",
        keywords: [day.dateLabel, "standup", "Brisk", ...day.topics],
      },
      ...day.topics.map((topic) => ({
        id: `standup-topic-${day.id}-${topic}`,
        title: topic,
        subtitle: day.title,
        href,
        category: "Topic",
        keywords: ["topic", "standup", day.dateLabel],
      })),
      ...day.notes.map((note) => ({
        id: `standup-note-${note.id}`,
        title: note.title,
        subtitle: `${note.assignee} · ${note.meetingTitle}`,
        href,
        category: note.source === "protocol" ? "Protocol" : "Action item",
        keywords: [note.assignee, note.source, day.dateLabel],
      })),
    ];
  });
}

/** @deprecated Use buildMockStandupSearchSuggestions */
export const buildMockSummaryMeetingSearchSuggestions = buildMockStandupSearchSuggestions;

export function getMockStandupRecordingId(day: number) {
  return `mock-standup-recording-${day}`;
}

const mockRecordingToMeetingId = new Map(
  MOCK_STANDUP_DAYS.map((day) => [getMockStandupRecordingId(day.day), day.id] as const),
);

export function getMockStandupRecordings(): StandaloneRecording[] {
  const ownerUserId = getClerkProfile()?.internalUserId ?? "mock-standup-user";

  return MOCK_STANDUP_DAYS.map((day) => {
    const createdAt = day.listItem.createdAt ?? new Date().toISOString();
    const updatedAt = day.listItem.updatedAt ?? createdAt;
    const durationSeconds = Math.max(
      60,
      Math.round(
        (new Date(updatedAt).getTime() - new Date(createdAt).getTime()) / 1000,
      ),
    );

    return {
      id: getMockStandupRecordingId(day.day),
      userId: ownerUserId,
      title: day.title,
      audioUrl: "",
      status: "done",
      speakerCount: getPersonalizedStandupParticipants().length,
      transcript: `${day.meetingContent}\n\nBrisk-ийн үүрэг: ${day.briskRole}`,
      keyPoints: [
        ...day.topics,
        ...(day.listItem.summaryPreview ? [day.listItem.summaryPreview] : []),
      ],
      scriptSegments: day.notes.slice(0, 3).map((note) => ({
        speakerLabel: note.assignee,
        text: note.title,
      })),
      errorMessage: null,
      durationSeconds,
      fileSizeBytes: 1_200_000 + day.day * 180_000,
      createdAt,
      updatedAt,
    };
  });
}

const mockRecordingById = new Map(
  getMockStandupRecordings().map((recording) => [recording.id, recording] as const),
);

export function isMockStandupRecording(recordingId: string) {
  return mockRecordingById.has(recordingId);
}

export function getMockStandupRecordingById(recordingId: string) {
  return mockRecordingById.get(recordingId);
}

export function getMockStandupMeetingIdForRecording(recordingId: string) {
  return mockRecordingToMeetingId.get(recordingId) ?? null;
}

export function getMockStandupDetailHref(recordingId: string) {
  const meetingId = getMockStandupMeetingIdForRecording(recordingId);
  return meetingId ? `/meetings/${meetingId}` : `/recordings/${recordingId}`;
}

export function prependMockStandupRecordings(
  recordings: StandaloneRecording[],
): StandaloneRecording[] {
  const mockRecordings = getMockStandupRecordings();
  const withoutDupes = recordings.filter((recording) => !isMockStandupRecording(recording.id));
  return [...mockRecordings, ...withoutDupes];
}

export function buildMockStandupRecordingSearchSuggestions(): SearchSuggestion[] {
  return getMockStandupRecordings().flatMap((recording) => {
    const href = getMockStandupDetailHref(recording.id);
    return [
      {
        id: `standup-recording-${recording.id}`,
        title: recording.title,
        subtitle: recording.keyPoints?.[0] ?? recording.transcript?.slice(0, 80),
        href,
        category: "Recording",
        keywords: ["standup", "recording", ...(recording.keyPoints ?? [])],
      },
    ];
  });
}

export function buildStandupStorySearchSuggestions(): SearchSuggestion[] {
  return [
    {
      id: "standup-story-intro",
      title: MOCK_STANDUP_STORY_INTRO.title,
      subtitle: MOCK_STANDUP_STORY_INTRO.description,
      href: "/home",
      category: "Story",
      keywords: ["standup", "4 хоног", "Brisk", "түүх"],
    },
    ...buildMockStandupSearchSuggestions(),
    ...buildMockStandupRecordingSearchSuggestions(),
  ];
}
