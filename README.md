# multisig wallet testing
We will use the Multi-Sig Wallet contract from solidity by example: https://solidity-by-example.org/app/multi-sig-wallet/

Feel free to choose a different contract of your own creation or one that you like from the solidity by example website.

1. Using the ethers.js library create a ContractFactory  object and use it to deploy an instance of the Multi-Sig contract to a local hardhat network.

2. Write tests for the Multi-Sig contract to reach a 40% coverage.
Note: a few things that are important to test are. The submitTransaction,  confirmTransaction, executeTransaction, and revokeConfirmation worked as expected and emit the correct event and arguments. That the modifiers onlyOwner, txExists, notExecuted, and notConfirmed work as expected. That the getTransaction method returns the right data.

3. Create a gas report of the cost of deploying a new Multi-Sig contract and how much gas cost calling the different methods.

3. Use GitHub actions to automate the coverage reports using codecov.