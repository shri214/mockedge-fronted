import HTTP from "../BackendApis";
import type { UnifiedDto } from "../Interface";


export const AssignQuestionApi = async(config:Partial<UnifiedDto>)=>{
    const res=await HTTP.post("/test_attempt_question", config);
    return res.data;
}