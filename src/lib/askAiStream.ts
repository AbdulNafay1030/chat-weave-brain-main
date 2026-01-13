type StreamHandlers = {
  onDelta: (chunk: string) => void;
  onFinal?: (full: string) => void;
  onError?: (msg: string) => void;
};

// Minimal SSE parser
function parseSSE(buffer: string) {
  const messages: string[] = [];
  const parts = buffer.split("\n\n");
  // keep last partial chunk in caller
  for (let i = 0; i < parts.length - 1; i++) messages.push(parts[i]);
  const rest = parts[parts.length - 1];
  return { messages, rest };
}

export async function askAiStream(
  supabaseUrl: string,
  anonKey: string,
  payload: { question: string; chatContext?: string; history?: any[] },
  handlers: StreamHandlers,
  accessToken?: string
) {
  const url = `${supabaseUrl}/functions/v1/ask-ai`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      // If your function requires auth (default), pass user token:
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "");
    handlers.onError?.(`HTTP ${res.status}: ${t}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });
    const { messages, rest } = parseSSE(buf);
    buf = rest;

    for (const msg of messages) {
      // Example chunk:
      // event: final
      // data: {"content":"..."}
      const lines = msg.split("\n");
      const dataLine = lines.find((l) => l.startsWith("data: "));
      const eventLine = lines.find((l) => l.startsWith("event: "));

      if (!dataLine) continue;

      const json = JSON.parse(dataLine.slice(6));
      const eventName = eventLine ? eventLine.slice(7).trim() : "";

      if (eventName === "error") {
        handlers.onError?.(json.error || "Unknown stream error");
      } else if (eventName === "final") {
        handlers.onFinal?.(json.content || "");
      } else {
        // delta tokens
        if (json.delta) handlers.onDelta(json.delta);
      }
    }
  }
}
