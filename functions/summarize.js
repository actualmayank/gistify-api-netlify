const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  // Allow CORS
  return handleRequest(event);
};

async function handleRequest(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders(),
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Only POST allowed" }),
    };
  }

  const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;

  if (!HUGGINGFACE_TOKEN) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Missing Hugging Face token" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const text = body?.text?.trim();
  if (!text || text.length < 20) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Text too short or missing" }),
    };
  }

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/google/pegasus-xsum", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${HUGGINGFACE_TOKEN}`,
      },
      body: JSON.stringify({ inputs: text }),
    });

    const result = await response.json();

    let summary = "No summary returned.";
    if (Array.isArray(result) && result[0]?.summary_text) {
      summary = result[0].summary_text;
    } else if (result?.summary_text) {
      summary = result.summary_text;
    } else if (result?.error) {
      summary = result.error;
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ summary }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}