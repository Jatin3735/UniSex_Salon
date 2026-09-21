import { Staff } from "../models/Staff.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { loadServices, requiredSkillsFor } from "../utils/services.js";

const shape = (s) => ({
  id: s._id.toString(),
  key: s.key,
  name: s.name,
  age: s.age,
  mobile: s.mobile,
  photo: s.photo,
  skills: s.skills,
});

export const listStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.find({ active: true }).sort({ name: 1 });
  res.json({ staff: staff.map(shape) });
});

/**
 * Staff who can perform *every* selected service.
 *
 * `$all` is the point: matching on "any one skill" would offer a hair-only
 * barber for a facial. An empty service list is rejected upstream by
 * loadServices rather than being allowed to match everyone.
 */
export const listAvailableStaff = asyncHandler(async (req, res) => {
  const services = await loadServices(req.query.serviceIds);
  const requiredSkills = requiredSkillsFor(services);

  const staff = await Staff.find({
    active: true,
    skills: { $all: requiredSkills },
  }).sort({ name: 1 });

  res.json({
    requiredSkills,
    staff: staff.map(shape),
  });
});
