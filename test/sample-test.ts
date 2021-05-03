import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiSigWallet } from "../typechain/MultiSigWallet";

describe("MultiSigWallet", function () {
  let multiSigWallet: MultiSigWallet;
  it("Should return the new greeting once it's changed", async function () {
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    // multiSigWallet = (await MultiSigWallet.deploy(
    // )) as MultiSigWallet;

    // await multiSigWallet.deployed();
  });
});
