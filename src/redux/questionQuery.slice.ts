import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UnifiedDto } from "../Interface";

const initialState: UnifiedDto = {
  attemptId: "",
  limit: 10,
  subject: "",
  difficultyLevel: "",
  previousYear: 0,
  exam: "",
  chapter: "",
};

const questionQuerySlice = createSlice({
  name: "questionQuery",
  initialState,
  reducers: {
    setQuestionQuery: (state, action: PayloadAction<UnifiedDto>) => {
      return { ...state, ...action.payload };
    },
    clearQuestionQuery: (state) => {
      state.attemptId = "";
      state.limit = 10;
      state.subject = "";
      state.difficultyLevel = "";
      state.previousYear = 0;
      state.exam = "";
      state.chapter = "";
    },
  },
});

export const { setQuestionQuery, clearQuestionQuery } =
  questionQuerySlice.actions;

export const questionQueryReducer = questionQuerySlice.reducer;
