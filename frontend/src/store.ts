import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { proposalsReducer } from "./reducers/proposals";
import { providerReducer } from "./reducers/provider";

export const rootReducer = combineReducers({
  provider: providerReducer,
  proposals: proposalsReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
