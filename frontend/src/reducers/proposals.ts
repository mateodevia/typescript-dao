import { createAction, createReducer } from "@reduxjs/toolkit";
import { Proposal } from "../api/types";

export const proposalUpdate = createAction<Proposal[]>("proposals/update");

export const proposalsReducer = createReducer<Proposal[]>([], (builder) => {
  builder.addCase(proposalUpdate, (state, action) => {
    return action.payload;
  });
});
