const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const TRIAGE_PROMPT = `You are an AI assistant for a U.S. Congressional office. Analyze the following constituent message and return a JSON object with these fields:

{
  "topics": ["array of topic tags from: healthcare, medicare, immigration, infrastructure, transportation, education, veterans, disability, tax, IRS, social_security, data_privacy, agriculture, farm_bill, broadband, disaster_relief, FEMA, public_safety, small_business, legislation, community_event, nutrition, economic_development, casework, other"],
  "urgency": "low | normal | high | critical",
  "sentiment": "positive | neutral | negative",
  "sentimentScore": -1.0 to 1.0,
  "intent": "casework_request | casework_followup | policy_feedback | policy_opposition | policy_support | thank_you | complaint | meeting_request | event_invitation | information_request | policy_advocacy | other",
  "agency": "relevant federal agency abbreviation or null (e.g. CMS, USCIS, VA, IRS, SSA, FEMA, USDA, DOE, FCC, SBA, FHWA)",
  "caseReference": "any case/reference number mentioned, or null",
  "requiresResponse": true | false,
  "suggestedRoute": "chief_of_staff | legislative_correspondent | caseworker | scheduler | communications_director",
  "flags": ["array of flags: repeat_contact, escalation_risk, possible_threat, security_review, walk_in_expected, veteran, mental_health_mention, high_priority, financial_hardship, public_facing, viral_risk, shareable, subject_matter_expert, data_available, meeting_request, government_official, budget_impact, organized_campaign, template_detected, batch_message, senior_citizen, possible_agency_error"]
}

Rules:
- Route casework requests to "caseworker"
- Route meeting/event requests to "scheduler"
- Route policy feedback and general correspondence to "legislative_correspondent"
- Route security concerns, trend alerts, and high-level approvals to "chief_of_staff"
- Route social media and press items to "communications_director"
- Mark urgency as "critical" if there is medical urgency, a security concern, or imminent financial harm
- Respond ONLY with valid JSON, no markdown or explanation`;

const DRAFT_PROMPT = `You are a professional correspondence writer for a U.S. Congressional office. Write a response to the following constituent message.

Guidelines:
- Professional but warm tone
- Acknowledge the constituent's specific concern
- Reference any case numbers or specifics they mentioned
- If casework: explain next steps and timeline
- If policy feedback: thank them and share the representative's relevant position
- If event invitation: express interest and mention scheduler follow-up
- If complaint: de-escalate, show empathy, offer concrete next steps
- Keep responses under 200 words
- Do not fabricate policy positions - keep responses general where unsure
- Sign off with "[Office of Representative]"

Respond ONLY with the draft text, no JSON or markdown wrapping.`;

async function triageMessage(message) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `${TRIAGE_PROMPT}

Channel: ${message.channel}
From: ${message.from?.name || "Unknown"}
Subject: ${message.subject}
Body: ${message.body}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Strip markdown fences if present
    const clean = text.replace(/```json\n?|```\n?/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      topics: parsed.topics || [],
      urgency: parsed.urgency || "normal",
      sentiment: parsed.sentiment || "neutral",
      sentimentScore: parsed.sentimentScore || 0,
      intent: parsed.intent || "other",
      agency: parsed.agency || null,
      caseReference: parsed.caseReference || null,
      requiresResponse: parsed.requiresResponse ?? true,
      suggestedRoute: parsed.suggestedRoute || "legislative_correspondent",
      flags: parsed.flags || [],
    };
  } catch (err) {
    console.error("Gemini triage error:", err.message);
    // Return safe defaults on failure
    return {
      topics: ["other"],
      urgency: "normal",
      sentiment: "neutral",
      sentimentScore: 0,
      intent: "other",
      agency: null,
      caseReference: null,
      requiresResponse: true,
      suggestedRoute: "legislative_correspondent",
      flags: ["ai_triage_failed"],
    };
  }
}

async function generateDraft(message, aiTags) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `${DRAFT_PROMPT}

Channel: ${message.channel}
From: ${message.from?.name || "Unknown"}
Subject: ${message.subject}
Body: ${message.body}

AI Analysis:
- Topics: ${aiTags.topics.join(", ")}
- Intent: ${aiTags.intent}
- Urgency: ${aiTags.urgency}
- Agency involved: ${aiTags.agency || "none"}
- Case reference: ${aiTags.caseReference || "none"}`;

    const result = await model.generateContent(prompt);
    const draftBody = result.response.text().trim();

    return {
      body: draftBody,
      confidence: estimateConfidence(aiTags),
      status: "pending_approval",
    };
  } catch (err) {
    console.error("Gemini draft error:", err.message);
    return null;
  }
}

// Heuristic confidence score based on how clear-cut the message is
function estimateConfidence(aiTags) {
  let score = 0.75;
  if (aiTags.intent !== "other") score += 0.05;
  if (aiTags.topics.length > 0 && aiTags.topics[0] !== "other") score += 0.05;
  if (aiTags.agency) score += 0.03;
  if (aiTags.caseReference) score += 0.04;
  if (Math.abs(aiTags.sentimentScore) > 0.5) score += 0.03;
  if (aiTags.flags.includes("possible_threat")) score -= 0.2;
  if (aiTags.flags.includes("ai_triage_failed")) score = 0;
  return Math.min(Math.max(score, 0), 1);
}

module.exports = { triageMessage, generateDraft };
