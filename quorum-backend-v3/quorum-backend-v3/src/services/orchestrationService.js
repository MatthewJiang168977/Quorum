const { GoogleGenerativeAI } = require("@google/generative-ai");
const EmployeeProfile = require("../models/EmployeeProfile");
const Notification = require("../models/Notification");
const Staff = require("../models/Staff");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ============================================================
// AGENT 1: Severity Scoring
// Scores case based on problem severity, urgency, and who filed
// ============================================================
async function scoreCaseSeverity(caseData, message) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a case severity scoring agent for a U.S. Congressional office. 
Score this constituent case on multiple dimensions. Return ONLY valid JSON.

Case Details:
- Subject: ${caseData.subject}
- Agency: ${caseData.agency}
- Constituent: ${message.from?.name || "Unknown"}
- Message: ${message.body}
- Channel: ${message.channel}
- Existing AI Tags: ${JSON.stringify(message.aiTags)}

Score each dimension 1-10 and provide reasoning:

{
  "severityScore": 1-10,
  "urgencyScore": 1-10,
  "impactScore": 1-10,
  "complexityScore": 1-10,
  "overallPriority": 1-10,
  "filerProfile": {
    "type": "individual | organization | government_official | veteran | senior | minor",
    "vulnerabilityFactors": ["list of relevant factors like financial_hardship, health_risk, etc"],
    "influenceLevel": "low | medium | high"
  },
  "reasoning": "2-3 sentence explanation of the scoring",
  "recommendedSLA": "number of days for resolution target",
  "escalationNeeded": true/false,
  "escalationReason": "reason or null"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Severity scoring error:", err.message);
    return {
      severityScore: 5,
      urgencyScore: 5,
      impactScore: 5,
      complexityScore: 5,
      overallPriority: 5,
      filerProfile: { type: "individual", vulnerabilityFactors: [], influenceLevel: "low" },
      reasoning: "Auto-scored due to AI processing error",
      recommendedSLA: 14,
      escalationNeeded: false,
      escalationReason: null,
    };
  }
}

