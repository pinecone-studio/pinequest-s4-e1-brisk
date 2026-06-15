import { formatHttpError } from "@/lib/errors/format-user-error";

type MeetingApiOptions = {
  body?: unknown;
  method?: "DELETE" | "GET" | "PATCH" | "POST";
};

type ClerkWindow = Window & {
  Clerk?: {
    loaded?: boolean;
    load?: () => Promise<void>;
    session?: {
      getToken: () => Promise<string | null>;
    } | null;
  };
};

const getErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { error?: string };
    return formatHttpError(response.status, data.error);
  } catch {
    return formatHttpError(response.status);
  }
};

const getClerkToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  try {
    const clerk = (window as ClerkWindow).Clerk;
    if (!clerk) return null;

    const waitForClerk =
      clerk.loaded || !clerk.load ? Promise.resolve() : clerk.load();

    await Promise.race([
      waitForClerk,
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 5_000);
      }),
    ]);

    return (await clerk.session?.getToken()) ?? null;
  } catch {
    return null;
  }
};

export const meetingApi = async <TResponse>(
  path: string,
  options: MeetingApiOptions = {}
) => {
  const token = await getClerkToken();
  const headers: Record<string, string> = {};

  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(path, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
    headers: Object.keys(headers).length ? headers : undefined,
    method: options.method ?? "GET",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as TResponse;
};
