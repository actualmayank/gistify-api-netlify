import fetch from "node-fetch";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Only POST requests allowed" }),
    };
  }

  try {
    const { text } = JSON.parse(event.body);

    if (!text || text.trim().length < 20) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Text too short or missing." }),
      };
    }

    const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;

    if (!HUGGINGFACE_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Hugging Face token missing." }),
      };
    }

    const response = await fetch("https://api-inference.huggingface.co/models/google/pegasus-xsum", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
      },
      body: JSON.stringify({ inputs: text }),
    });

    const result = await response.json();

    const summary = Array.isArray(result)
      ? result[0]?.summary_text
      : result?.summary_text;

    if (!summary) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: result?.error || "No summary returned." }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ summary }),
    };
  } catch (err) {
    console.error("🔥 Internal server error:", err);
    return {
      statusCode: 600,
      body: JSON.stringify({ error: "Internal server error." }),
    };
  }
}
