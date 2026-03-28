const Message = require("../models/Message");
const { processAudio, processImage, processDocument, processMultimodal } = require("../services/multimodalService");
const { analyzeNewsBatch, updateSentimentParams, predictConstituentImpact } = require("../services/newsPipelineService");
const { triageMessage, generateDraft } = require("../services/geminiService");

// POST /api/ingest/audio
// Upload audio file → transcribe → create message → triage
exports.ingestAudio = async (req, res) => {
  try {
    const { audioBase64, mimeType, context } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "audioBase64 is required" });
    }

    const buffer = Buffer.from(audioBase64, "base64");

    // Step 1: Process audio with Gemini
    const audioResult = await processAudio(buffer, mimeType || "audio/mp3", context);

    if (!audioResult.transcript) {
      return res.status(422).json({ error: "Could not transcribe audio", details: audioResult });
    }

    // Step 2: Create a message from the transcription
    const messageData = {
      type: "voicemail",
      channel: "phone",
      from: {
        name: audioResult.constituentName || "Unknown Caller",
        phone: audioResult.contactInfo || null,
      },
      subject: `[Voicemail Transcription] ${audioResult.summary?.slice(0, 60) || "Audio message"}`,
      body: `[AI Transcription - Gemini 2.0]\n\n${audioResult.transcript}`,
    };

    // Step 3: AI triage
    const aiTags = await triageMessage(messageData);
    // Override with audio-specific data
    aiTags.topics = [...new Set([...aiTags.topics, ...(audioResult.topics || [])])];
    if (audioResult.urgency !== "normal") aiTags.urgency = audioResult.urgency;
    if (audioResult.caseReference) aiTags.caseReference = audioResult.caseReference;

    // Step 4: Generate draft response
    const draft = aiTags.flags?.includes("possible_threat")
      ? null
      : await generateDraft(messageData, aiTags);

    // Step 5: Save message
    const message = new Message({
      ...messageData,
      aiTags,
      aiDraft: draft || undefined,
      workflowStatus: aiTags.flags?.includes("possible_threat") ? "flagged" : "new",
    });
    await message.save();

    res.status(201).json({
      message,
      audioAnalysis: audioResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ingest/image
// Upload image of paper case → OCR → create message → triage
exports.ingestImage = async (req, res) => {
  try {
    const { imageBase64, mimeType, context } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    const buffer = Buffer.from(imageBase64, "base64");

    // Step 1: Process image with Gemini
    const imageResult = await processImage(buffer, mimeType || "image/jpeg", context);

    if (!imageResult.extractedText) {
      return res.status(422).json({ error: "Could not extract text from image", details: imageResult });
    }

    // Step 2: Create a message
    const messageData = {
      type: "form_submission",
      channel: "web_form",
      from: {
        name: imageResult.sender?.name || "Unknown",
        email: imageResult.sender?.email || null,
        phone: imageResult.sender?.phone || null,
        address: imageResult.sender?.address || null,
      },
      subject: `[Scanned ${imageResult.documentType}] ${imageResult.subject || "Paper case"}`,
      body: `[AI OCR - Gemini 2.0 | Confidence: ${Math.round((imageResult.confidence || 0) * 100)}%]\n\n${imageResult.extractedText}`,
    };

    // Step 3: AI triage
    const aiTags = await triageMessage(messageData);
    aiTags.topics = [...new Set([...aiTags.topics, ...(imageResult.topics || [])])];
    if (imageResult.urgency !== "normal") aiTags.urgency = imageResult.urgency;
    if (imageResult.caseReference) aiTags.caseReference = imageResult.caseReference;
    if (imageResult.agency) aiTags.agency = imageResult.agency;

    // Step 4: Generate draft
    const draft = await generateDraft(messageData, aiTags);

    // Step 5: Save
    const message = new Message({
      ...messageData,
      aiTags,
      aiDraft: draft || undefined,
    });
    await message.save();

    res.status(201).json({
      message,
      imageAnalysis: imageResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ingest/document
// Upload PDF/document → extract → create message → triage
exports.ingestDocument = async (req, res) => {
  try {
    const { documentBase64, mimeType, context } = req.body;

    if (!documentBase64) {
      return res.status(400).json({ error: "documentBase64 is required" });
    }

    const buffer = Buffer.from(documentBase64, "base64");

    // Step 1: Process document
    const docResult = await processDocument(buffer, mimeType || "application/pdf", context);

    // Step 2: Create message
    const messageData = {
      type: "form_submission",
      channel: "web_form",
      from: {
        name: docResult.sender?.name || "Unknown",
        address: docResult.sender?.address || null,
      },
      subject: `[${docResult.documentType}] ${docResult.title || docResult.subject || "Document"}`,
      body: `[AI Document Analysis - Gemini 2.0]\n\nSummary: ${docResult.summary}\n\n${docResult.extractedText || ""}`,
    };

    // Step 3: Triage
    const aiTags = await triageMessage(messageData);
    aiTags.topics = [...new Set([...aiTags.topics, ...(docResult.topics || [])])];
    if (docResult.urgency !== "normal") aiTags.urgency = docResult.urgency;
    if (docResult.caseReferences?.length) aiTags.caseReference = docResult.caseReferences[0];
    if (docResult.agencies?.length) aiTags.agency = docResult.agencies[0];

    // Step 4: Draft
    const draft = await generateDraft(messageData, aiTags);

    // Step 5: Save
    const message = new Message({
      ...messageData,
      aiTags,
      aiDraft: draft || undefined,
    });
    await message.save();

    res.status(201).json({
      message,
      documentAnalysis: docResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ingest/news
// Feed news articles → analyze → update sentiment params → predict impact
exports.ingestNews = async (req, res) => {
  try {
    const { articles } = req.body;

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({
        error: "articles array is required",
        example: {
          articles: [
            {
              title: "Medicare Advantage Plans Face Major Changes",
              source: "AP News",
              publishedAt: "2026-03-27",
              content: "Full article text here...",
            },
          ],
        },
      });
    }

    // Step 1: Analyze all articles
    const batchAnalysis = await analyzeNewsBatch(articles);

    // Step 2: Update trend anomalies
    const paramUpdate = await updateSentimentParams(batchAnalysis);

    // Step 3: Predict constituent impact
    const impactPrediction = await predictConstituentImpact(batchAnalysis);

    res.json({
      analysis: batchAnalysis,
      trendUpdates: paramUpdate,
      prediction: impactPrediction,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = exports;
