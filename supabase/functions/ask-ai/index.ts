import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, chatContext, history } = await req.json().catch(() => ({}));

    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "Missing question" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const systemPrompt = `You are AskAI — a general-purpose assistant inside a web app.
Respond like ChatGPT: helpful, accurate, clear, and complete.
Use markdown when helpful. If code is requested, provide working code.

${chatContext ? `Recent chat context:\n${chatContext}` : ""}`.trim();

    const msgs: ChatMsg[] = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history)
        ? history.filter((m: any) => m?.role && typeof m.content === "string")
        : []),
      { role: "user", content: question },
    ];

    // We will stream SSE to the browser
    const headers = new Headers({
      ...corsHeaders,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: any, event?: string) => {
          if (event) controller.enqueue(encoder.encode(`event: ${event}\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };

        try {
          // Call OpenAI with fetch and ask for streaming SSE back
          const r = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-5",
              stream: true,
              input: msgs.map((m) => ({
                role: m.role,
                content: [{ type: "text", text: m.content }],
              })),
            }),
          });

          if (!r.ok || !r.body) {
            const t = await r.text().catch(() => "");
            throw new Error(`OpenAI error ${r.status}: ${t}`);
          }

          // OpenAI returns SSE lines. We'll parse and forward only text deltas.
          const reader = r.body.getReader();
          const decoder = new TextDecoder();

          let buffer = "";
          let fullText = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // SSE messages are separated by \n\n
            const parts = buffer.split("\n\n");
            buffer = parts.pop() || "";

            for (const part of parts) {
              const line = part.split("\n").find((l) => l.startsWith("data: "));
              if (!line) continue;

              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              let evt: any;
              try {
                evt = JSON.parse(data);
              } catch {
                continue;
              }

              // In Responses streaming, text deltas often appear in:
              // evt.type === "response.output_text.delta" with evt.delta
              if (evt?.type === "response.output_text.delta" && typeof evt.delta === "string") {
                fullText += evt.delta;
                send({ delta: evt.delta });
              }

              // Final event comes as response.completed sometimes
              if (evt?.type === "response.completed") {
                // send final full text for safety
                send({ content: fullText }, "final");
                send({ ok: true }, "done");
                controller.close();
                return;
              }
            }
          }

          // If stream ends without completed event, still finalize
          send({ content: fullText }, "final");
          send({ ok: true }, "done");
          controller.close();
        } catch (err) {
          send({ error: err instanceof Error ? err.message : "Stream error" }, "error");
          controller.close();
        }
      },
    });

    return new Response(stream, { headers });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