// ============================================================
// AGENT 2: Meeting Notes Processor
// Transcribes and extracts key points from meeting notes/audio
// ============================================================
async function processMeetingNotes(notesInput) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // notesInput can be { text: "..." } or { audioTranscript: "..." }
  const content = notesInput.text || notesInput.audioTranscript || "";

  const prompt = `You are a meeting notes analyst for a Congressional office. 
Analyze these meeting notes and extract structured information. Return ONLY valid JSON.

Meeting Notes:
${content}

Context (if available):
- Case subject: ${notesInput.caseSubject || "N/A"}
- Attendees: ${notesInput.attendees?.join(", ") || "N/A"}

{
  "summary": "2-3 sentence summary of the meeting",
  "keyDecisions": ["list of decisions made"],
  "actionItems": [
    {
      "task": "description",
      "assignedTo": "person name or null",
      "deadline": "suggested deadline or null",
      "priority": "low | normal | high | critical"
    }
  ],
  "keyPoints": ["main discussion points"],
  "attendeesIdentified": ["names of people who participated"],
  "followUpNeeded": true/false,
  "followUpDetails": "what needs to happen next",
  "sentimentOfDiscussion": "positive | neutral | negative | mixed",
  "risksIdentified": ["any risks or concerns raised"],
  "nextMeetingNeeded": true/false
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Meeting notes processing error:", err.message);
    return {
      summary: "Processing failed — manual review needed",
      keyDecisions: [],
      actionItems: [],
      keyPoints: [],
      attendeesIdentified: [],
      followUpNeeded: true,
      followUpDetails: "AI processing failed, please review notes manually",
      sentimentOfDiscussion: "neutral",
      risksIdentified: [],
      nextMeetingNeeded: false,
    };
  }
}

// ============================================================
// AGENT 3: Employee Matcher
// Finds the best employee based on expertise, meetings, availability
// ============================================================
async function matchEmployee(caseData, severityResult, meetingResult) {
  // Step 1: Get all available employee profiles
  const profiles = await EmployeeProfile.find({
    "availability.status": { $ne: "out_of_office" },
  })
    .populate("staffId", "name role")
    .lean();

  if (profiles.length === 0) {
    return {
      selectedEmployee: null,
      reasoning: "No available employees found",
      alternatives: [],
    };
  }

  // Step 2: Score each employee
  const scoredEmployees = profiles.map((profile) => {
    let score = 0;
    const reasons = [];

    // Expertise match (0-40 points)
    const topics = caseData.aiTags?.topics || [];
    const agency = caseData.agency;

    for (const topic of topics) {
      const exp = profile.expertise.find(
        (e) => e.topic.toLowerCase() === topic.toLowerCase()
      );
      if (exp) {
        const profPoints = { basic: 10, intermediate: 20, expert: 40 };
        score += profPoints[exp.proficiency] || 10;
        reasons.push(`${exp.proficiency} in ${topic}`);
      }
    }

    // Agency experience (0-25 points)
    const agencyExp = profile.agencyExperience.find(
      (a) => a.agency === agency
    );
    if (agencyExp) {
      score += Math.min(25, agencyExp.casesHandled * 5);
      reasons.push(`${agencyExp.casesHandled} cases with ${agency}`);
    }

    // Meeting attendance (0-20 points)
    if (meetingResult && meetingResult.attendeesIdentified) {
      const attended = meetingResult.attendeesIdentified.some(
        (name) =>
          profile.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(profile.name.split(" ")[0].toLowerCase())
      );
      if (attended) {
        score += 20;
        reasons.push("attended related meeting");
      }
    }

    // Availability (0-15 points)
    const loadRatio =
      profile.availability.currentCaseload / profile.availability.maxCaseload;
    if (loadRatio < 0.5) {
      score += 15;
      reasons.push("low caseload");
    } else if (loadRatio < 0.75) {
      score += 10;
      reasons.push("moderate caseload");
    } else if (loadRatio < 1) {
      score += 5;
      reasons.push("high caseload");
    } else {
      score -= 10;
      reasons.push("at max caseload");
    }

    // Performance bonus (0-10 points)
    if (profile.metrics.onTimeRate >= 90) {
      score += 5;
      reasons.push(`${profile.metrics.onTimeRate}% on-time rate`);
    }
    if (profile.metrics.avgSatisfactionScore >= 4) {
      score += 5;
      reasons.push(`${profile.metrics.avgSatisfactionScore}/5 satisfaction`);
    }

    return {
      employeeId: profile.staffId?._id || profile._id,
      name: profile.name,
      role: profile.role,
      score,
      reasons,
      caseload: `${profile.availability.currentCaseload}/${profile.availability.maxCaseload}`,
      status: profile.availability.status,
    };
  });

  // Step 3: Sort by score and pick top candidates
  scoredEmployees.sort((a, b) => b.score - a.score);

  // Step 4: Use Gemini to generate natural language reasoning
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const top3 = scoredEmployees.slice(0, 3);

  const prompt = `You are a task assignment advisor for a Congressional office. 
Based on the scoring below, write a concise recommendation (3-4 sentences) explaining why the top candidate is the best fit. Return ONLY the plain text recommendation, no JSON.

Case: ${caseData.subject}
Agency: ${caseData.agency}
Severity: ${severityResult?.overallPriority || "N/A"}/10

