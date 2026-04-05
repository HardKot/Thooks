import { getRequests } from "@/repositories/requestRepository";

function getIntParam(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = Math.max(getIntParam(searchParams.get("page"), 1), 1);
  const pageSize = Math.min(Math.max(getIntParam(searchParams.get("pageSize"), 50), 1), 200);
  const filterByMethod = searchParams.get("method") ?? undefined;
  const filterByUrl = searchParams.get("url") ?? undefined;

  const requests = await getRequests({
    page,
    pageSize,
    filterByMethod,
    filterByUrl,
    orderBy: {
      field: "createdAt",
      direction: "desc",
    },
  });

  return Response.json({
    page,
    pageSize,
    items: requests,
  });
}
