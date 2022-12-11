import { createAction, createReducer } from "@reduxjs/toolkit";

export const selectedAccountUpdate = createAction<string | null>(
  "proposals/update"
);

export const selectedAccountReducer = createReducer<string | null>(
  null,
  (builder) => {
    builder.addCase(selectedAccountUpdate, (state, action) => {
      return action.payload;
    });
  }
);
