require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Message = require("./models/Message");
const Staff = require("./models/Staff");
const Case = require("./models/Case");
const Trend = require("./models/Trend");

const messagesData = require("../data/messages.json");
const staffData = require("../data/staff.json");
const casesData = require("../data/cases.json");
const trendsData = require("../data/trends.json");

async function seed() {
  await connectDB();

  console.log("Clearing existing data...");
  await Promise.all([
    Message.deleteMany({}),
    Staff.deleteMany({}),
    Case.deleteMany({}),
    Trend.deleteMany({}),
  ]);

  // 1. Seed staff
  console.log("Seeding staff...");
  const staffDocs = await Staff.insertMany(
    staffData.map((s) => ({
      name: s.name,
      email: s.email,
      role: s.role,
      permissions: s.permissions,
      dashboardModules: s.dashboard_modules,
    }))
  );
  const staffMap = {};
  staffDocs.forEach((s) => (staffMap[s.role] = s._id));
  console.log(`  Inserted ${staffDocs.length} staff members`);

  // 2. Seed messages
  console.log("Seeding messages...");
  const messageDocs = await Message.insertMany(
    messagesData.map((m) => ({
      type: m.type,
      channel: m.channel,
      from: m.from,
      subject: m.subject,
      body: m.body,
      receivedAt: new Date(m.received_at),
      aiTags: {
        topics: m.ai_tags.topics,
        urgency: m.ai_tags.urgency,
        sentiment: m.ai_tags.sentiment,
        sentimentScore: m.ai_tags.sentiment_score,
        intent: m.ai_tags.intent,
        agency: m.ai_tags.agency,
        caseReference: m.ai_tags.case_reference,
        requiresResponse: m.ai_tags.requires_response,
        suggestedRoute: m.ai_tags.suggested_route,
        flags: m.ai_tags.flags || [],
        event: m.ai_tags.event
          ? {
              date: m.ai_tags.event.date ? new Date(m.ai_tags.event.date) : undefined,
              time: m.ai_tags.event.time,
              location: m.ai_tags.event.location,
              rsvpDeadline: m.ai_tags.event.rsvp_deadline
                ? new Date(m.ai_tags.event.rsvp_deadline)
                : undefined,
              expectedAttendance: m.ai_tags.event.expected_attendance,
            }
          : undefined,
      },
      aiDraft: m.ai_draft
        ? {
            body: m.ai_draft.body,
            confidence: m.ai_draft.confidence,
            status: m.ai_draft.status,
          }
        : undefined,
      workflowStatus: m.workflow_status,
      read: m.read,
    }))
  );

  // Build a lookup from original message id to MongoDB _id
  const msgIdMap = {};
  messagesData.forEach((m, i) => (msgIdMap[m.id] = messageDocs[i]._id));
  console.log(`  Inserted ${messageDocs.length} messages`);

  // 3. Seed cases
  console.log("Seeding cases...");
  const caseDocs = await Case.insertMany(
    casesData.map((c) => ({
      messageId: msgIdMap[c.message_id],
      constituent: c.constituent,
      subject: c.subject,
      agency: c.agency,
      agencyReference: c.agency_reference,
      status: c.status,
      priority: c.priority,
      assignedTo: staffMap["caseworker"],
      openedAt: new Date(c.opened_at),
      deadline: new Date(c.deadline),
      slaDays: c.sla_days,
      daysOpen: c.days_open,
      lastActivity: new Date(c.last_activity),
      notes: c.notes.map((n) => ({
        author: n.author,
        text: n.text,
        timestamp: new Date(n.timestamp),
      })),
      nextSteps: c.next_steps,
      flags: c.flags || [],
    }))
  );
  console.log(`  Inserted ${caseDocs.length} cases`);

  // 4. Link cases back to messages
  for (const c of casesData) {
    const caseDoc = caseDocs.find((cd) => cd.constituent === c.constituent);
    if (caseDoc && msgIdMap[c.message_id]) {
      await Message.findByIdAndUpdate(msgIdMap[c.message_id], {
        caseId: caseDoc._id,
      });
    }
  }

  // 5. Seed trends
  console.log("Seeding trends...");
  await Trend.create({
    district: trendsData.district,
    periodStart: new Date(trendsData.period.split(" to ")[0]),
    periodEnd: new Date(trendsData.period.split(" to ")[1]),
    totalMessages: trendsData.total_messages,
    totalCasesOpened: trendsData.total_cases_opened,
    totalCasesResolved: trendsData.total_cases_resolved,
    avgResponseTimeHours: trendsData.avg_response_time_hours,
    topicDistribution: trendsData.topic_distribution.map((t) => ({
      topic: t.topic,
      count: t.count,
      pct: t.pct,
      trend: t.trend,
      changePct: t.change_pct,
    })),
    sentimentByWeek: trendsData.sentiment_by_week.map((s) => ({
      week: new Date(s.week),
      positive: s.positive,
      neutral: s.neutral,
      negative: s.negative,
    })),
    anomalies: trendsData.anomalies.map((a) => ({
      type: a.type,
      topic: a.topic,
      detectedAt: new Date(a.detected_at),
      description: a.description,
      severity: a.severity,
    })),
    geographicHotspots: trendsData.geographic_hotspots.map((g) => ({
      zip: g.zip,
      count: g.count,
      topTopic: g.top_topic,
      sentimentAvg: g.sentiment_avg,
    })),
    dailyVolume: trendsData.daily_volume.map((d) => ({
      date: new Date(d.date),
      count: d.count,
    })),
  });
  console.log("  Inserted trend data");

  console.log("\nSeed complete!");
  console.log(`  ${staffDocs.length} staff`);
  console.log(`  ${messageDocs.length} messages`);
  console.log(`  ${caseDocs.length} cases`);
  console.log(`  1 trend snapshot`);

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
