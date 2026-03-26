import Ticket from '../models/Ticket.js';
import Employee from '../models/Employee.js';
import AccessEvent from '../models/AccessEvent.js';
import { ROLES, TICKET_STATUS, TICKET_ROUTING } from '../config/constants.js';

export const getTickets = async (req, res) => {
  try {
    const { role, employeeId } = req.user;
    const { page = 1, limit = 20, status, routing } = req.query;

    let query = {};

    // Role-based filtering
    if (role === ROLES.EMPLOYEE) {
      query.employeeId = employeeId;
    } else if (role === ROLES.MANAGER) {
      // Managers see pending tickets that need review
      query.routingDecision = TICKET_ROUTING.MANAGER_REVIEW;
      if (!status) {
        query.status = TICKET_STATUS.PENDING;
      }
    }
    // Investigators see all

    if (status) {
      query.status = { $in: status.split(',') };
    }

    if (routing) {
      query.routingDecision = { $in: routing.split(',') };
    }

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('employeeId', 'name employeeId department currentRiskScore')
        .populate('accessEventId')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Ticket.countDocuments(query)
    ]);

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, employeeId } = req.user;

    const ticket = await Ticket.findById(id)
      .populate('employeeId', 'name employeeId department branch currentRiskScore')
      .populate('accessEventId')
      .populate('reviewedBy', 'name employeeId')
      .lean();

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Authorization
    if (role === ROLES.EMPLOYEE && !employeeId.equals(ticket.employeeId._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
};

export const createTicket = async (req, res) => {
  try {
    const { accessEventId, text } = req.body;
    const { employeeId } = req.user;

    if (!accessEventId || !text) {
      return res.status(400).json({ error: 'Access event ID and text are required' });
    }

    // Verify access event exists and belongs to user
    const accessEvent = await AccessEvent.findById(accessEventId);
    if (!accessEvent) {
      return res.status(404).json({ error: 'Access event not found' });
    }

    if (!accessEvent.employeeId.equals(employeeId)) {
      return res.status(403).json({ error: 'Cannot create ticket for another employee\'s event' });
    }

    // Generate ticket ID
    const ticketCount = await Ticket.countDocuments();
    const ticketId = `TKT-${new Date().getFullYear()}-${String(ticketCount + 1).padStart(6, '0')}`;

    // Calculate check scores (simplified - in real app would use ML)
    const checkScores = {
      relevanceScore: Math.floor(Math.random() * 30) + 60,
      coherenceScore: Math.floor(Math.random() * 30) + 60,
      specificityScore: Math.floor(Math.random() * 30) + 50,
      timelinessScore: 85,
      consistencyScore: Math.floor(Math.random() * 30) + 60
    };

    const overallScore = Math.floor(
      Object.values(checkScores).reduce((a, b) => a + b) / 5
    );

    const routingDecision = overallScore > 75 ? TICKET_ROUTING.AUTO_RESOLVE :
                            overallScore > 50 ? TICKET_ROUTING.MANAGER_REVIEW :
                            TICKET_ROUTING.CVU_ESCALATION;

    const status = routingDecision === TICKET_ROUTING.AUTO_RESOLVE ?
                   TICKET_STATUS.RESOLVED : TICKET_STATUS.PENDING;

    const ticket = await Ticket.create({
      ticketId,
      employeeId,
      accessEventId,
      text,
      checkScores,
      overallScore,
      responseTime: 0,
      routingDecision,
      status
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('employeeId', 'name employeeId')
      .populate('accessEventId');

    res.status(201).json(populatedTicket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
};

export const approveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const { role, employeeId } = req.user;

    if (role !== ROLES.MANAGER && role !== ROLES.INVESTIGATOR) {
      return res.status(403).json({ error: 'Only managers and investigators can approve tickets' });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      {
        status: TICKET_STATUS.APPROVED,
        reviewedBy: employeeId,
        reviewNotes: notes || 'Approved'
      },
      { new: true }
    ).populate('employeeId', 'name employeeId department');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Approve ticket error:', error);
    res.status(500).json({ error: 'Failed to approve ticket' });
  }
};

export const rejectTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const { role, employeeId } = req.user;

    if (role !== ROLES.MANAGER && role !== ROLES.INVESTIGATOR) {
      return res.status(403).json({ error: 'Only managers and investigators can reject tickets' });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      {
        status: TICKET_STATUS.REJECTED,
        reviewedBy: employeeId,
        reviewNotes: notes || 'Rejected'
      },
      { new: true }
    ).populate('employeeId', 'name employeeId department');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Reject ticket error:', error);
    res.status(500).json({ error: 'Failed to reject ticket' });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const { role, employeeId } = req.user;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Only ticket owner can update
    if (!ticket.employeeId.equals(employeeId)) {
      return res.status(403).json({ error: 'Can only update your own tickets' });
    }

    // Can only update pending tickets
    if (ticket.status !== TICKET_STATUS.PENDING) {
      return res.status(400).json({ error: 'Can only update pending tickets' });
    }

    ticket.text = text;
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
};
