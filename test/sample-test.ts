import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiSigWallet, MultiSigWalletFactory } from "../typechain";

describe("MultiSigWallet Constructor Tests", function () {
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

  it("Should not initialize if there are no owners", async () => {
    await expect(multiSigWalletFactory.deploy([], 1)).to.be.revertedWith(
      "owners required"
    );
  });

  it("Should not initialize if the number of required confirmations is 0", async () => {
    await expect(multiSigWalletFactory.deploy([owner0.address], 0)).to.be.revertedWith(
      "invalid number of required confirmations"
    );
  });

  it("Should not initialize if the number of required confirmations is greater than the number of owners", async () => {
    await expect(multiSigWalletFactory.deploy([owner0.address], 2)).to.be.revertedWith(
      "invalid number of required confirmations"
    );
  });

  it("Should not initialize if owner is address 0", async () => {
    await expect(multiSigWalletFactory.deploy([ethers.constants.AddressZero], 1)).to.be.revertedWith(
      "invalid owner"
    );
  });
  
  it("Should not initialize with duplicate owners", async () => {
    await expect(multiSigWalletFactory.deploy([owner0.address, owner0.address], 1)).to.be.revertedWith(
      "owner not unique"
    );
  });
});

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

  it("Submit Transaction should not work if sent by non-owner", async () => {
    await expect(
      multiSigWallet
        .connect(nonOwner0)
        .submitTransaction(nonOwner0.address, 10, [])
    ).to.be.revertedWith("not owner");
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

describe("MultiSigWallet Confirm Transaction Tests", function () {
  let multiSigWallet: MultiSigWallet;
  let multiSigWalletFactory: MultiSigWalletFactory;
  let owner0: SignerWithAddress;
  let owner1: SignerWithAddress;
  let owner2: SignerWithAddress;
  let nonOwner0: SignerWithAddress;

  before(async () => {
    [owner0, owner1, owner2, nonOwner0] = await ethers.getSigners();
    multiSigWalletFactory = (await ethers.getContractFactory(
      "MultiSigWallet",
      owner0
    )) as MultiSigWalletFactory;
  });

  beforeEach(async () => {
    multiSigWallet = (await multiSigWalletFactory.deploy(
      [owner0.address, owner1.address, owner2.address],
      2
    )) as MultiSigWallet;
    await multiSigWallet.deployed();
  });

  it("Confirm Transaction should not work if sent by non-owner", async () => {
    await multiSigWallet.submitTransaction(nonOwner0.address, 10, []);
    await expect(
      multiSigWallet.connect(nonOwner0).confirmTransaction(0)
    ).to.be.revertedWith("not owner");
  });

  it("Confirm Transaction should not work if txn doesn't exist", async () => {
    await expect(
      multiSigWallet.connect(owner0).confirmTransaction(0)
    ).to.be.revertedWith("tx does not exist");
  });

  it("Confirm Transaction should not work if txn already executed", async () => {
    await multiSigWallet.submitTransaction(nonOwner0.address, 0, []);

    await multiSigWallet.connect(owner0).confirmTransaction(0);
    await multiSigWallet.connect(owner1).confirmTransaction(0);

    await multiSigWallet.executeTransaction(0);

    await expect(multiSigWallet.confirmTransaction(0)).to.be.revertedWith(
      "tx already executed"
    );
  });

  it("Confirm Transaction should not work if txn already confirmed by address", async () => {
    await multiSigWallet.submitTransaction(nonOwner0.address, 10, []);

    await multiSigWallet.connect(owner0).confirmTransaction(0);

    await expect(multiSigWallet.confirmTransaction(0)).to.be.revertedWith(
      "tx already confirmed"
    );
  });

  it("Confirm Transaction should emit the correct event and args", async () => {
    await multiSigWallet.submitTransaction(nonOwner0.address, 0, []);
    await expect(multiSigWallet.confirmTransaction(0))
      .to.emit(multiSigWallet, "ConfirmTransaction")
      .withArgs(owner0.address, 0);
  });
});
