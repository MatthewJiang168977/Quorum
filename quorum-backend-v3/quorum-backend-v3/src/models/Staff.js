const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: [
        "chief_of_staff",
        "legislative_correspondent",
        "caseworker",
        "scheduler",
        "communications_director",
      ],
      required: true,
    },
    permissions: [
      {
        type: String,
        enum: [
          "view_all",
          "view_assigned",
          "view_casework",
          "view_calendar",
          "view_social",
          "view_trends",
          "view_security_flags",
          "approve_drafts",
          "approve_batches",
          "approve_social_drafts",
          "edit_drafts",
          "send_approved",
          "manage_staff",
          "manage_contacts",
          "manage_events",
          "manage_press",
          "create_cases",
          "update_cases",
          "contact_agencies",
          "view_deadlines",
          "view_batches",
          "view_sentiment",
          "send_invites",
          "view_meeting_requests",
        ],
      },
    ],
    dashboardModules: [String],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Staff", staffSchema);
