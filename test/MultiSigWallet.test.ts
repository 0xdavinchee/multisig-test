import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiSigWallet, MultiSigWalletFactory } from "../typechain";

describe("MultiSigWallet Constructor Tests", function () {
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

  it("Should not initialize if there are no owners", async () => {
    await expect(multiSigWalletFactory.deploy([], 1)).to.be.revertedWith(
      "owners required"
    );
  });

  it("Should not initialize if the number of required confirmations is 0", async () => {
    await expect(
      multiSigWalletFactory.deploy([owner0.address], 0)
    ).to.be.revertedWith("invalid number of required confirmations");
  });

  it("Should not initialize if the number of required confirmations is greater than the number of owners", async () => {
    await expect(
      multiSigWalletFactory.deploy([owner0.address], 2)
    ).to.be.revertedWith("invalid number of required confirmations");
  });

  it("Should not initialize if owner is address 0", async () => {
    await expect(
      multiSigWalletFactory.deploy([ethers.constants.AddressZero], 1)
    ).to.be.revertedWith("invalid owner");
  });

  it("Should not initialize with duplicate owners", async () => {
    await expect(
      multiSigWalletFactory.deploy([owner0.address, owner0.address], 1)
    ).to.be.revertedWith("owner not unique");
  });

  it("Should initialize if num owners === numConfirmationsRequired", async () => {
    multiSigWallet = await multiSigWalletFactory.deploy(
      [owner0.address, owner1.address],
      2
    );
    expect(await multiSigWallet.getOwners()).to.eql([
      owner0.address,
      owner1.address,
    ]);
  });

  it("Should initialize if num owners > numConfirmationsRequired", async () => {
    await multiSigWalletFactory.deploy([owner0.address, owner1.address], 1);
    expect(await multiSigWallet.getOwners()).to.eql([
      owner0.address,
      owner1.address,
    ]);
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

describe("MultiSigWallet Execute Transaction Tests", function () {
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

  it("Execute Transaction should not work if sent by non-owner", async () => {
    await multiSigWallet.submitTransaction(nonOwner0.address, 10, []);
    await expect(
      multiSigWallet.connect(nonOwner0).executeTransaction(0)
    ).to.be.revertedWith("not owner");
  });

  it("Execute Transaction should not work if txn doesn't exist", async () => {
    await expect(
      multiSigWallet.connect(owner0).executeTransaction(0)
    ).to.be.revertedWith("tx does not exist");
  });

  it("Execute Transaction should not work if txn already executed", async () => {
    await multiSigWallet.submitTransaction(nonOwner0.address, 0, []);

    await multiSigWallet.connect(owner0).confirmTransaction(0);
    await multiSigWallet.connect(owner1).confirmTransaction(0);

    await multiSigWallet.executeTransaction(0);

    await expect(multiSigWallet.executeTransaction(0)).to.be.revertedWith(
      "tx already executed"
    );
  });

  it("Execute Transaction should not work if number of confirmations is less than numConfirmationsRequired", async () => {
    await multiSigWallet.submitTransaction(nonOwner0.address, 10, []);

    await multiSigWallet.connect(owner0).confirmTransaction(0);

    await expect(multiSigWallet.executeTransaction(0)).to.be.revertedWith(
      "cannot execute tx"
    );
  });

  it("Execute Transaction fails when txn value greater than 0, but data is empty", async () => {
    await multiSigWallet.submitTransaction(nonOwner0.address, 10, []);

    await multiSigWallet.connect(owner0).confirmTransaction(0);
    await multiSigWallet.connect(owner1).confirmTransaction(0);

    await expect(multiSigWallet.executeTransaction(0)).to.be.revertedWith(
      "tx failed"
    );
  });

  it("Execute Transaction should emit the correct event and args", async () => {
    await multiSigWallet.submitTransaction(nonOwner0.address, 0, []);

    await multiSigWallet.connect(owner0).confirmTransaction(0);
    await multiSigWallet.connect(owner1).confirmTransaction(0);

    await expect(multiSigWallet.executeTransaction(0))
      .to.emit(multiSigWallet, "ExecuteTransaction")
      .withArgs(owner0.address, 0);
  });
});

describe("MultiSigWallet Revoke Confirmation Tests", function () {
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

  it("Revoke Confirmation should not work if sent by non-owner", async () => {
    await multiSigWallet.submitTransaction(nonOwner0.address, 10, []);
    await expect(
      multiSigWallet.connect(nonOwner0).revokeConfirmation(0)
    ).to.be.revertedWith("not owner");
  });

  it("Revoke Confirmation should not work if txn doesn't exist", async () => {
    await expect(
      multiSigWallet.connect(owner0).revokeConfirmation(0)
    ).to.be.revertedWith("tx does not exist");
  });

  it("Revoke Confirmation should not work if txn already executed", async () => {
    await multiSigWallet.submitTransaction(nonOwner0.address, 0, []);

    await multiSigWallet.connect(owner0).confirmTransaction(0);
    await multiSigWallet.connect(owner1).confirmTransaction(0);

    await multiSigWallet.executeTransaction(0);

    await expect(multiSigWallet.revokeConfirmation(0)).to.be.revertedWith(
      "tx already executed"
    );
  });

  it("Revoke Confirmation should not work if the message sender hasn't already confirmed the txn", async () => {
    await multiSigWallet.submitTransaction(nonOwner0.address, 10, []);

    await multiSigWallet.connect(owner0).confirmTransaction(0);

    await expect(
      multiSigWallet.connect(owner1).revokeConfirmation(0)
    ).to.be.revertedWith("tx not confirmed");
  });

  it("Revoke Confirmation should successfully remove confirmation, not allowing execution of txn", async () => {
    await multiSigWallet.submitTransaction(nonOwner0.address, 10, []);

    await multiSigWallet.connect(owner0).confirmTransaction(0);
    await multiSigWallet.connect(owner1).confirmTransaction(0);

    await multiSigWallet.connect(owner1).revokeConfirmation(0);

    await expect(multiSigWallet.executeTransaction(0)).to.be.revertedWith(
      "cannot execute tx"
    );
  });

  it("Revoke Confirmation should emit the correct event and args", async () => {
    await multiSigWallet.submitTransaction(nonOwner0.address, 0, []);

    await multiSigWallet.connect(owner0).confirmTransaction(0);

    await expect(multiSigWallet.revokeConfirmation(0))
      .to.emit(multiSigWallet, "RevokeConfirmation")
      .withArgs(owner0.address, 0);
  });
});

describe("MultiSigWallet Misc Function Tests", function () {
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

  it("getOwners should return correct owners", async () => {
    expect(await multiSigWallet.getOwners()).to.eql([owner0.address, owner1.address, owner2.address]);
  });
  
  it("getTransactionCount should return 0 prior to creation", async () => {
    expect(await (await multiSigWallet.getTransactionCount()).toNumber()).to.eql(0);
  });

  it("getTransactionCount should return 1 after creating 1 txn", async () => {
    await multiSigWallet.submitTransaction(owner0.address, 0, []);
    expect((await multiSigWallet.getTransactionCount()).toNumber()).to.eq(1);
  });

  it("getTransaction should return newly created object", async () => {
    const txn = await multiSigWallet.submitTransaction(owner1.address, 0, []);
    const getTxn = await multiSigWallet.getTransaction(0)
    expect((await multiSigWallet.getTransaction(0)).value.toNumber()).to.eql(txn.value.toNumber());
  });
});