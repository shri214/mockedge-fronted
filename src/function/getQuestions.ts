import HTTP from "../BackendApis"


export const GetQuestion=async (attemptId:string, page:number)=>{
    const res= await HTTP.get(`/test_attempt_question/${attemptId}/questions?page=${page}`);
    return res.data;
}


// http://localhost:8080/api/v1/mockedge/test_attempt_question/921eb915-d823-4ed6-859a-51f0cdeedef7/questions?page=3&size=1