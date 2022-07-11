export default {
  votingDelay: 1, // How many blocks after proposal until voting becomes active
  votingPeriod: 10, // How many blockst to allow voters to vote
  minDelay: 0, // How long do we have to wait until we can excecute after
  quorum: 5, // Percentage of total supply of tokens needed to be approve proposals
  addressFile: "contract_addresses.json",
};
