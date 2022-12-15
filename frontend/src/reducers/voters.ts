import { createAction, createReducer } from "@reduxjs/toolkit";

export const votersUpdate = createAction<string[]>("voters/update");

export const votersReducer = createReducer<string[]>([], (builder) => {
  builder.addCase(votersUpdate, (state, action) => {
    return action.payload;
  });
});
