import { and, eq } from "drizzle-orm";
import type { useDB } from "../db/db";
import { meetings, meetingSummaries } from "../../schema/meeting.model";
import { meetingTranscriptions } from "../../schema/meetingTranscription/meeting-transcription.schema";
import { standaloneRecordings } from "../../schema/recordings.schema";

const DEMO_STANDUP_MARKER_ID = "mock-standup-day-1";

const BRISK_STANDUP_TEAM_NAMES = [
  "Дэнни",
  "Бат-Оргил",
  "Сүх-Очир",
  "Цолмонгэрэл",
  "Амаржаргал",
] as const;

const BRISK_STANDUP_TEAM_EMAILS: Record<(typeof BRISK_STANDUP_TEAM_NAMES)[number], string> = {
  Дэнни: "danny.otgontsetseg@gmail.com",
  "Бат-Оргил": "batblg247@gmail.com",
  "Сүх-Очир": "batjargalsukhochir27@gmail.com",
  Цолмонгэрэл: "tsomoobayasaa@gmail.com",
  Амаржаргал: "maraa96098@gmail.com",
};

type DemoStandupDaySeed = {
  id: string;
  recordingId: string;
  title: string;
  summaryPreview: string;
  meetingContent: string;
  briskRole: string;
  topics: string[];
  dayOffset: number;
  durationMinutes: number;
};

const DEMO_STANDUP_DAYS: DemoStandupDaySeed[] = [
  {
    id: "mock-standup-day-1",
    recordingId: "mock-standup-recording-1",
    title: "Standup — 1-р өдөр: Аудио урсгал ба баазын бүтэц",
    summaryPreview:
      "Сүх-Очир хоцорсон, Батбилэг D1 blocker, Амаржаргал Egress 403 — Brisk бүгдийг action item болгосон.",
    meetingContent:
      "Данни 09:00-д standup нээхэд Сүх-Очир 5 минут хоцорч орсон — «Дараагийн удаа цагтаа орно уу, бид Brisk-ээр бичиж байгаа» гэж сануулав. Батбилэг LiveKit→D1 холболт дээр foreign key алдаа гарч блоклогдсон байгааг тайлбарлаж, шийдэл нь migration-ийг эхлээд Цолмонгэрэл review-д өгөх шаардлагатай болохыг хэлсэн. Амаржаргал Egress webhook 403 буцааж байгаа тул staging бичлэг бүрэн ажиллахгүй байна.",
    briskRole:
      "Brisk багийн анхны standup-ийг бүрэн бичиж, blocker-уудыг action item болгон ялгаж, note хөтлөх 20 минут хэмнэгдсэн.",
    topics: ["LiveKit аудио", "D1 migration blocker", "Egress 403 алдаа", "Standup цагийн дүрэм"],
    dayOffset: 0,
    durationMinutes: 22,
  },
  {
    id: "mock-standup-day-2",
    recordingId: "mock-standup-recording-2",
    title: "Standup — 2-р өдөр: Chimege API интеграц",
    summaryPreview:
      "Chimege 8 сек latency, Safari event stream blocker — баг ичгүүртэй байсан ч Brisk шийдвэрийг тодорхойлсон.",
    meetingContent:
      "Chimege live demo дээр 8 секундын latency гарч баг ичгүүртэй байсан. Цолмонгэрэл Home feed-ийн mock-ийг Батбилэгийн meeting list API-аас хараахан хүлээж байгааг хэлсэн. Сүх-Очир Safari дээр Chimege event stream огт ирэхгүй blocker-ийг өгсөн.",
    briskRole:
      "Latency-ийн маргаан гарсан ч Brisk transcript-оор blocker-уудыг ялгаж, баг дахин давтахгүйгээр шийдвэрлэх замаа олсон.",
    topics: ["Chimege latency", "Safari blocker", "Home feed dependency", "Standup дүрэм"],
    dayOffset: 1,
    durationMinutes: 25,
  },
  {
    id: "mock-standup-day-3",
    recordingId: "mock-standup-recording-3",
    title: "Standup — 3-р өдөр: Gemini AI хураангуй",
    summaryPreview:
      "Батбилэг 12 мин хоцорсон, Gemini буруу assignee, diarization алдаа — Brisk transcript тус болсон.",
    meetingContent:
      "Батбилэг 12 минут хоцорч орсон — Данни pitch-ийн өмнө ийм байж болохгүй гэж сануулав. Gemini assignee буруу гарч, diarization Данни/Батбилэгийг нэг speaker болгож байсан. Батбилэг Brisk transcript-аар яриаг гүйцээж ороод blocker-үүдийг давтан тайлбарласан.",
    briskRole:
      "Хоцорсон ч Brisk архив ашиглан багт нэгдсэн — don't be late, гэхдээ хоцорвол transcript-аар нөхнө.",
    topics: ["Хоцролт", "Gemini assignee алдаа", "Diarization", "Transcript catch-up"],
    dayOffset: 2,
    durationMinutes: 28,
  },
  {
    id: "mock-standup-day-4",
    recordingId: "mock-standup-recording-4",
    title: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
    summaryPreview:
      "Queue consumer 3 удаа унасан, regex Сүх-Очир нэрийг шүүж байсан — pitch-ийн өмнө Brisk бүх blocker-ийг цуглуулсан.",
    meetingContent:
      "Pitch маргааш байгаа тул баг напряжен байсан. Батбилэг Queue consumer staging дээр 3 удаа унаж transcription stuck болсон. Сүх-Очир кирилл regex зураастай нэрийг invite list-ээс шүүж хаяж байсныг олсон. Данни blocker-ээ хэлж, pitch-д бэлэн бай гэж standup-ийг төгсгөсөн.",
    briskRole:
      "Pitch-ийн өмнөх сүүлийн standup-д blocker-ууд Brisk summary-д тодорхой харагдаж, note хөтлөхгүйгээр rehearsal руу шилжсэн.",
    topics: ["Queue failure", "Regex алдаа", "Pitch deadline", "Demo rehearsal"],
    dayOffset: 3,
    durationMinutes: 30,
  },
];

