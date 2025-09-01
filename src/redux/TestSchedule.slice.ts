// src/redux/TestSchedule.slice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import HTTP from "../BackendApis";

export interface TestScheduledDTO {
  id: string;
  userId: string;
  testName: string;
  scheduleMock: string;
  maxAttemptsPerDay: number;
  durationSeconds: number;
  isActive: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // current page
  size: number; // page size
  first: boolean;
  last: boolean;
}

export interface TestScheduleState {
  data: TestScheduledDTO[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
}

const initialState: TestScheduleState = {
  data: [],
  totalPages: 0,
  totalElements: 0,
  currentPage: 0,
  pageSize: 10,
  loading: false,
  error: null,
};

// Thunk with pagination params
export const fetchTestSchedules = createAsyncThunk<
  PageResponse<TestScheduledDTO>, // return type
  { userId: string; page: number; size: number }, // args
  { rejectValue: string }
>("testSchedule/fetch", async ({ userId, page, size }, thunkAPI) => {
  try {
    const res = await HTTP.get(
      `/test-scheduled/get/user/${userId}?page=${page}&size=${size}`
    );
    return res.data as PageResponse<TestScheduledDTO>;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      err.response?.data?.message || "Failed to fetch test schedules"
    );
  }
});

const TestScheduledSlice = createSlice({
  name: "testSchedule",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTestSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchTestSchedules.fulfilled,
        (state, action: PayloadAction<PageResponse<TestScheduledDTO>>) => {
          state.loading = false;
          state.data = action.payload.content;
          state.totalPages = action.payload.totalPages;
          state.totalElements = action.payload.totalElements;
          state.currentPage = action.payload.number + 1; // convert 0-based to 1-based
          state.pageSize = action.payload.size;
        }
      )
      .addCase(fetchTestSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      });
  },
});

export const testScheduleReducer = TestScheduledSlice.reducer;
