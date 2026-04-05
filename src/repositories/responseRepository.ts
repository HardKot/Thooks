import {prisma} from "@/prisma";

interface IResponse {
  headers: Record<string, string>;
  body: string | null;
  requestId: string;
  status: number;
}

export function addResponse({ headers, body, requestId, status }: IResponse) {
  return prisma.response.create({
    data: {
      status,
      headers,
      body,
      requestId
    }
  })
}
