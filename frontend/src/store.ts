import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { proposalsReducer } from "./reducers/proposals";
import { selectedAccountReducer } from "./reducers/selectedAccount";

export const rootReducer = combineReducers({
  selectedAccount: selectedAccountReducer,
  proposals: proposalsReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
