import { Service } from "../models/Service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const shape = (s) => ({
  id: s._id.toString(),
  key: s.key,
  title: s.title,
  desc: s.desc,
  price: s.price,
  duration: s.duration,
  image: s.image,
  category: s.category,
  skills: s.skills,
});

export const listServices = asyncHandler(async (req, res) => {
  const services = await Service.find({ active: true }).sort({ category: 1, price: 1 });
  res.json({ services: services.map(shape) });
});
