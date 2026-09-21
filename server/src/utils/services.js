import mongoose from "mongoose";
import { Service } from "../models/Service.js";
import { badRequest } from "../middleware/asyncHandler.js";

/** Accepts "a,b,c" or ["a","b","c"] and returns a clean list of ids. */
export function parseIdList(raw) {
  const list = Array.isArray(raw) ? raw : String(raw ?? "").split(",");
  return list.map((s) => String(s).trim()).filter(Boolean);
}

/**
 * Loads the requested services, rejecting anything unknown. Every price and
 * duration used by the booking flow comes from here — never from the client,
 * which could otherwise book a ₹1200 spa for ₹1.
 */
export async function loadServices(rawIds) {
  const ids = parseIdList(rawIds);
  if (ids.length === 0) throw badRequest("Choose at least one service.");

  const invalid = ids.filter((id) => !mongoose.isValidObjectId(id));
  if (invalid.length) throw badRequest("One of the selected services is not valid.");

  const services = await Service.find({ _id: { $in: ids }, active: true });
  if (services.length !== ids.length) {
    throw badRequest("One of the selected services is no longer available.");
  }
  return services;
}

/** Union of the skills needed to perform every service in the list. */
export function requiredSkillsFor(services) {
  return [...new Set(services.flatMap((s) => s.skills))];
}

export function totalPrice(services) {
  return services.reduce((sum, s) => sum + s.price, 0);
}

export function totalDuration(services) {
  return services.reduce((sum, s) => sum + s.duration, 0);
}
