const mongoose = require("mongoose");

const employeeProfileSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },

    // Expertise areas with proficiency levels
    expertise: [
      {
        topic: String,
        proficiency: {
          type: String,
          enum: ["basic", "intermediate", "expert"],
          default: "intermediate",
        },
        casesHandled: { type: Number, default: 0 },
        avgResolutionDays: { type: Number, default: null },
        successRate: { type: Number, default: null },
      },
    ],

    // Agencies they have contacts/experience with
    agencyExperience: [
      {
        agency: String,
        contactName: String,
        casesHandled: { type: Number, default: 0 },
      },
    ],

    // Availability
    availability: {
      status: {
        type: String,
        enum: ["available", "busy", "out_of_office", "in_meeting"],
        default: "available",
      },
      currentCaseload: { type: Number, default: 0 },
      maxCaseload: { type: Number, default: 15 },
      outOfOfficeUntil: Date,
      schedule: {
        monday: { start: String, end: String },
        tuesday: { start: String, end: String },
        wednesday: { start: String, end: String },
        thursday: { start: String, end: String },
        friday: { start: String, end: String },
      },
    },

    // Meeting attendance tracking
    meetingsAttended: [
      {
        meetingId: String,
        caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case" },
        date: Date,
        topic: String,
        role: String,
      },
    ],

    // Performance metrics
    metrics: {
      totalCasesResolved: { type: Number, default: 0 },
      avgResolutionDays: { type: Number, default: 0 },
      avgSatisfactionScore: { type: Number, default: null },
      onTimeRate: { type: Number, default: 100 },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: is available to take new cases
employeeProfileSchema.virtual("canTakeNewCases").get(function () {
  if (this.availability.status === "out_of_office") return false;
  return this.availability.currentCaseload < this.availability.maxCaseload;
});

employeeProfileSchema.set("toJSON", { virtuals: true });
employeeProfileSchema.set("toObject", { virtuals: true });

employeeProfileSchema.index({ "expertise.topic": 1 });
employeeProfileSchema.index({ "agencyExperience.agency": 1 });
employeeProfileSchema.index({ "availability.status": 1, "availability.currentCaseload": 1 });

module.exports = mongoose.model("EmployeeProfile", employeeProfileSchema);
