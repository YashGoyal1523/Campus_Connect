import Society from "../models/SocietyModel.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { getPagination } from "../utils/pagination.js";

export const getAllSocieties = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const total = await Society.countDocuments();
    const societies = await Society.find()
      .select("-password")
      .skip(skip)
      .limit(limit);

    res.json({ data: societies, hasMore: page * limit < total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSocietyById = async (req, res) => {
  try {
    const society = await Society.findById(req.params.id).select("-password");
    if (!society) return res.status(404).json({ message: "Society not found" });
    res.json(society);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSocietyProfile = async (req, res) => {
  try {
    const { description, instagramLink, websiteLink } = req.body;
    const updateData = { description, instagramLink, websiteLink };

    if (req.files?.logo) {
      const result = await uploadToCloudinary(req.files.logo[0].buffer, req.files.logo[0].mimetype);
      updateData.logo = result.secure_url;
    }

    const updated = await Society.findByIdAndUpdate(req.user.id, updateData, { new: true }).select("-password");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};