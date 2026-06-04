import mongoose from "mongoose";

// Society schema — represents a college society account.
// Societies can log in, post content, manage events/recruitments, and have a team.
const societySchema = new mongoose.Schema({
  name:          { type: String, required: true },
  // unique: true creates a MongoDB index that prevents two accounts sharing an email
  email:         { type: String, required: true, unique: true },
  // Stored as a bcrypt hash — never the plain-text password
  password:      { type: String, required: true },
  description:   { type: String, required: true },
  category:      { type: String, required: true },
  // logo is a Cloudinary URL; defaults to "" so it's always a string (never null)
  logo:          { type: String, default: "" },
  college:       { type: String, required: true },
  // Social/web links are optional — default "" avoids null-checks in the frontend
  instagramLink: { type: String, default: "" },
  websiteLink:   { type: String, default: "" },
// timestamps: true automatically adds createdAt and updatedAt fields
}, { timestamps: true });

const Society = mongoose.models.Society || mongoose.model("Society", societySchema);
export default Society;
