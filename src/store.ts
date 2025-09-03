// src/store/store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import { userReducer } from "./redux/User.slice";
import { collapseReducer } from "./redux/collapse.slice";
import {testScheduleReducer} from "./redux/TestSchedule.slice"
import { questionQueryReducer } from "./redux/questionQuery.slice";

const rootPersistConfig = {
  key: "root",
  storage,
  whitelist: ["user", "collapse", "testSchedule", "questionQuery"], // you can add more slices later
};

const rootReducer = combineReducers({
  user: userReducer,
  collapse:collapseReducer,
  testSchedule:testScheduleReducer,
  questionQuery:questionQueryReducer,
  // add more slices here
});

const persistedReducer = persistReducer(rootPersistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // needed for redux-persist
    }),
});

export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
