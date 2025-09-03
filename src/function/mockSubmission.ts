import HTTP from "../BackendApis"

export const MockSubmission=async(attemptId:string)=>{
    const res=await HTTP.put(`test_attempt_question/submitted/${attemptId}`)
    return res.data;
}