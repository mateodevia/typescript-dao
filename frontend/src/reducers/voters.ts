import { createAction, createReducer } from "@reduxjs/toolkit";
import { Voter } from "../api/types";

export const votersUpdate = createAction<Voter[]>("voters/update");

export const votersReducer = createReducer<Voter[]>([], (builder) => {
  builder.addCase(votersUpdate, (state, action) => {
    return action.payload;
  });
});
