import { clientApi, TASKS_API_BASE } from "@/app/lib/client-api";
import { formatUserError } from "@/lib/errors/format-user-error";
import axios from "axios";

export type CreateTaskInput = {
  title: string;
  assigneeId?: string;
  meetingId?: string;
};

export type CreatedTask = {
  id: string;
  title: string;
  assigneeId: string | null;
  meetingId: string | null;
};

export type CreateTasksBatchResponse = {
  tasks: CreatedTask[];
};

export async function createTasksBatch(tasks: CreateTaskInput[]) {
  if (tasks.length === 0) {
    return { tasks: [] satisfies CreatedTask[] };
  }

  try {
    const { data } = await clientApi.post<CreateTasksBatchResponse>(
      `${TASKS_API_BASE}/batch`,
      { tasks },
    );
    return data;
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 404) {
      throw new Error(formatUserError(error));
    }

    const results = await Promise.all(
      tasks.map(async (task) => {
        const { data } = await clientApi.post<CreatedTask>(TASKS_API_BASE, task);
        return data;
      }),
    );

    return { tasks: results };
  }
}
