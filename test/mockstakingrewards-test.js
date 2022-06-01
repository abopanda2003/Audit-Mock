const { expect } = require("chai");
const { ethers, getNamedAccounts, deployments } = require("hardhat");
const chalk = require('chalk');
const { deploy } = deployments;

// const uniswapRouterABI = require("../artifacts/contracts/interfaces/IUniswapRouter.sol/IUniswapV2Router02.json").abi;
const uniswapRouterABI = require("../artifacts/contracts/libs/dexRouter.sol/IPancakeSwapRouter.json").abi;
const uniswapPairABI = require("../artifacts/contracts/libs/dexfactory.sol/IPancakeSwapPair.json").abi;

let owner, user, anotherUser, farmRewardWallet, sponsor1, sponsor2;
let exchangeFactory;
let wEth;
let exchangeRouter;
let mockStakingRewards;
let mgGovContract;
let initCodePairHash;

function dim() {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.dim.call(chalk, ...arguments));
  }
}

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

const displayWalletBalances = async(tokenIns, bOwner, bAnother, bUser, bFarmingReward, bSponsor1, bSponsor2) => {

  cyan("**************************************");
  cyan("              Wallet Balances");
  cyan("**************************************");

  let count = 0;
  if(bOwner){
    let balance = await tokenIns.balanceOf(owner.address);
    console.log("owner balance:",
                ethers.utils.formatEther(balance.toString()));
    count++;
  }
  if(bAnother){
    let balance = await tokenIns.balanceOf(anotherUser.address);
    console.log("another user balance:",
                ethers.utils.formatEther(balance.toString()));
    count++;
  }
  if(bUser){
    let balance = await tokenIns.balanceOf(user.address);
    console.log("user balance:",
                ethers.utils.formatEther(balance.toString()));
    count++;
  }
  if(bFarmingReward){
    let balance = await tokenIns.balanceOf(farmRewardWallet.address);
    console.log("farming reward wallet balance:",
                ethers.utils.formatEther(balance.toString()));
    count++;
  }
  if(bSponsor1){
    let balance = await tokenIns.balanceOf(sponsor1.address);
    console.log("sponsor1 balance:",
                ethers.utils.formatEther(balance.toString()));
    count++;
  }
  if(bSponsor2){
    let balance = await tokenIns.balanceOf(sponsor2.address);
    console.log("sponsor2 balance:",
                ethers.utils.formatEther(balance.toString()));
    count++;
  }
  if(count > 0)
    green("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
};

const displayUserInfo = async(farmContract, wallet) => {
  let info = await farmContract.userInfoOf(wallet.address);
  cyan("-------------------------------------------");
  console.log("balance of wallet:", ethers.utils.formatEther(info.balance));
  console.log("rewards of wallet:", info.rewards.toString());
  console.log("reward per token paid of wallet:", info.rewardPerTokenPaid.toString());
  console.log("last updated time of wallet:", info.balance.toString());
}

const displayLiquidityPoolBalance = async(comment, poolInstance) => {
  let reservesPair = await poolInstance.getReserves();
  console.log(comment);
  let smtAmount = ethers.utils.formatEther(reservesPair.reserve0);
  let busdAmount = ethers.utils.formatEther(reservesPair.reserve1);
  console.log("SMT:", smtAmount);
  console.log("BUSD:", busdAmount);
  console.log("SMT Price: $", busdAmount/smtAmount);
}

const addLiquidityToPools = async(
  tokenA, tokenB,
  routerInstance, walletIns,
  smtAmount1, bnbAmount, 
  smtAmount2, busdAmount
) => {
  ///////////////////  SMT-BNB Add Liquidity /////////////////////
  let tx = await tokenA.connect(walletIns).approve(
    routerInstance.address,
    ethers.utils.parseUnits(Number(smtAmount1+100).toString(),18)
  );
  await tx.wait();

  console.log("approve tx: ", tx.hash);

  tx = await routerInstance.connect(walletIns).addLiquidityETH(
    tokenA.address,
    ethers.utils.parseUnits(Number(smtAmount1).toString(), 18),
    0,
    0,
    walletIns.address,
    "111111111111111111111",
    {value : ethers.utils.parseUnits(Number(bnbAmount).toString(), 18)}
  );
  await tx.wait();
  console.log("SMT-BNB add liquidity tx: ", tx.hash);

  ///////////////////  SMT-BUSD Add Liquidity /////////////////////

  tx = await tokenA.connect(walletIns).approve(
    routerInstance.address,
    ethers.utils.parseUnits(Number(smtAmount2+100).toString(), 18)
  );
  await tx.wait();

  tx = await tokenB.connect(walletIns).approve(
    routerInstance.address,
    ethers.utils.parseUnits(Number(busdAmount+100).toString(), 18)
  );
  await tx.wait();

  tx = await routerInstance.connect(walletIns).addLiquidity(
    tokenA.address,
    tokenB.address,
    ethers.utils.parseUnits(Number(smtAmount2).toString(), 18),
    ethers.utils.parseUnits(Number(busdAmount).toString(), 18),
    0,
    0,
    walletIns.address,
    "111111111111111111111"
  );
  await tx.wait();
  console.log("SMT-BUSD add liquidity tx: ", tx.hash);
}

const swapSMTForBNB = async(
  pairInstance,
  inputTokenIns, 
  wallet,
  routerInstance,
  swapAmount
) => {
      console.log("----------------------- Swap SMT For BNB ---------------------");
      await displayLiquidityPoolBalance("SMT-BNB Pool:", pairInstance);

      let balance = await ethers.provider.getBalance(wallet.address);
      console.log(">>> old balance: ", ethers.utils.formatEther(balance));

      let tx = await inputTokenIns.connect(wallet).approve(
          routerInstance.address,
          ethers.utils.parseUnits(Number(swapAmount+100).toString(), 18)
      );
      await tx.wait();
      let amountIn = ethers.utils.parseUnits(Number(swapAmount).toString(), 18);
      let wEth = await routerInstance.WETH();
      let amountsOut = await routerInstance.getAmountsOut(
        amountIn,
        [ inputTokenIns.address, wEth ]
      );
      console.log("excepted swap balance: ", ethers.utils.formatEther(amountsOut[1]));

      tx = await routerInstance.connect(wallet).swapExactTokensForETHSupportingFeeOnTransferTokens(
        amountIn, 0,
        [ inputTokenIns.address, wEth ],
        wallet.address,
        "990000000000000000000"
      );
      await tx.wait();
      balance = await ethers.provider.getBalance(wallet.address);
      console.log(">>> new balance: ", ethers.utils.formatEther(balance));
      await displayLiquidityPoolBalance("SMT-BNB Pool:", pairInstance);
}

const swapSMTForBUSD = async(
  pairInstance,
  inputTokenIns,
  outTokenIns,
  wallet,
  routerInstance,
  swapAmount
) => {
      console.log("----------------------- Swap SMT For BUSD ---------------------");
      await displayLiquidityPoolBalance("SMT-BUSD Pool:", pairInstance);

      let balance = await outTokenIns.balanceOf(wallet.address);
      console.log(">>> old balance by BUSD: ", ethers.utils.formatEther(balance));

      let tx = await inputTokenIns.connect(wallet).approve(
          routerInstance.address,
          ethers.utils.parseUnits(Number(swapAmount+100).toString(), 18)
      );
      await tx.wait();
      let amountIn = ethers.utils.parseUnits(Number(swapAmount).toString(), 18);
      let amountsOut = await routerInstance.getAmountsOut(
        amountIn,
        [
          inputTokenIns.address, 
          outTokenIns.address
        ]
      );
      console.log("excepted swap balance: ", ethers.utils.formatEther(amountsOut[1]));

      tx = await routerInstance.connect(wallet).swapExactTokensForTokensSupportingFeeOnTransferTokens(
        amountIn,
        0,
        [
          inputTokenIns.address,
          outTokenIns.address
        ],
        wallet.address,
        "99000000000000000000"
      );
      await tx.wait();

      balance = await outTokenIns.balanceOf(wallet.address);
      console.log(">>> new balance by BUSD: ", ethers.utils.formatEther(balance));
      await displayLiquidityPoolBalance("SMT-BUSD Pool:", pairInstance);
}

describe("Smtc Ecosystem Contracts Audit", () => {
  const { getContractFactory, getSigners } = ethers;

  beforeEach(async () => {
    [owner, user1, user2, user3, user4] = await getSigners();
  });

  describe("Dex Engine Deploy", () => {

    it("Factory deploy", async function () {
      console.log("owner:", owner.address);
      console.log("user1:", user1.address);
      console.log("user2:", user2.address);
      console.log("user3:", user3.address);
      console.log("user4:", user4.address);

      cyan(`\nDeploying Factory Contract...`);

      const Factory = await ethers.getContractFactory("PancakeSwapFactory");      
      exchangeFactory = await Factory.deploy(owner.address);
      await exchangeFactory.deployed();
      initCodePairHash = await exchangeFactory.INIT_CODE_PAIR_HASH();
      console.log("INIT_CODE_PAIR_HASH: ", initCodePairHash);  
      displayResult("\nMy Factory deployed at", exchangeFactory);
    });
  
    it("WETH deploy", async function () {
      cyan(`\nDeploying WETH Contract...`);
      const wETH = await ethers.getContractFactory("WETH");
      wEth = await wETH.deploy();
      await wEth.deployed();
      displayResult("\nMy WETH deployed at", wEth);
    });
    
    it("Router deploy", async function () {
      cyan(`\nDeploying Router Contract...`);
      const Router = await ethers.getContractFactory("PancakeSwapRouter");
      exchangeRouter = await Router.deploy(exchangeFactory.address, wEth.address);
      await exchangeRouter.deployed();
      displayResult("\nMy Router deployed at", exchangeRouter);
    });

  });

  describe("Main Contract Deploy", () => {

    it("MGGovToken contract deployed", async function () {
        cyan(`\nDeploying MGGovToken Contract...`);
        const MockGovToken = await ethers.getContractFactory("MockGovToken");
        mgGovContract = await MockGovToken.deploy();
        await mgGovContract.connect(owner).deployed();    
        displayResult("\nGovernance token deployed at", mgGovContract);
      });  

    it("MockStakingRewards contract deployed", async function () {
      cyan(`\nDeploying MockStakingRewards Contract...`);
    //   const MockStakingRewards = await ethers.getContractFactory("mockStakingRewards");
    //   mockStakingRewards = await MockStakingRewards.deploy();
    //   await mockStakingRewards.deployed();
    //   displayResult("\nMockStakingRewards contract deployed at", mockStakingRewards);
    });
  });
});