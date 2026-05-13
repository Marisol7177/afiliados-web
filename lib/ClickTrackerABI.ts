const ClickTrackerABI = [
  {
    "inputs":[
      {"internalType":"string","name":"clickId","type":"string"},
      {"internalType":"string","name":"ref","type":"string"}
    ],
    "name":"registerClick",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  },
  {
    "inputs":[],
    "name":"totalClicks",
    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability":"view",
    "type":"function"
  },
  {
    "inputs":[{"internalType":"uint256","name":"","type":"uint256"}],
    "name":"clicks",
    "outputs":[
      {"internalType":"string","name":"clickId","type":"string"},
      {"internalType":"string","name":"ref","type":"string"},
      {"internalType":"uint256","name":"timestamp","type":"uint256"}
    ],
    "stateMutability":"view",
    "type":"function"
  }
] as const;

export default ClickTrackerABI;
