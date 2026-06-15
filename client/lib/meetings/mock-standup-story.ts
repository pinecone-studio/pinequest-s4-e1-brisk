import type { MeetingListItem } from "@/app/meeting";
import type { StandaloneRecording } from "@/app/recordings/types";
import type { AgendaEvent } from "@/lib/home/agenda-types";
import { getDateKey } from "@/lib/home/google-agenda-utils";
import {
  BRISK_STANDUP_TEAM,
  BRISK_STANDUP_TEAM_NAMES,
  getBriskStandupParticipants,
  toStandupParticipant,
} from "@/lib/meetings/brisk-standup-team";
import { getClerkProfile } from "@/lib/meetings/clerk-profile";
import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";
import type { SummaryParticipant } from "@/lib/summary/summary-participant.types";
import type { SearchSuggestion } from "@/lib/search/search-suggestion.types";

/** Legacy id — resolves to day 4 for older links and search entries. */
export const LEGACY_MOCK_SUMMARY_MEETING_ID = "mock-summary-meeting";

export const MOCK_STANDUP_STORY_INTRO = {
  title: "4 хоногийн Brisk standup",
  description:
    "PineQuest-ийн Brisk баг 4 хоног Brisk-ээр өдөр бүрийн standup-аа хийж, яриаг бичиж, хураангуйлж, дараагийн алхмуудаа тодорхойлсон.",
  tagline: "Бид Brisk-ийг өөрсдийн standup-д ашигласан.",
};

export const MOCK_STANDUP_PARTICIPANTS: SummaryParticipant[] =
  BRISK_STANDUP_TEAM.map(toStandupParticipant);

export function getPersonalizedStandupParticipants(): SummaryParticipant[] {
  return getBriskStandupParticipants();
}

export { BRISK_STANDUP_TEAM, BRISK_STANDUP_TEAM_NAMES };

const formatAgendaTime = (value: Date) =>
  value.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