Top candidates:
${top3
  .map(
    (e, i) =>
      `${i + 1}. ${e.name} (score: ${e.score}) — ${e.reasons.join(", ")}. Caseload: ${e.caseload}`
  )
  .join("\n")}`;

  let reasoning;
  try {
    const result = await model.generateContent(prompt);
    reasoning = result.response.text().trim();
  } catch (err) {
    reasoning = `${top3[0]?.name} is recommended based on expertise match and availability. Score: ${top3[0]?.score}.`;
  }

  return {
    selectedEmployee: top3[0] || null,
    reasoning,
    alternatives: top3.slice(1),
    allScores: scoredEmployees,
  };
}

// ============================================================
// ORCHESTRATOR: Runs all 3 agents in parallel and combines results
// ============================================================
async function orchestrateCaseProcessing(caseDoc, message, meetingNotes) {
  const startTime = Date.now();

  // Run agents in parallel
  const [severityResult, meetingResult] = await Promise.all([
    // Agent 1: Severity scoring (always runs)
    scoreCaseSeverity(
      { subject: caseDoc.subject, agency: caseDoc.agency },
      message
    ),

    // Agent 2: Meeting notes (runs if notes provided)
    meetingNotes
      ? processMeetingNotes({
          text: meetingNotes.text,
          audioTranscript: meetingNotes.audioTranscript,
          caseSubject: caseDoc.subject,
          attendees: meetingNotes.attendees,
        })
      : Promise.resolve(null),
  ]);

  // Agent 3: Employee matching (runs after 1 & 2, uses their results)
  const employeeResult = await matchEmployee(
    {
      subject: caseDoc.subject,
      agency: caseDoc.agency,
      aiTags: message.aiTags,
    },
    severityResult,
    meetingResult
  );

  const processingTime = Date.now() - startTime;

  // Combine into orchestration result
  const orchestrationResult = {
    caseId: caseDoc._id,
    processedAt: new Date(),
    processingTimeMs: processingTime,

    severity: severityResult,

    meetingAnalysis: meetingResult,

    employeeSuggestion: {
      recommended: employeeResult.selectedEmployee,
      reasoning: employeeResult.reasoning,
      alternatives: employeeResult.alternatives,
    },
  };

  return orchestrationResult;
}

// ============================================================
// NOTIFICATION: Send updates to team lead and team
// ============================================================
async function notifyTeam(caseDoc, orchestrationResult) {
  const notifications = [];

  // Find team lead (chief of staff)
  const teamLead = await Staff.findOne({ role: "chief_of_staff" });

  // Find all relevant staff
  const allStaff = await Staff.find({ isActive: true });

  // Notify team lead with full details
  if (teamLead) {
    notifications.push(
      new Notification({
        recipient: teamLead._id,
        type: "employee_suggestion",
        caseId: caseDoc._id,
        title: `New case assignment: ${caseDoc.subject}`,
        body: `AI recommends ${orchestrationResult.employeeSuggestion.recommended?.name || "manual assignment"}. Priority: ${orchestrationResult.severity.overallPriority}/10. ${orchestrationResult.employeeSuggestion.reasoning}`,
        metadata: {
          severity: orchestrationResult.severity,
          suggestion: orchestrationResult.employeeSuggestion,
        },
      })
    );
  }

  // Notify the suggested employee
  if (orchestrationResult.employeeSuggestion.recommended?.employeeId) {
    notifications.push(
      new Notification({
        recipient: orchestrationResult.employeeSuggestion.recommended.employeeId,
        type: "case_assigned",
        caseId: caseDoc._id,
        title: `You've been suggested for: ${caseDoc.subject}`,
        body: `A new ${caseDoc.agency} case (priority ${orchestrationResult.severity.overallPriority}/10) has been suggested for you based on your expertise. Pending team lead approval.`,
        metadata: {
          severity: orchestrationResult.severity,
          reasoning: orchestrationResult.employeeSuggestion.reasoning,
        },
      })
    );
  }

  // Notify rest of team with summary
  const notifiedIds = [
    teamLead?._id?.toString(),
    orchestrationResult.employeeSuggestion.recommended?.employeeId?.toString(),
  ].filter(Boolean);

  for (const staff of allStaff) {
    if (!notifiedIds.includes(staff._id.toString())) {
      notifications.push(
        new Notification({
          recipient: staff._id,
          type: "case_update",
          caseId: caseDoc._id,
          title: `New case: ${caseDoc.subject}`,
          body: `Priority ${orchestrationResult.severity.overallPriority}/10 | Agency: ${caseDoc.agency} | Suggested assignee: ${orchestrationResult.employeeSuggestion.recommended?.name || "TBD"}`,
        })
      );
    }
  }

  // Escalation notification if needed
  if (orchestrationResult.severity.escalationNeeded && teamLead) {
    notifications.push(
      new Notification({
        recipient: teamLead._id,
        type: "escalation",
        caseId: caseDoc._id,
        title: `ESCALATION: ${caseDoc.subject}`,
        body: `This case requires immediate attention. Reason: ${orchestrationResult.severity.escalationReason}`,
        metadata: { severity: orchestrationResult.severity },
      })
    );
  }

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  return notifications.length;
}

module.exports = {
  scoreCaseSeverity,
  processMeetingNotes,
  matchEmployee,
  orchestrateCaseProcessing,
  notifyTeam,
};
