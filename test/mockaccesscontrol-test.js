const { expect } = require("chai");
const { ethers, getChainId } = require("hardhat");
const chalk = require('chalk');

let owner, user1, user2, user3, user4;
let minionContract;

function cyan() {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.cyan.call(chalk, ...arguments));
  }
}

function yellow() {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.yellow.call(chalk, ...arguments));
  }
}

function green() {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.green.call(chalk, ...arguments));
  }
}

function displayResult(name, result) {
  if (!result.newlyDeployed) {
    yellow(`Re-used existing ${name} at ${result.address}`);
  } else {
    green(`${name} deployed at ${result.address}`);
  }
}

const toAmount = (amount) => {
    return ethers.utils.formatEther(amount);
}

describe("Mock Audit", () => {

  green("*********************************");
  green(`         Audit Mocks Main`);
  green("*********************************");

  const { getSigners } = ethers;

  before(async() => {
    [owner, user1, user2, user3, user4] = await getSigners();
  });

  describe("Main Contract Deploy", () => {

    it("Minion Deployed", async function () {
        cyan(`\nDeploying minion Contract...`);
        const Minion = await ethers.getContractFactory("Minion");
        minionContract = await Minion.deploy();
        await minionContract.connect(owner).deployed();    
        displayResult("\nMinion contract deployed at", minionContract);

        await expect(await minionContract.owner()).to.equal(owner.address);
    });
    
    it("Pwn function tested", async function () {
        cyan("\n pwn function testing...");
        let users = [user1, user2, user3, user4];
        let i = 0;
        for( const user of users ){
            let balance = await ethers.provider.getBalance(user.address);
            console.log(`user${++i}: ${toAmount(balance)}`);

            // await expect(await minionContract.connect(user).pwn())
            // .to.be.revertedWith("Well we are not allowing EOAs, sorry");

            // balance = await ethers.provider.getBalance(user.address);
            // console.log(`user${++i}: ${toAmount(balance)}`);
        }
    });
  });
});