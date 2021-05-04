import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiSigWallet, MultiSigWalletFactory } from "../typechain";

describe("MultiSigWallet Submit Transaction Tests", function () {
  let multiSigWallet: MultiSigWallet;
  let multiSigWalletFactory: MultiSigWalletFactory;
  let owner0: SignerWithAddress;
  let owner1: SignerWithAddress;
  let nonOwner0: SignerWithAddress;

  before(async () => {
    [owner0, owner1, nonOwner0] = await ethers.getSigners();
    multiSigWalletFactory = (await ethers.getContractFactory(
      "MultiSigWallet",
      owner0
    )) as MultiSigWalletFactory;
  });

  beforeEach(async () => {
    multiSigWallet = (await multiSigWalletFactory.deploy(
      [owner0.address],
      1
    )) as MultiSigWallet;
    await multiSigWallet.deployed();
  });
  
  it("Submit Transaction should work if sent by owner", async () => {
    await multiSigWallet.submitTransaction(owner0.address, 0, []);
    expect((await multiSigWallet.getTransactionCount()).toNumber()).to.eq(1);
  });

  it("Submit Transaction should emit the correct event and args", async () => {
    await expect(multiSigWallet.submitTransaction(owner1.address, 0, []))
      .to.emit(multiSigWallet, "SubmitTransaction")
      .withArgs(owner0.address, 0, owner1.address, 0, []);
  });
});
