"use client";

import { useEffect, useMemo, useState } from "react";

type RequestItem = {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  createdAt: string;
  response: {
    id: string;
    status: number;
    headers: Record<string, string>;
    body: string | null;
    createdAt: string;
  } | null;
};

type TemplateItem = {
  id: string;
  name: string;
  method: string;
  url: string;
  status: number;
  timeout: number;
  body: string | null;
  createdAt: string;
};

type TemplateFormState = {
  name: string;
  method: string;
  url: string;
  status: string;
  timeout: string;
  body: string;
};

const INITIAL_TEMPLATE_STATE: TemplateFormState = {
  name: "",
  method: "*",
  url: "*",
  status: "200",
  timeout: "0",
  body: '{"message":"OK"}',
};

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function Home() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState<TemplateFormState>(INITIAL_TEMPLATE_STATE);

  const selectedRequest = useMemo(
    () => requests.find((item) => item.id === selectedRequestId) ?? requests[0] ?? null,
    [requests, selectedRequestId],
  );

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [requestsResponse, templatesResponse] = await Promise.all([
          fetch("/api/requests?page=1&pageSize=200", { cache: "no-store" }),
          fetch("/api/templates", { cache: "no-store" }),
        ]);

        if (!requestsResponse.ok) {
          throw new Error("Failed to load requests");
        }

        if (!templatesResponse.ok) {
          throw new Error("Failed to load templates");
        }

        const requestsPayload = (await requestsResponse.json()) as { items: RequestItem[] };
        const templatesPayload = (await templatesResponse.json()) as { items: TemplateItem[] };

        if (isMounted) {
          setRequests(requestsPayload.items);
          setTemplates(templatesPayload.items);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadData();
    const intervalId = globalThis.setInterval(() => {
      void loadData();
    }, 2000);

    return () => {
      isMounted = false;
      globalThis.clearInterval(intervalId);
    };
  }, []);

  const submitTemplate = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setIsSavingTemplate(true);
    setError(null);

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: templateForm.name,
          method: templateForm.method,
          url: templateForm.url,
          status: Number(templateForm.status),
          timeout: Number(templateForm.timeout),
          body: templateForm.body,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Template save failed");
      }

      const templatesResponse = await fetch("/api/templates", { cache: "no-store" });
      const templatesPayload = (await templatesResponse.json()) as { items: TemplateItem[] };
      setTemplates(templatesPayload.items);
      setTemplateForm(INITIAL_TEMPLATE_STATE);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Template save failed");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-300 bg-zinc-900 px-4 py-3 text-zinc-100">
        <h1 className="text-lg font-semibold">THooks</h1>
        <p className="text-sm text-zinc-300">MailHog-style request inspector</p>
      </header>

      <main className="grid min-h-[calc(100vh-53px)] grid-cols-12 gap-0">
        <section className="col-span-4 flex flex-col border-r border-zinc-300 bg-zinc-50">
          <div className="border-b border-zinc-300 px-3 py-2 text-sm font-medium">
            Requests ({requests.length})
          </div>
          <div className="overflow-auto">
            {requests.map((item) => {
              const isActive = selectedRequest?.id === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedRequestId(item.id)}
                  className={`w-full border-b border-zinc-200 px-3 py-2 text-left transition ${
                    isActive ? "bg-zinc-200" : "hover:bg-zinc-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs uppercase">{item.method}</span>
                    <span className="text-xs text-zinc-500">{item.response?.status ?? "-"}</span>
                  </div>
                  <p className="truncate text-sm">{item.url}</p>
                  <p className="text-xs text-zinc-500">{formatDate(item.createdAt)}</p>
                </button>
              );
            })}

            {!loading && requests.length === 0 && (
              <p className="px-3 py-5 text-sm text-zinc-500">No requests captured yet.</p>
            )}
          </div>
        </section>

        <section className="col-span-8 grid grid-rows-[auto_1fr]">
          <form
            onSubmit={submitTemplate}
            className="grid grid-cols-12 gap-2 border-b border-zinc-300 bg-white px-3 py-3"
          >
            <input
              value={templateForm.name}
              onChange={(event) =>
                setTemplateForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Template name"
              className="col-span-3 rounded border border-zinc-300 px-2 py-1 text-sm"
            />
            <input
              value={templateForm.method}
              onChange={(event) =>
                setTemplateForm((current) => ({ ...current, method: event.target.value.toUpperCase() }))
              }
              placeholder="Method (*, GET, POST...)"
              className="col-span-2 rounded border border-zinc-300 px-2 py-1 text-sm"
            />
            <input
              value={templateForm.url}
              onChange={(event) =>
                setTemplateForm((current) => ({ ...current, url: event.target.value }))
              }
              placeholder="URL (/api/mock/*)"
              className="col-span-3 rounded border border-zinc-300 px-2 py-1 text-sm"
            />
            <input
              value={templateForm.status}
              onChange={(event) =>
                setTemplateForm((current) => ({ ...current, status: event.target.value }))
              }
              placeholder="Status"
              className="col-span-1 rounded border border-zinc-300 px-2 py-1 text-sm"
            />
            <input
              value={templateForm.timeout}
              onChange={(event) =>
                setTemplateForm((current) => ({ ...current, timeout: event.target.value }))
              }
              placeholder="Delay ms"
              className="col-span-1 rounded border border-zinc-300 px-2 py-1 text-sm"
            />
            <button
              type="submit"
              disabled={isSavingTemplate}
              className="col-span-2 rounded bg-zinc-900 px-3 py-1 text-sm font-medium text-zinc-100 disabled:opacity-50"
            >
              {isSavingTemplate ? "Saving..." : "Add template"}
            </button>
            <textarea
              value={templateForm.body}
              onChange={(event) =>
                setTemplateForm((current) => ({ ...current, body: event.target.value }))
              }
              placeholder="Response body"
              className="col-span-12 h-20 rounded border border-zinc-300 px-2 py-1 text-xs"
            />
          </form>

          <div className="grid grid-cols-2 gap-0">
            <div className="border-r border-zinc-300 bg-white">
              <div className="border-b border-zinc-300 px-3 py-2 text-sm font-medium">Request</div>
              {selectedRequest ? (
                <div className="space-y-3 p-3 text-sm">
                  <p>
                    <span className="font-semibold">Method:</span> {selectedRequest.method}
                  </p>
                  <p>
                    <span className="font-semibold">URL:</span> {selectedRequest.url}
                  </p>
                  <div>
                    <p className="mb-1 font-semibold">Headers</p>
                    <pre className="max-h-48 overflow-auto rounded bg-zinc-100 p-2 text-xs">
                      {prettyJson(selectedRequest.headers)}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold">Body</p>
                    <pre className="max-h-48 overflow-auto rounded bg-zinc-100 p-2 text-xs">
                      {selectedRequest.body || "(empty)"}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="p-3 text-sm text-zinc-500">Select a request.</p>
              )}
            </div>

            <div className="bg-white">
              <div className="border-b border-zinc-300 px-3 py-2 text-sm font-medium">Response / Templates</div>
              <div className="space-y-3 p-3 text-sm">
                {selectedRequest?.response ? (
                  <>
                    <p>
                      <span className="font-semibold">Status:</span> {selectedRequest.response.status}
                    </p>
                    <div>
                      <p className="mb-1 font-semibold">Headers</p>
                      <pre className="max-h-36 overflow-auto rounded bg-zinc-100 p-2 text-xs">
                        {prettyJson(selectedRequest.response.headers)}
                      </pre>
                    </div>
                    <div>
                      <p className="mb-1 font-semibold">Body</p>
                      <pre className="max-h-36 overflow-auto rounded bg-zinc-100 p-2 text-xs">
                        {selectedRequest.response.body || "(empty)"}
                      </pre>
                    </div>
                  </>
                ) : (
                  <p className="text-zinc-500">No response linked yet.</p>
                )}

                <div>
                  <p className="mb-1 font-semibold">Active templates ({templates.length})</p>
                  <div className="max-h-44 overflow-auto rounded border border-zinc-200">
                    {templates.map((template) => (
                      <div key={template.id} className="border-b border-zinc-200 px-2 py-1 text-xs last:border-b-0">
                        <p className="font-medium">{template.name}</p>
                        <p>
                          {template.method} {template.url} → {template.status} ({template.timeout}ms)
                        </p>
                      </div>
                    ))}
                    {templates.length === 0 && (
                      <p className="px-2 py-2 text-xs text-zinc-500">No templates configured.</p>
                    )}
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
