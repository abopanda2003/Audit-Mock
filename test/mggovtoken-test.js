const { expect } = require("chai");
const { ethers, getChainId } = require("hardhat");
const chalk = require('chalk');

let owner, user1, user2, user3;
let mgGovContract;
const privateKey = "1ba6c7cc75d518f067512b9d8973481e1075b59b5ee218e81ca96c03e4030c22";

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

    it("MGGovToken Deploy...", async function () {
        cyan(`\nDeploying MGGovToken Contract...`);
        const MockGovToken = await ethers.getContractFactory("MockGovToken");
        mgGovContract = await MockGovToken.deploy();
        await mgGovContract.connect(owner).deployed();    
        displayResult("\nGovernance token deployed at", mgGovContract);
        
        await expect(await mgGovContract.owner()).to.equal(owner.address);

        await mgGovContract.mintFunc(owner.address, ethers.utils.parseUnits("1000000", 18));
        console.log("the balance of owner: ", toAmount(await mgGovContract.balanceOf(owner.address)));

        let users = [user1.address, user2.address, user3.address, user4.address];
        let i=1;
        for(const user of users) {
            await mgGovContract.mintFunc(user, ethers.utils.parseUnits("10000", 18));
            console.log("the balance of user", i, ": ", toAmount(await mgGovContract.balanceOf(user)));

            const checkPoints = await mgGovContract.checkpoints(user, 1);
            console.log("the voting balance of user", i++, ": ", toAmount(checkPoints[1]));
        }

        const ts = await mgGovContract.totalSupply();
        console.log("total supply: ", toAmount(ts));
    });
    
    it("delegateBySig function test", async() => {
        let wallet = new ethers.Wallet(privateKey);
        const message = "Hello World";
        let flatSig = await wallet.signMessage(message);
        let sig = ethers.utils.splitSignature(flatSig);
        const nonce = await mgGovContract.nonces(wallet.address);
        const expiry = await mgGovContract.getCurrentTime();
        let tx = await mgGovContract.delegateBySig(
            wallet.address, nonce, expiry, sig.v, sig.r, sig.s 
        );
        await tx.wait();
        green("tested delegateBySig function");
    })

    it("delegate function test", async() => {
        const user1_balance = await mgGovContract.balanceOf(user1.address);
        let tx = await mgGovContract.connect(user1).delegate(user2.address);
        await tx.wait();        

        await expect(tx)
        .to.emit(mgGovContract, "DelegateChanged")
        .withArgs(user1.address, "0x0000000000000000000000000000000000000000", user2.address)
        .to.emit(mgGovContract, "DelegateVotesChanged")
        .withArgs(user2.address, 0, user1_balance);

        await expect(await mgGovContract.delegates(user1.address))
                .to.equal(user2.address);

        const checkPoints = await mgGovContract.checkpoints(user2.address, 0);
        console.log("the voting balance of user2: ", toAmount(checkPoints[1]));

        console.log("the balance of user1: ", toAmount(await mgGovContract.balanceOf(user1.address)));
    })

    it("voting amplification attack test", async() => {

    })
    
    it("voting displacement attack test", async() => {

    })

    it("redelegation failure test", async() => {

    })
  });
});