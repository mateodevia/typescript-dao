export default {
  votingDelay: 1, // How many blocks after proposal until voting becomes active
  votingPeriod: 5, // How many blocks to allow voters to vote
  minDelay: 0, // How long do we have to wait until we can excecute after
  quorum: 10, // Percentage of total supply of tokens needed to be approve proposals
  addressFile: "contract_addresses.json",
};
