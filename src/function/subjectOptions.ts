import HTTP from "../BackendApis"

export const SubjectOptions=async()=>{
  const res=await HTTP.get("/questions/subject-name");
  return res.data;
}