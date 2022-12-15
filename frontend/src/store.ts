import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { proposalsReducer } from "./reducers/proposals";
import { selectedAccountReducer } from "./reducers/selectedAccount";
import { votersReducer } from "./reducers/voters";

export const rootReducer = combineReducers({
  selectedAccount: selectedAccountReducer,
  proposals: proposalsReducer,
  voters: votersReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
