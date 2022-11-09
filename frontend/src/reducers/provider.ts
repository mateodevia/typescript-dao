import { createAction, createReducer } from "@reduxjs/toolkit";
import { ethers } from "ethers";
export const setProvider = createAction<ethers.providers.Web3Provider | null>(
  "proposals/update"
);

export const providerReducer =
  createReducer<ethers.providers.Web3Provider | null>(null, (builder) => {
    builder.addCase(setProvider, (state, action) => {
      return action.payload;
    });
  });