export function buildStandupAgendaEvents(): AgendaEvent[] {
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
      organizer: "Данни",
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

function buildStandupNoteDateTime(dayIndex: number, noteId: string, noteIndex: number) {
  const date = new Date(standupBaseDate);
  date.setUTCDate(date.getUTCDate() + dayIndex);
  date.setUTCHours(0, 0, 0, 0);

  let hash = (2166136261 ^ dayIndex) >>> 0;
  for (const char of noteId) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  hash = (hash ^ noteIndex * 2654435761) >>> 0;

  const minuteOfDay = hash % (16 * 60);
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const second = (hash >>> 16) % 60;

  date.setUTCHours(hour, minute, second, 0);
  return date.toISOString();
}

function withStandupNoteTimes(days: MockStandupDay[]): MockStandupDay[] {
  return days.map((day) => ({
    ...day,
    notes: day.notes.map((note, noteIndex) => ({
      ...note,
      dateTime: buildStandupNoteDateTime(day.day - 1, note.id, noteIndex),
    })),
  }));
}

const MOCK_STANDUP_DAYS_RAW: MockStandupDay[] = [
  {
    day: 1,
    id: "mock-standup-day-1",
    dateLabel: "6 сарын 11",
    title: "Standup — 1-р өдөр: Аудио урсгал ба баазын бүтэц",
    meetingContent:
      "Данни 09:00-д standup нээхэд Сүх-Очир 5 минут хоцорч орсон — «Дараагийн удаа цагтаа орно уу, бид Brisk-ээр бичиж байгаа» гэж сануулав. Батбилэг LiveKit→D1 холболт дээр foreign key алдаа гарч блоклогдсон байгааг тайлбарлаж, шийдэл нь migration-ийг эхлээд Цолмонгэрэл review-д өгөх шаардлагатай болохыг хэлсэн. Амаржаргал Egress webhook 403 буцааж байгаа тул staging бичлэг бүрэн ажиллахгүй байна. Сүх-Очир Clerk metadata demo хийсэн ч микрофон эхний 2 минут дотроо ажиллаагүй.",
    briskRole:
      "Brisk багийн анхны standup-ийг бүрэн бичиж, «D1 migration review», «Egress 403 засах», «Clerk metadata» гэсэн blocker-уудыг action item болгон ялгаж, Данни note хөтлөхгүйгээр дараагийн алхмуудаа тодорхойлсон.",
    listItem: {
      id: "mock-standup-day-1",
      title: "Standup — 1-р өдөр: Аудио урсгал ба баазын бүтэц",
      ...buildStandupTimes(0, 22),
      transcriptionStatus: "done",
      summaryPreview:
        "Сүх-Очир хоцорсон, Батбилэг D1 blocker, Амаржаргал Egress 403 — Brisk бүгдийг action item болгосон.",
    },
    topics: [
      "LiveKit аудио",
      "D1 migration blocker",
      "Egress 403 алдаа",
      "Standup цагийн дүрэм",
    ],
    notes: [
      {
        id: "standup-d1-n0",
        title:
          "Standup 09:00-д эхэлнэ — хоцрохгүй. Хоцорвол Brisk transcript-аар гүйцээж орох ёстой.",
        assignee: "Данни",
        dateTime: buildStandupTimes(0, 22).updatedAt,
        meetingId: "mock-standup-day-1",
        meetingTitle: "Standup — 1-р өдөр: Аудио урсгал ба баазын бүтэц",
        source: "protocol",
      },
      {
        id: "standup-d1-n1",
        title:
          "BLOCKER: D1 foreign key алдааг засаад LiveKit integration flow-ийг Батбилэг энэ долоо хоногт дуусгана.",
        assignee: "Батбилэг",
        dateTime: buildStandupTimes(0, 22).updatedAt,
        meetingId: "mock-standup-day-1",
        meetingTitle: "Standup — 1-р өдөр: Аудио урсгал ба баазын бүтэц",
        source: "action",
      },
      {
        id: "standup-d1-n2",
        title: "Clerk SSO болон meeting token metadata-д email нэмэх ажлыг Сүх-Очир эхлүүлнэ.",
        assignee: "Сүх-Очир",
        dateTime: buildStandupTimes(0, 22).updatedAt,
        meetingId: "mock-standup-day-1",
        meetingTitle: "Standup — 1-р өдөр: Аудио урсгал ба баазын бүтэц",
        source: "action",
      },
      {
        id: "standup-d1-n3",
        title: "D1 migration schema-г Цолмонгэрэл багийн review-д бэлдэнэ.",
        assignee: "Цолмонгэрэл",
        dateTime: buildStandupTimes(0, 22).updatedAt,
        meetingId: "mock-standup-day-1",
        meetingTitle: "Standup — 1-р өдөр: Аудио урсгал ба баазын бүтэц",
        source: "action",
      },
      {
        id: "standup-d1-n4",
        title:
          "BLOCKER: Egress webhook 403 алдааг Амаржаргал staging дээр засаж, бичлэг pipeline-ийг ногоон болгоно.",
        assignee: "Амаржаргал",
        dateTime: buildStandupTimes(0, 22).updatedAt,
        meetingId: "mock-standup-day-1",
        meetingTitle: "Standup — 1-р өдөр: Аудио урсгал ба баазын бүтэц",
        source: "action",
      },
      {
        id: "standup-d1-n5",
        title:
          "Сүх-Очир standup-д хоцорсон — дараагийн удаа 09:00-аас өмнө lobby-д бэлэн байна.",
        assignee: "Сүх-Очир",
        dateTime: buildStandupTimes(0, 22).updatedAt,
        meetingId: "mock-standup-day-1",
        meetingTitle: "Standup — 1-р өдөр: Аудио урсгал ба баазын бүтэц",
        source: "protocol",
      },
      {
        id: "standup-d1-n6",
        title: "Данни Brisk-ээр standup-ийг бүрэн бичүүлж, баг note хөтлөхгүйгээр гарах боломжтой боллоо.",
        assignee: "Данни",
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
      "Chimege live demo дээр 8 секундын latency гарч баг ичгүүртэй байсан — Амаржаргал «API тал дээр retry logic дутуу» гэж тайлбарлав. Цолмонгэрэл Home feed-ийн mock-ийг Батбилэгийн meeting list API-аас хараахан хүлээж байгааг хэлсэн. Сүх-Очир Safari дээр Chimege event stream огт ирэхгүй байгаа blocker-ийг өгсөн. Данни standup дунд side chat хийхгүй, асуудлаа товч хэлээд шийдлээ action item болгохыг сануулав.",
    briskRole:
      "Latency-ийн маргаан гарсан ч Brisk transcript-оор «8 секунд хүлээлт», «Safari event stream» гэсэн blocker-уудыг ялгаж, баг дахин давтахгүйгээр шийдвэрлэх замаа олсон.",
    listItem: {
      id: "mock-standup-day-2",
      title: "Standup — 2-р өдөр: Chimege API интеграц",
      ...buildStandupTimes(1, 25),
      transcriptionStatus: "done",
      summaryPreview:
        "Chimege 8 сек latency, Safari event stream blocker — баг ичгүүртэй байсан ч Brisk шийдвэрийг тодорхойлсон.",
    },
    topics: ["Chimege latency", "Safari blocker", "Home feed dependency", "Standup дүрэм"],
    notes: [
      {
        id: "standup-d2-n0",
        title: "Standup дунд side chat хийхгүй — асуудлаа 1-2 минутад хэлж, шийдлийг action item болгоно.",
        assignee: "Данни",
        dateTime: buildStandupTimes(1, 25).updatedAt,
        meetingId: "mock-standup-day-2",
        meetingTitle: "Standup — 2-р өдөр: Chimege API интеграц",
        source: "protocol",
      },
      {
        id: "standup-d2-n1",
        title:
          "BLOCKER: Chimege webhook latency-г 8 секундаас 3 секунд рүү буулгах туршилтыг Амаржаргал яаралтай хийнэ.",
        assignee: "Амаржаргал",
        dateTime: buildStandupTimes(1, 25).updatedAt,
        meetingId: "mock-standup-day-2",
        meetingTitle: "Standup — 2-р өдөр: Chimege API интеграц",
        source: "action",
      },
      {
        id: "standup-d2-n2",
        title:
          "BLOCKER: Meeting list API бэлэн болмогц л Home feed-ийг Цолмонгэрэл mock-оос бодит data руу шилжүүлнэ.",
        assignee: "Цолмонгэрэл",
        dateTime: buildStandupTimes(1, 25).updatedAt,
        meetingId: "mock-standup-day-2",
        meetingTitle: "Standup — 2-р өдөр: Chimege API интеграц",
        source: "action",
      },
      {
        id: "standup-d2-n3",
        title: "MP3 split + Chimege форматын pipeline-ийг Батбилэг server дээр баталгаажуулна.",
        assignee: "Батбилэг",
        dateTime: buildStandupTimes(1, 25).updatedAt,
        meetingId: "mock-standup-day-2",
        meetingTitle: "Standup — 2-р өдөр: Chimege API интеграц",
        source: "action",
      },
      {
        id: "standup-d2-n4",
        title:
          "BLOCKER: Safari дээр Chimege event stream ирэхгүй байгаа асуудлыг Сүх-Очир reproduce хийж засварлана.",
        assignee: "Сүх-Очир",
        dateTime: buildStandupTimes(1, 25).updatedAt,
        meetingId: "mock-standup-day-2",
        meetingTitle: "Standup — 2-р өдөр: Chimege API интеграц",
        source: "action",
      },
      {
        id: "standup-d2-n5",
        title:
          "Latency demo багад ичгүүртэй байсан — дараагийн standup-д demo-ээ бэлэн байлгаж, дахин алдаа гаргахгүй.",
        assignee: "Амаржаргал",
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
      "Батбилэг 12 минут хоцорч орсон — Данни «Хоёр дахь удаа хоцорлоо, pitch-ийн өмнө ийм байж болохгүй» гэж шууд хэлсэн. Gemini demo дээр action item-ийн assignee буруу нэр гарч байсныг Амаржаргал «prompt-д багийн нэрс байхгүй» гэж тайлбарлав. Speaker diarization Данни болон Батбилэгийн дуу хоёуланг нэг speaker болгож алдаатай байсан. Батбилэг Brisk transcript-аар өмнөх 12 минутыг уншиж ороод blocker-үүдийг давтан тайлбарлаж чадсан.",
    briskRole:
      "Хоцорсон ч Brisk архив ашиглан багт нэгдсэн — «don't be late, гэхдээ хоцорвол transcript-аар нөхнө» гэсэн бодит demo болсон.",
    listItem: {
      id: "mock-standup-day-3",
      title: "Standup — 3-р өдөр: Gemini AI хураангуй",
      ...buildStandupTimes(2, 28),
      transcriptionStatus: "done",
      summaryPreview:
        "Батбилэг 12 мин хоцорсон, Gemini буруу assignee, diarization алдаа — Brisk transcript тус болсон.",
    },
    topics: ["Хоцролт", "Gemini assignee алдаа", "Diarization", "Transcript catch-up"],
    notes: [
      {
        id: "standup-d3-n0",
        title:
          "Pitch-ийн өмнө standup-д хоцрохгүй — хоёр дахь удаа хоцорвол demo rehearsal-д оролцохгүй.",
        assignee: "Данни",
        dateTime: buildStandupTimes(2, 28).updatedAt,
        meetingId: "mock-standup-day-3",
        meetingTitle: "Standup — 3-р өдөр: Gemini AI хураангуй",
        source: "protocol",
      },
      {
        id: "standup-d3-n1",
        title:
          "BLOCKER: Gemini prompt-д багийн нэрс (Данни, Батбилэг г.м.) нэмж assignee алдааг Данни засна.",
        assignee: "Данни",
        dateTime: buildStandupTimes(2, 28).updatedAt,
        meetingId: "mock-standup-day-3",
        meetingTitle: "Standup — 3-р өдөр: Gemini AI хураангуй",
        source: "action",
      },
      {
        id: "standup-d3-n2",
        title: "Summary page дээр topic tracker болон note card UI-ийг Цолмонгэрэл дуусгана.",
        assignee: "Цолмонгэрэл",
        dateTime: buildStandupTimes(2, 28).updatedAt,
        meetingId: "mock-standup-day-3",
        meetingTitle: "Standup — 3-р өдөр: Gemini AI хураангуй",
        source: "action",
      },
      {
        id: "standup-d3-n3",
        title: "Speaker stats-ийг summary participants хэсэгт Сүх-Очир холбоно.",
        assignee: "Сүх-Очир",
        dateTime: buildStandupTimes(2, 28).updatedAt,
        meetingId: "mock-standup-day-3",
        meetingTitle: "Standup — 3-р өдөр: Gemini AI хураангуй",
        source: "action",
      },
      {
        id: "standup-d3-n4",
        title:
          "BLOCKER: Speaker diarization Данни/Батбилэгийг нэг speaker болгож байгааг Амаржаргал prompt-оор засна.",
        assignee: "Амаржаргал",
        dateTime: buildStandupTimes(2, 28).updatedAt,
        meetingId: "mock-standup-day-3",
        meetingTitle: "Standup — 3-р өдөр: Gemini AI хураангуй",
        source: "action",
      },
      {
        id: "standup-d3-n5",
        title:
          "Батбилэг 12 минут хоцорсон — Brisk transcript уншиж ороод blocker-үүдийг давтан тайлбарласан.",
        assignee: "Батбилэг",
        dateTime: buildStandupTimes(2, 28).updatedAt,
        meetingId: "mock-standup-day-3",
        meetingTitle: "Standup — 3-р өдөр: Gemini AI хураангуй",
        source: "protocol",
      },
      {
        id: "standup-d3-n6",
        title: "Дараагийн standup-уудад цагтаа орно — хоцорвол transcript-аар нөхөх ёстой.",
        assignee: "Батбилэг",
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
      "Pitch маргааш байгаа тул баг напряжен байсан. Батбилэг Queue consumer staging дээр 3 удаа унаж transcription stuck болсон — «production demo эрсдэлтэй» гэж хэлэв. Сүх-Очир кирилл regex «Сүх-Очир» гэх мэт зураастай нэрийг invite list-ээс шүүж хаяж байсныг олж илрүүлсэн. Цолмонгэрэл Home storyboard бэлэн боловч mock data бодит багийн нэрстэй таарахгүй байгааг хэлсэн. Данни «Өнөөдөр blocker-ээ хэл, маргааш pitch-д зайлшгүй бэлэн бай» гэж standup-ийг төгсгөсөн.",
    briskRole:
      "Pitch-ийн өмнөх сүүлийн standup-д blocker, хоцролт, regex алдаа бүгд Brisk summary-д тодорхой харагдаж, баг note хөтлөхгүйгээр rehearsal руу шилжсэн.",
    listItem: {
      id: "mock-standup-day-4",
      title: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
      ...buildStandupTimes(3, 30),
      transcriptionStatus: "done",
      summaryPreview:
        "Queue consumer 3 удаа унасан, regex Сүх-Очир нэрийг шүүж байсан — pitch-ийн өмнө Brisk бүх blocker-ийг цуглуулсан.",
    },
    topics: ["Queue failure", "Regex алдаа", "Pitch deadline", "Demo rehearsal"],
    notes: [
      {
        id: "standup-d4-n0",
        title: "Pitch маргааш — blocker-г өнөөдөр шийдэж, demo-д бэлэн бай. Хоцрох, side chat хориотой.",
        assignee: "Данни",
        dateTime: buildStandupTimes(3, 30).updatedAt,
        meetingId: "mock-standup-day-4",
        meetingTitle: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
        source: "protocol",
      },
      {
        id: "standup-d4-n1",
        title:
          "BLOCKER: Queue consumer + transcription retry-г Батбилэг staging дээр засаж production demo-г ногоон болгоно.",
        assignee: "Батбилэг",
        dateTime: buildStandupTimes(3, 30).updatedAt,
        meetingId: "mock-standup-day-4",
        meetingTitle: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
        source: "action",
      },
      {
        id: "standup-d4-n2",
        title: "Pitch demo script-ийг монголоор Данни эцэслэн бичнэ.",
        assignee: "Данни",
        dateTime: buildStandupTimes(3, 30).updatedAt,
        meetingId: "mock-standup-day-4",
        meetingTitle: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
        source: "action",
      },
      {
        id: "standup-d4-n3",
        title:
          "Mock story-г бодит багийн нэр (Данни, Батбилэг, Сүх-Очир, Цолмонгэрэл, Амаржаргал)-тай тааруулж Цолмонгэрэл Home page дээр шинэчилнэ.",
        assignee: "Цолмонгэрэл",
        dateTime: buildStandupTimes(3, 30).updatedAt,
        meetingId: "mock-standup-day-4",
        meetingTitle: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
        source: "action",
      },
      {
        id: "standup-d4-n4",
        title:
          "BLOCKER: Кирилл regex зураастай нэр (Сүх-Очир) шүүж байгаа алдааг Сүх-Очир invite input-д засварлана.",
        assignee: "Сүх-Очир",
        dateTime: buildStandupTimes(3, 30).updatedAt,
        meetingId: "mock-standup-day-4",
        meetingTitle: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
        source: "action",
      },
      {
        id: "standup-d4-n5",
        title:
          "Pitch rehearsal tech checklist — mic, recording, summary, queue status-ийг Амаржаргал маргааш өглөө баталгаажуулна.",
        assignee: "Амаржаргал",
        dateTime: buildStandupTimes(3, 30).updatedAt,
        meetingId: "mock-standup-day-4",
        meetingTitle: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
        source: "action",
      },
      {
        id: "standup-d4-n6",
        title:
          "Standup дуусмагц summary бэлэн — pitch бэлдэхэд note хөтлөх 30 минут хэмнэгдсэн.",
        assignee: "Данни",
        dateTime: buildStandupTimes(3, 30).updatedAt,
        meetingId: "mock-standup-day-4",
        meetingTitle: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
        source: "protocol",
      },
    ],
  },
];

export const MOCK_STANDUP_DAYS = withStandupNoteTimes(MOCK_STANDUP_DAYS_RAW);

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
