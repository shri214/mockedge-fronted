import HTTP from "../BackendApis";
import type { CreateAttemptDto } from "../Interface";

export const createAttempts = async (config: CreateAttemptDto) => {
  const res = await HTTP.post("/test-attempt", config);
  return res.data;
};
