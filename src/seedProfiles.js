require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Staff = require("./models/Staff");
const EmployeeProfile = require("./models/EmployeeProfile");

async function seedProfiles() {
  await connectDB();

  console.log("Clearing employee profiles...");
  await EmployeeProfile.deleteMany({});

  const staff = await Staff.find({});
  const staffByRole = {};
  staff.forEach((s) => (staffByRole[s.role] = s));

  const profiles = [
    {
      staffId: staffByRole["caseworker"]?._id,
      name: "Maria Santos",
      email: "msantos@house.gov",
      role: "caseworker",
      expertise: [
        { topic: "immigration", proficiency: "expert", casesHandled: 47, avgResolutionDays: 8.2, successRate: 91 },
        { topic: "veterans", proficiency: "expert", casesHandled: 38, avgResolutionDays: 6.5, successRate: 94 },
        { topic: "social_security", proficiency: "intermediate", casesHandled: 22, avgResolutionDays: 11.3, successRate: 86 },
        { topic: "healthcare", proficiency: "intermediate", casesHandled: 19, avgResolutionDays: 9.7, successRate: 88 },
        { topic: "tax", proficiency: "basic", casesHandled: 8, avgResolutionDays: 14.1, successRate: 75 },
      ],
      agencyExperience: [
        { agency: "USCIS", contactName: "Patricia Reeves", casesHandled: 47 },
        { agency: "VA", contactName: "Col. Marcus Webb", casesHandled: 38 },
        { agency: "SSA", contactName: "David Chen", casesHandled: 22 },
        { agency: "CMS", contactName: "Linda Park", casesHandled: 15 },
      ],
      availability: {
        status: "available",
        currentCaseload: 6,
        maxCaseload: 15,
        schedule: {
          monday: { start: "08:00", end: "17:00" },
          tuesday: { start: "08:00", end: "17:00" },
          wednesday: { start: "08:00", end: "17:00" },
          thursday: { start: "08:00", end: "17:00" },
          friday: { start: "08:00", end: "15:00" },
        },
      },
      metrics: {
        totalCasesResolved: 134,
        avgResolutionDays: 8.9,
        avgSatisfactionScore: 4.6,
        onTimeRate: 93,
      },
    },
    {
      staffId: staffByRole["legislative_correspondent"]?._id,
      name: "Kevin Okafor",
      email: "kokafor@house.gov",
      role: "legislative_correspondent",
      expertise: [
        { topic: "healthcare", proficiency: "expert", casesHandled: 0, avgResolutionDays: null, successRate: null },
        { topic: "education", proficiency: "expert", casesHandled: 0, avgResolutionDays: null, successRate: null },
        { topic: "data_privacy", proficiency: "intermediate", casesHandled: 0, avgResolutionDays: null, successRate: null },
        { topic: "agriculture", proficiency: "intermediate", casesHandled: 0, avgResolutionDays: null, successRate: null },
        { topic: "infrastructure", proficiency: "basic", casesHandled: 0, avgResolutionDays: null, successRate: null },
      ],
      agencyExperience: [],
      availability: {
        status: "available",
        currentCaseload: 3,
        maxCaseload: 20,
        schedule: {
          monday: { start: "09:00", end: "18:00" },
          tuesday: { start: "09:00", end: "18:00" },
          wednesday: { start: "09:00", end: "18:00" },
          thursday: { start: "09:00", end: "18:00" },
          friday: { start: "09:00", end: "16:00" },
        },
      },
      metrics: {
        totalCasesResolved: 0,
        avgResolutionDays: 0,
        avgSatisfactionScore: null,
        onTimeRate: 100,
      },
    },
    {
      staffId: staffByRole["chief_of_staff"]?._id,
      name: "Rachel Torres",
      email: "rtorres@house.gov",
      role: "chief_of_staff",
      expertise: [
        { topic: "healthcare", proficiency: "expert", casesHandled: 12, avgResolutionDays: 5.0, successRate: 100 },
        { topic: "infrastructure", proficiency: "expert", casesHandled: 8, avgResolutionDays: 7.0, successRate: 100 },
        { topic: "disaster_relief", proficiency: "intermediate", casesHandled: 5, avgResolutionDays: 3.0, successRate: 100 },
      ],
      agencyExperience: [
        { agency: "FEMA", contactName: "Director Adams", casesHandled: 5 },
        { agency: "FHWA", contactName: "Regional Dir. Patel", casesHandled: 8 },
      ],
      availability: {
        status: "available",
        currentCaseload: 2,
        maxCaseload: 5,
        schedule: {
          monday: { start: "07:00", end: "19:00" },
          tuesday: { start: "07:00", end: "19:00" },
          wednesday: { start: "07:00", end: "19:00" },
          thursday: { start: "07:00", end: "19:00" },
          friday: { start: "07:00", end: "17:00" },
        },
      },
      metrics: {
        totalCasesResolved: 25,
        avgResolutionDays: 5.2,
        avgSatisfactionScore: 4.9,
        onTimeRate: 100,
      },
    },
    {
      staffId: staffByRole["scheduler"]?._id,
      name: "David Park",
      email: "dpark@house.gov",
      role: "scheduler",
      expertise: [
        { topic: "community_event", proficiency: "expert", casesHandled: 0, avgResolutionDays: null, successRate: null },
        { topic: "scheduling", proficiency: "expert", casesHandled: 0, avgResolutionDays: null, successRate: null },
      ],
      agencyExperience: [],
      availability: {
        status: "available",
        currentCaseload: 1,
        maxCaseload: 10,
        schedule: {
          monday: { start: "08:00", end: "17:00" },
          tuesday: { start: "08:00", end: "17:00" },
          wednesday: { start: "08:00", end: "17:00" },
          thursday: { start: "08:00", end: "17:00" },
          friday: { start: "08:00", end: "15:00" },
        },
      },
      metrics: {
        totalCasesResolved: 0,
        avgResolutionDays: 0,
        avgSatisfactionScore: null,
        onTimeRate: 95,
      },
    },
    {
      staffId: staffByRole["communications_director"]?._id,
      name: "Jasmine Williams",
      email: "jwilliams@house.gov",
      role: "communications_director",
      expertise: [
        { topic: "social_media", proficiency: "expert", casesHandled: 0, avgResolutionDays: null, successRate: null },
        { topic: "press", proficiency: "expert", casesHandled: 0, avgResolutionDays: null, successRate: null },
        { topic: "data_privacy", proficiency: "intermediate", casesHandled: 0, avgResolutionDays: null, successRate: null },
      ],
      agencyExperience: [],
      availability: {
        status: "available",
        currentCaseload: 2,
        maxCaseload: 10,
        schedule: {
          monday: { start: "09:00", end: "18:00" },
          tuesday: { start: "09:00", end: "18:00" },
          wednesday: { start: "09:00", end: "18:00" },
          thursday: { start: "09:00", end: "18:00" },
          friday: { start: "09:00", end: "16:00" },
        },
      },
      metrics: {
        totalCasesResolved: 0,
        avgResolutionDays: 0,
        avgSatisfactionScore: null,
        onTimeRate: 100,
      },
    },
  ];

  // Only insert profiles where staffId exists
  const validProfiles = profiles.filter((p) => p.staffId);
  const inserted = await EmployeeProfile.insertMany(validProfiles);

  console.log(`Inserted ${inserted.length} employee profiles`);

  await mongoose.connection.close();
  process.exit(0);
}

seedProfiles().catch((err) => {
  console.error("Seed profiles failed:", err);
  process.exit(1);
});