const standupBaseDate = new Date("2026-06-11T09:00:00.000Z");

const buildStandupTimes = (dayOffset: number, durationMinutes: number) => {
  const start = new Date(standupBaseDate);
  start.setUTCDate(start.getUTCDate() + dayOffset);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { start, end };
};

type DbClient = ReturnType<typeof useDB>;

export async function ensureDemoStandupForUser(
  db: DbClient,
  userId: string,
  ownerEmail: string,
  ownerName: string,
) {
  const scopedMarkerId = `${DEMO_STANDUP_MARKER_ID}__${userId}`;

  const [existing] = await db
    .select({ id: meetings.id })
    .from(meetings)
    .where(and(eq(meetings.userId, userId), eq(meetings.id, scopedMarkerId)))
    .limit(1);

  if (existing) {
    return { seeded: false };
  }

  for (const day of DEMO_STANDUP_DAYS) {
    const { start, end } = buildStandupTimes(day.dayOffset, day.durationMinutes);
    const summaryContent = `${day.meetingContent}\n\nBrisk-ийн үүрэг: ${day.briskRole}`;
    const transcript = summaryContent;
    const durationSeconds = Math.max(60, Math.round((end.getTime() - start.getTime()) / 1000));
    const meetingId = `${day.id}__${userId}`;
    const recordingId = `${day.recordingId}__${userId}`;

    await db.insert(meetings).values({
      id: meetingId,
      userId,
      title: day.title,
      createdAt: start,
      updatedAt: end,
    });

    await db.insert(meetingSummaries).values({
      id: `summary_${meetingId}`,
      meetingId,
      content: summaryContent,
      keyPoints: [day.summaryPreview, ...day.topics],
      actionItems: [],
      createdAt: end,
      updatedAt: end,
    });

    await db.insert(meetingTranscriptions).values({
      id: `transcription_${meetingId}`,
      meetingId,
      roomName: meetingId,
      transcript,
      summary: summaryContent,
      participantNames: [...BRISK_STANDUP_TEAM_NAMES],
      participantEmails: BRISK_STANDUP_TEAM_NAMES.map((name) => ({
        name,
        email: name === "Дэнни" ? ownerEmail : BRISK_STANDUP_TEAM_EMAILS[name],
      })),
      status: "done",
      createdAt: start,
      updatedAt: end,
      completedAt: end,
    });

    await db.insert(standaloneRecordings).values({
      id: recordingId,
      userId,
      title: day.title,
      audioUrl: `demo://${recordingId}`,
      status: "done",
      speakerCount: BRISK_STANDUP_TEAM_NAMES.length,
      transcript,
      keyPoints: [day.summaryPreview, ...day.topics],
      durationSeconds,
      fileSizeBytes: 1_200_000 + (day.dayOffset + 1) * 180_000,
      createdAt: start,
      updatedAt: end,
    });
  }

  return { seeded: true };
}
