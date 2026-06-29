import Event from "../models/EventModel.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { getPagination } from "../utils/pagination.js";

// ─── CREATE EVENT ─────────────────────────────────────────────────────────────
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, venue, googleFormLink } = req.body;

    let poster = "";
    // Upload event poster to Cloudinary if provided (optional field)
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      poster = result.secure_url;
    }

    const event = await Event.create({
      society: req.user.id,
      title,
      description,
      date,
      venue,
      googleFormLink,
      poster,
    });
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET ALL EVENTS (student view) ───────────────────────────────────────────
// Returns paginated events from ALL societies
export const getAllEvents = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const total = await Event.countDocuments();
    const events = await Event.find()
      .populate("society", "name logo college") // replace ID with actual society info
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, data: events, hasMore: page * limit < total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET SOCIETY'S OWN EVENTS ─────────────────────────────────────────────────
// Returns only the events posted by the logged-in society (for society dashboard)
export const getEventsBySociety = async (req, res) => {
  try {
    const events = await Event.find({ society: req.user.id }).sort({ date: 1 });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE EVENT ─────────────────────────────────────────────────────────────
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    // Only the society that created this event can delete it
    if (event.society.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });

    await event.deleteOne();
    res.json({ success: true, message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
