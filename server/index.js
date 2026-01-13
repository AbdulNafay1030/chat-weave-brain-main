import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors({ origin: true })); // tighten this for production
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    // minimal validation
    const safeMessages = messages
      .filter(m => m && typeof m.role === "string")
      .map(m => ({
        role: m.role,
        content: [{ type: "text", text: String(m.content ?? "") }],
      }));

    const response = await client.responses.create({
      model: "gpt-5",
      input: safeMessages,
    });

    res.json({ text: response.output_text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chat failed" });
  }
});

app.listen(process.env.PORT || 5050, () => {
  console.log(`Backend running on http://localhost:${process.env.PORT || 5050}`);
});
