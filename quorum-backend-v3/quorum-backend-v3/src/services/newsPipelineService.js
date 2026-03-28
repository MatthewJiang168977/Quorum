const { GoogleGenerativeAI } = require("@google/generative-ai");
const Trend = require("../models/Trend");
const Message = require("../models/Message");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ============================================================
// NEWS ANALYSIS
// Takes news articles and extracts sentiment + relevance to district
// ============================================================
async function analyzeNewsArticle(article) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a political analyst for a U.S. Congressional office in Illinois (District IL-13, Springfield area).

Analyze this news article for constituent impact. Return ONLY valid JSON:
{
  "headline": "article headline",
  "source": "source name",
  "relevanceScore": 0.0-1.0,
  "relevanceReason": "why this matters to the district",
  "topics": ["matching topic tags: healthcare, immigration, infrastructure, education, veterans, tax, social_security, data_privacy, agriculture, broadband, disaster_relief, small_business, legislation, public_safety, other"],
  "sentiment": "positive | neutral | negative",
  "sentimentScore": -1.0 to 1.0,
  "impactLevel": "none | low | medium | high | critical",
  "predictedConstituentResponse": "how constituents might react",
  "suggestedAction": "what the office should do",
  "talkingPoints": ["2-3 talking points for the representative"],
  "urgency": "low | normal | high | critical"
}

Article:
Title: ${article.title}
Source: ${article.source || "Unknown"}
Published: ${article.publishedAt || "Unknown"}
Content: ${article.content || article.description || "No content available"}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("News analysis error:", err.message);
    return {
      headline: article.title,
      error: err.message,
      relevanceScore: 0,
      topics: [],
      sentiment: "neutral",
      impactLevel: "none",
    };
  }
}

// ============================================================
// BATCH NEWS ANALYSIS
// Analyze multiple articles and detect trends
// ============================================================
async function analyzeNewsBatch(articles) {
  // Analyze each article
  const analyses = await Promise.all(
    articles.map((article) => analyzeNewsArticle(article))
  );

  // Filter to relevant articles
  const relevant = analyses.filter((a) => a.relevanceScore > 0.3);

  // Aggregate topics
  const topicCounts = {};
  relevant.forEach((a) => {
    (a.topics || []).forEach((t) => {
      topicCounts[t] = (topicCounts[t] || 0) + 1;
    });
  });

  // Aggregate sentiment
  const avgSentiment =
    relevant.length > 0
      ? relevant.reduce((sum, a) => sum + (a.sentimentScore || 0), 0) / relevant.length
      : 0;

  // Detect spikes
  const spikes = Object.entries(topicCounts)
    .filter(([_, count]) => count >= 3)
    .map(([topic, count]) => ({
      topic,
      count,
      note: `${count} news articles about ${topic} in this batch`,
    }));

  return {
    totalArticles: articles.length,
    relevantArticles: relevant.length,
    analyses: relevant,
    topicDistribution: topicCounts,
    avgSentiment: Math.round(avgSentiment * 100) / 100,
    spikes,
    highImpact: relevant.filter((a) => a.impactLevel === "high" || a.impactLevel === "critical"),
  };
}

// ============================================================
// SENTIMENT PARAMETER UPDATE
// Updates trend data based on news + message sentiment
// ============================================================
async function updateSentimentParams(newsAnalysis) {
  try {
    const latestTrend = await Trend.findOne().sort({ periodEnd: -1 });
    if (!latestTrend) return null;

    // Check for new anomalies from news
    const newAnomalies = [];

    for (const spike of newsAnalysis.spikes || []) {
      newAnomalies.push({
        type: "spike",
        topic: spike.topic,
        detectedAt: new Date(),
        description: `News spike: ${spike.note}. Constituent message volume may increase.`,
        severity: spike.count >= 5 ? "high" : "medium",
        acknowledged: false,
      });
    }

    for (const item of newsAnalysis.highImpact || []) {
      newAnomalies.push({
        type: "sentiment_shift",
        topic: item.topics?.[0] || "general",
        detectedAt: new Date(),
        description: `High-impact news: "${item.headline}". ${item.predictedConstituentResponse || ""}`,
        severity: item.urgency === "critical" ? "critical" : "high",
        acknowledged: false,
      });
    }

    if (newAnomalies.length > 0) {
      await Trend.findByIdAndUpdate(latestTrend._id, {
        $push: { anomalies: { $each: newAnomalies } },
      });
    }

    return {
      anomaliesAdded: newAnomalies.length,
      anomalies: newAnomalies,
    };
  } catch (err) {
    console.error("Sentiment params update error:", err.message);
    return { error: err.message };
  }
}

// ============================================================
// CONSTITUENT IMPACT PREDICTOR
// Given news, predict which constituents will reach out
// ============================================================
async function predictConstituentImpact(newsAnalysis) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const topArticles = (newsAnalysis.analyses || [])
    .slice(0, 5)
    .map((a) => `- ${a.headline} (${a.topics?.join(", ")}, sentiment: ${a.sentiment})`)
    .join("\n");

  const prompt = `You are a predictive analyst for a Congressional office. Based on today's news, predict constituent response. Return ONLY valid JSON.

Relevant news:
${topArticles}

{
  "expectedVolumeIncrease": "percentage estimate like 20%",
  "topPredictedTopics": ["topics likely to spike in constituent messages"],
  "predictedSentiment": "how constituent messages will skew",
  "preparedResponses": [
    {
      "topic": "topic name",
      "suggestedTalkingPoint": "what the office should say",
      "expectedVolume": "low | medium | high"
    }
  ],
  "proactiveActions": ["things the office should do before messages arrive"],
  "timeframe": "when to expect the surge (hours/days)"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Impact prediction error:", err.message);
    return { error: err.message };
  }
}

module.exports = {
  analyzeNewsArticle,
  analyzeNewsBatch,
  updateSentimentParams,
  predictConstituentImpact,
};
