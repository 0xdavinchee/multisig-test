# multisig wallet testing

[![codecov](https://codecov.io/gh/0xdavinchee/multisig-test/branch/main/graph/badge.svg?token=R2EP9QHGRC)](https://codecov.io/gh/0xdavinchee/multisig-test)

We will use the Multi-Sig Wallet contract from solidity by example: https://solidity-by-example.org/app/multi-sig-wallet/

Feel free to choose a different contract of your own creation or one that you like from the solidity by example website.

1. Using the ethers.js library create a ContractFactory object and use it to deploy an instance of the Multi-Sig contract to a local hardhat network.

2. Write tests for the Multi-Sig contract to reach a 40% coverage. Note: a few things that are important to test are. The submitTransaction, confirmTransaction, executeTransaction, and revokeConfirmation worked as expected and emit the correct event and arguments. That the modifiers onlyOwner, txExists, notExecuted, and notConfirmed work as expected. That the getTransaction method returns the right data.

3. Create a gas report of the cost of deploying a new Multi-Sig contract and how much gas cost calling the different methods.

·-----------------------------------------|----------------------------|-------------|-----------------------------·
|           Solc version: 0.7.6           ·  Optimizer enabled: false  ·  Runs: 200  ·  Block limit: 12450000 gas  │
··········································|····························|·············|······························
|  Methods                                ·                1 gwei/gas                ·       3352.92 usd/eth       │
···················|······················|··············|·············|·············|···············|··············
|  Contract        ·  Method              ·  Min         ·  Max        ·  Avg        ·  # calls      ·  usd (avg)  │
···················|······················|··············|·············|·············|···············|··············
|  MultiSigWallet  ·  confirmTransaction  ·       57643  ·      74743  ·      69043  ·           18  ·       0.23  │
···················|······················|··············|·············|·············|···············|··············
|  MultiSigWallet  ·  executeTransaction  ·           -  ·          -  ·      63574  ·            5  ·       0.21  │
···················|······················|··············|·············|·············|···············|··············
|  MultiSigWallet  ·  revokeConfirmation  ·       20257  ·      25514  ·      22009  ·            3  ·       0.07  │
···················|······················|··············|·············|·············|···············|··············
|  MultiSigWallet  ·  submitTransaction   ·       81542  ·     101454  ·      89926  ·           19  ·       0.30  │
···················|······················|··············|·············|·············|···············|··············
|  Deployments                            ·                                          ·  % of limit   ·             │
··········································|··············|·············|·············|···············|··············
|  MultiSigWallet                         ·     1517453  ·    1608615  ·    1598419  ·       12.8 %  ·       5.36  │
·-----------------------------------------|--------------|-------------|-------------|---------------|-------------·

3. Use GitHub actions to automate the coverage reports using codecov.