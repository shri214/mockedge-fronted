import HTTP from "../BackendApis";

export const AttemptCount = async (userId : string|undefined) => {
  const res = await HTTP.get(`/test-scheduled/${userId}`);
  return res.data;
};
