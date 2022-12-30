import { toast } from "react-toastify";

export const apiWrapper = async function <T>(f: () => Promise<T>): Promise<T> {
  try {
    return await f();
  } catch (e: any) {
    const message = e.error?.data?.message;
    switch (message) {
      case "Error: VM Exception while processing transaction: reverted with reason string 'Governor: proposal already exists'":
        toast.error("There is already a proposal with that description");
        break;
      case "Error: VM Exception while processing transaction: reverted with reason string 'GovernorVotingSimple: vote already cast'":
        toast.error("You already voted for this proposal");
        break;
      case "Error: VM Exception while processing transaction: reverted with reason string 'Governor: vote not currently active'":
        toast.error("You cannot vote for this proposal any more");
        break;
      default:
        toast.error("An unexpected error ocurred");
    }
    throw e;
  }
};
