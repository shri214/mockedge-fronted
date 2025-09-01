import HTTP from "../BackendApis"
import type { CreateMockFormData } from "../Interface"

export const ScheduledMock = async (formData: CreateMockFormData, userId: string|undefined) => {
  const config = {
    userId,
    testName: formData.testName,
    scheduleMock: formData.scheduleMock,
  }

  try {
    const response = await HTTP.post("/test-scheduled", config)
    return response.data   // usually APIs wrap the data inside `.data`
  } catch (error: any) {
    console.error("Error scheduling mock:", error)
    throw error   // rethrow so caller can handle
  }
}
