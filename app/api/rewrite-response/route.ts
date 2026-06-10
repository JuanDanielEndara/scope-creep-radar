import OpenAI from "openai";
import { NextResponse } from "next/server";

const MODEL = "gpt-4.1-nano";

const SYSTEM_PROMPT = `
You are a senior product/project management communication assistant.

Your job is to rewrite a PM's suggested response to a client or stakeholder.

Return only the rewritten response as plain text.
Do not return JSON.
Do not include Markdown.
Do not add explanations.
Do not add subject lines.
Do not invent new facts.
Preserve the original intent, constraints, and trade-offs.

Tone options:

"softer":
- Make the response warmer, more collaborative, and more relationship-oriented.
- Keep it professional.
- Do not weaken important scope, priority, or trade-off boundaries.
- Do not say yes too early.

"firmer":
- Make the response clearer, more direct, and more boundary-setting.
- Keep it respectful and constructive.
- Do not sound aggressive, dismissive, or defensive.
- Preserve collaboration while making constraints more explicit.

General rules:
- Keep the response concise and ready to send.
- Use natural business language.
- Avoid jargon unless it is already present in the original response.
- If the original response mentions estimation, scope, sprint trade-offs, launch risk, or prioritization, preserve those ideas.
`;

function buildUserInput({
  currentResponse,
  tone,
  riskLevel,
  requestText,
}: {
  currentResponse: string;
  tone: "softer" | "firmer";
  riskLevel?: string;
  requestText?: string;
}) {
  return `
Tone requested:
${tone}

Risk level:
${riskLevel || "Not provided"}

Original request:
${requestText || "Not provided"}

Current suggested response:
${currentResponse}
`.trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const currentResponse = body.currentResponse;
    const tone = body.tone;
    const riskLevel = body.riskLevel;
    const requestText = body.requestText;

    if (!currentResponse || typeof currentResponse !== "string") {
      return NextResponse.json(
        { error: "currentResponse is required." },
        { status: 400 }
      );
    }

    if (tone !== "softer" && tone !== "firmer") {
      return NextResponse.json(
        { error: "tone must be either 'softer' or 'firmer'." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model: MODEL,
      instructions: SYSTEM_PROMPT,
      input: buildUserInput({
        currentResponse,
        tone,
        riskLevel,
        requestText,
      }),
      max_output_tokens: 400,
    });

    const rewrittenResponse = response.output_text.trim();

    if (!rewrittenResponse) {
      return NextResponse.json(
        { error: "The model returned an empty response." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rewrittenResponse,
    });
  } catch (error) {
    console.error("Rewrite response API error:", error);

    return NextResponse.json(
      { error: "Unexpected error while rewriting response." },
      { status: 500 }
    );
  }
}