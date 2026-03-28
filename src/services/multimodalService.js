const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ============================================================
// AUDIO PROCESSING
// Pass audio directly to Gemini for transcription + analysis
// Supports: mp3, wav, ogg, flac, m4a
// ============================================================
async function processAudio(audioBuffer, mimeType, context) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const audioData = {
    inlineData: {
      data: audioBuffer.toString("base64"),
      mimeType: mimeType || "audio/mp3",
    },
  };

  const prompt = `You are an AI assistant for a U.S. Congressional office. 
This audio is a ${context?.type || "voicemail/meeting recording"}.

Do the following:
1. Transcribe the audio accurately
2. Identify the speaker(s) if possible
3. Extract key information

Return ONLY valid JSON:
{
  "transcript": "full transcription",
  "speakers": ["identified speakers"],
  "summary": "2-3 sentence summary",
  "keyPoints": ["main points"],
  "sentiment": "positive | neutral | negative",
  "urgency": "low | normal | high | critical",
  "actionItems": ["any actions needed"],
  "topics": ["relevant topics"],
  "constituentName": "name if identified or null",
  "contactInfo": "phone/email if mentioned or null",
  "caseReference": "any case number mentioned or null"
}

${context?.additionalInstructions || ""}`;

  try {
    const result = await model.generateContent([prompt, audioData]);
    const text = result.response.text();
    const clean = text.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Audio processing error:", err.message);
    return {
      transcript: null,
      error: err.message,
      speakers: [],
      summary: "Audio processing failed — manual review needed",
      keyPoints: [],
      sentiment: "neutral",
      urgency: "normal",
      actionItems: [],
      topics: [],
      constituentName: null,
      contactInfo: null,
      caseReference: null,
    };
  }
}

// ============================================================
// IMAGE PROCESSING
// Handles scanned paper cases, handwritten letters, forms
// ============================================================
async function processImage(imageBuffer, mimeType, context) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const imageData = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType: mimeType || "image/jpeg",
    },
  };

  const prompt = `You are an AI assistant for a U.S. Congressional office.
This image is a ${context?.type || "scanned document or paper case"}.

Analyze the image and extract all relevant information. Return ONLY valid JSON:
{
  "documentType": "letter | form | handwritten_note | printed_document | photo | other",
  "extractedText": "all text found in the image",
  "sender": {
    "name": "sender name or null",
    "address": "address or null",
    "phone": "phone or null",
    "email": "email or null"
  },
  "subject": "main subject/topic",
  "summary": "2-3 sentence summary of contents",
  "topics": ["relevant topic tags"],
  "sentiment": "positive | neutral | negative",
  "urgency": "low | normal | high | critical",
  "dateOnDocument": "any date found or null",
  "caseReference": "any case/reference numbers or null",
  "agency": "relevant agency or null",
  "actionNeeded": "what needs to happen based on this document",
  "handwritingDetected": true/false,
  "confidence": 0.0-1.0
}

${context?.additionalInstructions || ""}`;

  try {
    const result = await model.generateContent([prompt, imageData]);
    const text = result.response.text();
    const clean = text.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Image processing error:", err.message);
    return {
      documentType: "other",
      extractedText: null,
      error: err.message,
      sender: { name: null, address: null, phone: null, email: null },
      subject: "Unknown — processing failed",
      summary: "Image processing failed — manual review needed",
      topics: [],
      sentiment: "neutral",
      urgency: "normal",
      dateOnDocument: null,
      caseReference: null,
      agency: null,
      actionNeeded: "Manual review required",
      handwritingDetected: false,
      confidence: 0,
    };
  }
}

// ============================================================
// DOCUMENT/PDF PROCESSING
// For PDF uploads — pass as image pages or extracted text
// ============================================================
async function processDocument(documentBuffer, mimeType, context) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const docData = {
    inlineData: {
      data: documentBuffer.toString("base64"),
      mimeType: mimeType || "application/pdf",
    },
  };

  const prompt = `You are an AI assistant for a U.S. Congressional office.
This is a ${context?.type || "document"} that needs to be analyzed and ingested.

Extract all relevant information. Return ONLY valid JSON:
{
  "documentType": "constituent_letter | government_form | agency_response | legal_document | report | other",
  "title": "document title if found",
  "extractedText": "key text content (summarized if very long)",
  "pages": "number of pages if detectable",
  "sender": {
    "name": "name or null",
    "organization": "org or null",
    "address": "address or null"
  },
  "recipient": "who this is addressed to or null",
  "subject": "main subject",
  "summary": "3-4 sentence summary",
  "topics": ["topic tags"],
  "sentiment": "positive | neutral | negative",
  "urgency": "low | normal | high | critical",
  "dates": ["important dates mentioned"],
  "caseReferences": ["any case/reference numbers"],
  "agencies": ["agencies mentioned"],
  "actionItems": ["actions needed based on document"],
  "keyFigures": ["dollar amounts, statistics, deadlines mentioned"]
}

${context?.additionalInstructions || ""}`;

  try {
    const result = await model.generateContent([prompt, docData]);
    const text = result.response.text();
    const clean = text.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Document processing error:", err.message);
    return {
      documentType: "other",
      error: err.message,
      summary: "Document processing failed — manual review needed",
      topics: [],
      sentiment: "neutral",
      urgency: "normal",
    };
  }
}

// ============================================================
// UNIFIED MULTIMODAL INGEST
// Auto-detects type and routes to the right processor
// ============================================================
async function processMultimodal(buffer, mimeType, context) {
  if (mimeType.startsWith("audio/")) {
    return { type: "audio", result: await processAudio(buffer, mimeType, context) };
  } else if (mimeType.startsWith("image/")) {
    return { type: "image", result: await processImage(buffer, mimeType, context) };
  } else if (mimeType === "application/pdf") {
    return { type: "document", result: await processDocument(buffer, mimeType, context) };
  } else {
    return { type: "unknown", error: `Unsupported mime type: ${mimeType}` };
  }
}

module.exports = {
  processAudio,
  processImage,
  processDocument,
  processMultimodal,
};
