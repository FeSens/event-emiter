import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


const types = {
  Order: [
      { name: 'authority', type: 'address' },
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'erc20Token', type: 'address' },
      { name: 'eventMessage', type: 'bytes32' },
  ]
};

describe("EventEmitter Contact", function () {
  let signers: SignerWithAddress[];
  let token: Contract;
  let eventEmitter: Contract;
  let domain: any;
  let order: any;

  beforeEach(async function () {
    signers = await ethers.getSigners();
    const EventEmitter = await ethers.getContractFactory("EventEmitter");
    const _eventEmitter = await EventEmitter.deploy();
    eventEmitter = await _eventEmitter.deployed();

    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy();
    token = await testToken.deployed();

    const [deployer, user1, user2, user3] = signers;
    await testToken.connect(user1).mint(ethers.utils.parseEther("2"));
    await testToken.connect(user1).approve(eventEmitter.address, ethers.constants.MaxUint256);

    domain = {
      name: 'EventEmitter',
      version: '0.01',
      chainId: 31337,
      verifyingContract: eventEmitter.address
    };

    order = {
      authority: user2.address,
      sender: user1.address,
      recipient: user3.address,
      amount: ethers.utils.parseEther("1"),
      erc20Token: token.address,
      eventMessage: `${user2.address} just bought ${deployer.address} a beer`,
    };
  });

  describe(".executeOrder", async () => {
    it("should verify authority signature", async () => {
      const [deployer, user1, user2, user3] = signers;

      const signedOrder = {...order, eventMessage: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(order.eventMessage))};

      const authoritySignature = await deployer._signTypedData(domain, types, signedOrder);
      const senderSignature = await user1._signTypedData(domain, types, signedOrder);

      await expect(eventEmitter.executeOrder(
        order,
        authoritySignature,
        senderSignature
      )).to.revertedWith("Authority signature is invalid");
    });

    it("should verify sender signature", async () => {
      const [deployer, user1, user2, user3] = signers;

      const signedOrder = {...order, eventMessage: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(order.eventMessage))};

      const authoritySignature = await user2._signTypedData(domain, types, signedOrder);
      const senderSignature = await user3._signTypedData(domain, types, signedOrder);

      await expect(eventEmitter.executeOrder(
        order,
        authoritySignature,
        senderSignature
      )).to.revertedWith("Sender signature is invalid");
    });

    it("should emit an event", async function () {
      const [deployer, user1, user2, user3] = signers;
  
      const signedOrder = {...order, eventMessage: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(order.eventMessage))};
  
      const authoritySignature = await user2._signTypedData(domain, types, signedOrder);
      const senderSignature = await user1._signTypedData(domain, types, signedOrder);
     
      await expect(eventEmitter.executeOrder(
        order,
        authoritySignature,
        senderSignature
      )).to.emit(eventEmitter, 'OrderExecuted').withArgs(user2.address, user1.address, user3.address, ethers.utils.parseEther("1"), order.eventMessage);
    });

    it("should execute order only once", async function () {
      const [deployer, user1, user2, user3] = signers;
  
      const signedOrder = {...order, eventMessage: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(order.eventMessage))};
  
      const authoritySignature = await user2._signTypedData(domain, types, signedOrder);
      const senderSignature = await user1._signTypedData(domain, types, signedOrder);
     
      await eventEmitter.executeOrder(
        order,
        authoritySignature,
        senderSignature
      );

      await expect(eventEmitter.executeOrder(
        order,
        authoritySignature,
        senderSignature
      )).to.revertedWith("Order already executed");
    })
  })
});