const Staff = require("../models/Staff");

// GET /api/staff
exports.getStaff = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = { isActive: true };
    if (role) filter.role = role;

    const staff = await Staff.find(filter).lean();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/staff/:id
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: "Staff not found" });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/staff/:id/dashboard
// Returns the dashboard config and relevant data for a specific staff role
exports.getDashboard = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: "Staff not found" });

    res.json({
      staff: {
        id: staff._id,
        name: staff.name,
        role: staff.role,
        permissions: staff.permissions,
      },
      modules: staff.dashboardModules,
      // Frontend uses this to determine which API endpoints to call
      dataEndpoints: getEndpointsForRole(staff.role),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function getEndpointsForRole(role) {
  const base = {
    chief_of_staff: {
      messages: "/api/messages?role=chief_of_staff",
      stats: "/api/messages/stats?role=chief_of_staff",
      trends: "/api/trends/latest",
      cases: "/api/cases/stats",
      approvals: "/api/messages?status=new&urgency=critical",
    },
    legislative_correspondent: {
      messages: "/api/messages?role=legislative_correspondent",
      stats: "/api/messages/stats?role=legislative_correspondent",
      batches: "/api/messages?role=legislative_correspondent&batch=true",
    },
    caseworker: {
      cases: "/api/cases",
      caseStats: "/api/cases/stats",
      messages: "/api/messages?role=caseworker",
    },
    scheduler: {
      messages: "/api/messages?role=scheduler",
      events: "/api/messages?role=scheduler&intent=event_invitation",
    },
    communications_director: {
      messages: "/api/messages?role=communications_director",
      social: "/api/messages?channel=twitter",
      sentiment: "/api/trends/latest",
    },
  };

  return base[role] || {};
}

module.exports = exports;
