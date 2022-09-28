import { MyGovernor, TimeLock, Token, Treasury } from "../typechain";

export interface IContracts {
  token: Token;
  timeLock: TimeLock;
  governor: MyGovernor;
  treasury: Treasury;
}
