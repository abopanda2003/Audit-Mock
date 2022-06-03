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

//   describe("Dex Engine Deploy", () => {

//     it("Factory deploy", async function () {
//       const chainId = await getChainId();
//       green(`chain id: ${chainId}`);

//       console.log("owner:", owner.address);
//       console.log("user1:", user1.address);
//       console.log("user2:", user2.address);
//       console.log("user3:", user3.address);
//       console.log("user4:", user4.address);

//       cyan(`\nDeploying Factory Contract...`);

//       const Factory = await ethers.getContractFactory("PancakeSwapFactory");      
//       exchangeFactory = await Factory.deploy(owner.address);
//       await exchangeFactory.deployed();
//       initCodePairHash = await exchangeFactory.INIT_CODE_PAIR_HASH();
//       console.log("INIT_CODE_PAIR_HASH: ", initCodePairHash);  
//       displayResult("\nMy Factory deployed at", exchangeFactory);
//     });
  
//     it("WETH deploy", async function () {
//       cyan(`\nDeploying WETH Contract...`);
//       const wETH = await ethers.getContractFactory("WETH");
//       wEth = await wETH.deploy();
//       await wEth.deployed();
//       displayResult("\nMy WETH deployed at", wEth);
//     });
    
//     it("Router deploy", async function () {
//       cyan(`\nDeploying Router Contract...`);
//       const Router = await ethers.getContractFactory("PancakeSwapRouter");
//       exchangeRouter = await Router.deploy(exchangeFactory.address, wEth.address);
//       await exchangeRouter.deployed();
//       displayResult("\nMy Router deployed at", exchangeRouter);
//     });

//   });

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