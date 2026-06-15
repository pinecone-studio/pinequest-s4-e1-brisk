import { and, eq } from "drizzle-orm";
import type { useDB } from "../db/db";
import { meetings, meetingSummaries } from "../../schema/meeting.model";
import { meetingTranscriptions } from "../../schema/meetingTranscription/meeting-transcription.schema";
import { standaloneRecordings } from "../../schema/recordings.schema";

const DEMO_STANDUP_MARKER_ID = "mock-standup-day-1";

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
      "LiveKit аудио урсгал, Cloudflare D1 схем, Clerk нэвтрэлт — Brisk даалгавруудыг автоматаар action item болгосон.",
    meetingContent:
      "Багийнхан Brisk платформын гол цөм болох LiveKit-ээр дамжуулж аудиог хэрхэн тасралтгүй авах, Cloudflare D1 өгөгдлийн санд уулзалтын мэдээллийг хэрхэн бүтэцжүүлж хадгалах, мөн Clerk ашиглан багуудын нэвтрэх хэсгийг хэлэлцсэн.",
    briskRole:
      'Багийн анхны уулзалтын аудиог Brisk өөрөө бичиж авснаар "LiveKit болон D1 холболтыг хэн хариуцах" даалгавруудыг автоматаар ялган тэмдэглэж, note хөтлөх цагийг хэмнэсэн.',
    topics: ["LiveKit аудио", "Cloudflare D1", "Clerk нэвтрэлт", "Egress бичлэг"],
    dayOffset: 0,
    durationMinutes: 22,
  },
  {
    id: "mock-standup-day-2",
    recordingId: "mock-standup-recording-2",
    title: "Standup — 2-р өдөр: Chimege API интеграц",
    summaryPreview:
      "Chimege live транскрипц, latency шийдэл, Home page UI бүтэц — техникийн шийдвэрүүд Brisk-д хадгалагдсан.",
    meetingContent:
      "Chimege API-ийг системдээ холбож, уулзалтын явцад ярьж буй Монгол яриаг алдаагүй, шууд (live) бичвэр болгон буулгах логикийг хэлэлцсэн.",
    briskRole:
      "Уулзалтын үеэр гарсан Chimege API-ийн latency болон аудио форматын асуудлыг шийдвэрлэх техникийн яриаг Brisk текст болгон хадгалж, дараагийн алхмуудыг тодорхойлсон.",
    topics: ["Chimege API", "Live транскрипц", "Home page UI", "Latency"],
    dayOffset: 1,
    durationMinutes: 25,
  },
  {
    id: "mock-standup-day-3",
    recordingId: "mock-standup-recording-3",
    title: "Standup — 3-р өдөр: Gemini AI хураангуй",
    summaryPreview:
      "Gemini summary, action item ялгалт, speaker diarization — хоцорсон гишүүн transcript архиваар нэгдсэн.",
    meetingContent:
      "Бичигдсэн Монгол бичвэрээс Gemini AI ашиглан уулзалтын гол санаа, хураангуй (Summary) болон хэн юу хийх ёстойг (Action Items) автоматаар ялгаж, спикерүүдийг таних промптыг эцэслэн тохирохоор уулзсан.",
    briskRole:
      "Энэхүү хүнд сэдвийг хэлэлцэж байх үед уулзалтаас хоцорсон гишүүн Brisk-ийн архивыг нээж, өмнөх минутуудад юу яригдсаныг гүйцэж уншаад багтайгаа шууд нэгдсэн.",
    topics: ["Gemini AI", "Action items", "Speaker diarization", "Summary UI"],
    dayOffset: 2,
    durationMinutes: 28,
  },
  {
    id: "mock-standup-day-4",
    recordingId: "mock-standup-recording-4",
    title: "Standup — 4-р өдөр: Queue ба pitch бэлдэлт",
    summaryPreview:
      "Cloudflare Queue pipeline, кирилл regex validation, 8 минутын pitch demo script — 30 минут note хөтлөлт хэмнэгдсэн.",
    meetingContent:
      "Бичлэгийг ард талд (background) цarцаахгүйгээр боловсруулах Cloudflare Workers болон Queue (дараалал)-ийн холболтыг шалгах, Монгол хэлний кирилл үсгийн валидацийг Regex-ээр эцэслэн шалгаж, оройны 8 минутын бүтэн илтгэл (Pitch)-дээ бэлдэхээр ярилцсан.",
    briskRole:
      "Уулзалт дуусмагц тэмдэглэл бичихэд зарцуулдаг байсан 30 минутыг 0 минут болгон хэмнэж, багийн гишүүдэд демо илтгэлдээ бүрэн анхаарлаа хандуулах боломжийг олгосон.",
    topics: ["Cloudflare Queue", "Background processing", "Кирилл validation", "Pitch demo"],
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
  const [existing] = await db
    .select({ id: meetings.id })
    .from(meetings)
    .where(and(eq(meetings.userId, userId), eq(meetings.id, DEMO_STANDUP_MARKER_ID)))
    .limit(1);

  if (existing) {
    return { seeded: false };
  }

  for (const day of DEMO_STANDUP_DAYS) {
    const { start, end } = buildStandupTimes(day.dayOffset, day.durationMinutes);
    const summaryContent = `${day.meetingContent}\n\nBrisk-ийн үүрэг: ${day.briskRole}`;
    const transcript = summaryContent;
    const durationSeconds = Math.max(60, Math.round((end.getTime() - start.getTime()) / 1000));

    await db.insert(meetings).values({
      id: day.id,
      userId,
      title: day.title,
      createdAt: start,
      updatedAt: end,
    });

    await db.insert(meetingSummaries).values({
      id: `summary_${day.id}`,
      meetingId: day.id,
      content: summaryContent,
      keyPoints: [day.summaryPreview, ...day.topics],
      actionItems: [],
      createdAt: end,
      updatedAt: end,
    });

    await db.insert(meetingTranscriptions).values({
      id: `transcription_${day.id}`,
      meetingId: day.id,
      roomName: day.id,
      transcript,
      summary: summaryContent,
      participantNames: [ownerName],
      participantEmails: [{ name: ownerName, email: ownerEmail }],
      status: "done",
      createdAt: start,
      updatedAt: end,
      completedAt: end,
    });

    await db.insert(standaloneRecordings).values({
      id: day.recordingId,
      userId,
      title: day.title,
      audioUrl: `demo://${day.recordingId}`,
      status: "done",
      speakerCount: 4,
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
