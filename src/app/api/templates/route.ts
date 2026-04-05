import {
  addResponseTemplate,
  getResponseTemplates,
} from "@/repositories/responseTemplateRepository";

interface TemplatePayload {
  name?: string;
  method?: string;
  url?: string;
  status?: number;
  timeout?: number;
  headers?: Record<string, string>;
  body?: string;
}

export async function GET() {
  const templates = await getResponseTemplates();

  return Response.json({
    items: templates,
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as TemplatePayload;

  if (!payload.method || !payload.url) {
    return Response.json(
      { error: "method and url are required" },
      { status: 400 },
    );
  }

  const created = await addResponseTemplate({
    name: payload.name?.trim() || `${payload.method.toUpperCase()} ${payload.url}`,
    method: payload.method,
    url: payload.url,
    status: payload.status ?? 200,
    timeout: payload.timeout ?? 0,
    headers: payload.headers,
    body: payload.body,
  });

  return Response.json(created, { status: 201 });
}
