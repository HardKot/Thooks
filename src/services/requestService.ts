import {getResponseTemplate} from "@/repositories/responseTemplateRepository";
import {addRequest} from "@/repositories/requestRepository";
import {addResponse} from "@/repositories/responseRepository";

export async function handleRequest(apiRequest: Request) {
  const requestUrl = new URL(apiRequest.url);
  const normalizedUrl = `${requestUrl.pathname}${requestUrl.search}`;
  const rawBody = await apiRequest.text();
  const requestBody = rawBody.length > 0 ? rawBody : null;

  const request = await addRequest({
    method: apiRequest.method,
    url: normalizedUrl,
    headers: Object.fromEntries(apiRequest.headers.entries()),
    body: requestBody,
  })

  const { status, timeout, headers, body } = await getResponseTemplate({
    url: normalizedUrl,
    method: apiRequest.method,
  });

  await new Promise((resolve) => setTimeout(resolve, timeout));

  const responseData: {
    status: number;
    body: string;
    headers: Record<string, string>;
  } = {
    status,
    body,
    headers: {},
  };

  if (typeof headers === "object" && !Array.isArray(headers)) {
    responseData.headers = { "Content-Type": "application/json", ...headers };
  }

  const apiResponse = new Response(responseData.body, {
    status: responseData.status,
    headers: { ...responseData.headers },
  })

  await addResponse({
    requestId: request.id,
    headers: responseData.headers,
    body: responseData.body,
    status: responseData.status
  });

  return apiResponse;
}
