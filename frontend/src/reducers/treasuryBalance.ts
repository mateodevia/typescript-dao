import { createAction, createReducer } from "@reduxjs/toolkit";

export const treasuryBalanceUpdate = createAction<string | null>(
  "treasuryBalance/update"
);

export const treasuryBalanceReducer = createReducer<string | null>(
  null,
  (builder) => {
    builder.addCase(treasuryBalanceUpdate, (state, action) => {
      return action.payload;
    });
  }
);
