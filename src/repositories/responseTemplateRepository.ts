import {prisma, ResponseTemplate} from "@/prisma";

interface IResponseResponseGet {
  method?: string;
  url?: string;
}

interface IResponseTemplateCreate {
  name: string;
  method: string;
  url: string;
  status: number;
  timeout?: number;
  headers?: Record<string, string>;
  body?: string;
}

function getTemplatePriority(template: ResponseTemplate, method?: string, url?: string) {
  if (template.method === method && template.url === url) return 3;
  if (template.method === "*" && template.url === url) return 2;
  if (template.method === method && template.url === "*") return 1;
  return 0;
}

const DEFAULT_RESPONSE = {
  status: 200,
  timeout: 0,
  headers: {},
  body: `{ "message": "OK" }`,
}

export async function getResponseTemplate({ method, url }: IResponseResponseGet) {
  const normalizedMethod = method?.toUpperCase();
  const templates = await prisma.responseTemplate.findMany({
    where: {
      OR: [{
        method: normalizedMethod, url
      }, {
        url, method: "*"
      }, {
        method: normalizedMethod, url: "*"
      }]
    }
  });

  let match: ResponseTemplate | null = null;
  let bestPriority = 0;

  for (const template of templates) {
    const priority = getTemplatePriority(template, normalizedMethod, url);
    if (priority > bestPriority) {
      bestPriority = priority;
      match = template;
    }

    if (bestPriority === 3) {
      break;
    }
  }

  if (!match) return DEFAULT_RESPONSE;
  const data = { ...DEFAULT_RESPONSE }

  if (match.status) data.status = match.status;
  if (typeof match.timeout === "number") data.timeout = match.timeout;
  if (match.headers) data.headers = match.headers;
  if (match.body) data.body = match.body;

  return data
}

export function addResponseTemplate({
  name,
  method,
  url,
  status,
  timeout = 0,
  headers,
  body,
}: IResponseTemplateCreate) {
  return prisma.responseTemplate.create({
    data: {
      name,
      method: method.toUpperCase(),
      url,
      status,
      timeout,
      headers,
      body,
    }
  });
}

export function getResponseTemplates() {
  return prisma.responseTemplate.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}
