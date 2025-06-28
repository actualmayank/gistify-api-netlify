const fetch = require("node-fetch");

exports.handler = async function (event, context) {
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
    console.log("🧪 Hugging Face Token (length):", HUGGINGFACE_TOKEN?.length);

    const response = await fetch("https://api-inference.huggingface.co/models/google/pegasus-xsum", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
      },
      body: JSON.stringify({ inputs: text }),
    });

    const result = await response.json();
    console.log("🧪 HF Response:", result);

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
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error." }),
    };
  }
};