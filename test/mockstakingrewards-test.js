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
let smtcContract;
let busdContract;
let smartCompContract;
let smartFarmContract;
let smartArmyContract;
let smartLadderContract;
let goldenTreeContract;
let smartNobilityAchContract;
let smartOtherAchContract;
let routerInstance;
let smartBridge;
let initCodePairHash;
let enabledFactoryOption = false;
const upgrades = hre.upgrades;

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

const registerToLicense = async(smtTokenIns, smartArmyContract, wallet) => {
  cyan("============= Register Licenses =============");
  let userBalance = await smtTokenIns.balanceOf(wallet.address);
  userBalance = ethers.utils.formatEther(userBalance);
  const license = await smartArmyContract.licenseTypeOf(1);
  let price = ethers.utils.formatEther(license.price);
  if(userBalance < price) {        
    console.log("charge SMT token to your wallet!!!!");
    return;
  }

  let tx = await smartArmyContract.connect(wallet).registerLicense(
    1, wallet.address, "Arsenii", "https://t.me.Ivan"
  );
  await tx.wait();
  console.log("License register transaction:", tx.hash);

  tx = await smtTokenIns.connect(wallet).approve(
    smartArmyContract.address,
    ethers.utils.parseUnits(Number(price).toString(), 18)
  );
  await tx.wait();

  tx = await smartArmyContract.connect(wallet).activateLicense();
  await tx.wait();
  console.log("License Activate transaction: ", tx.hash);

}

const displayLicenseOf = async(smartArmyContract, userAddress) => {
  let userLic = await smartArmyContract.licenseOf(userAddress);
  console.log("----------- user license ---------------");
  console.log("owner: ", userLic.owner);
  console.log("level: ", userLic.level.toString());
  console.log("start at: ", userLic.startAt.toString());
  console.log("active at: ", userLic.activeAt.toString());
  console.log("expire at: ", userLic.expireAt.toString());
  console.log("lp locked: ", ethers.utils.formatEther(userLic.lpLocked.toString()));
  console.log("status: ", userLic.status);
}

const buyLicense = async(smtTokenIns, smartArmyContract, wallet, sponsor) => {
  cyan("============= Register Licenses =============");
  let userBalance = await smtTokenIns.balanceOf(wallet.address);
  userBalance = ethers.utils.formatEther(userBalance);

  const license = await smartArmyContract.licenseTypeOf(1);
  let price = ethers.utils.formatEther(license.price);
  
  if(userBalance < price) {        
    console.log("charge SMT token to your wallet!!!!");
    return;
  }

  let licId = await smartArmyContract.licenseIdOf(wallet.address);
  if(licId == 0) {
    let tx = await smartArmyContract.connect(wallet).registerLicense(
      1, sponsor.address, "Arsenii", "https://t.me.Ivan", "https://ipfs/2314341dwer242"
    );
    await tx.wait();
    console.log("License register transaction:", tx.hash);  
  } else {
    cyan(`Current user with license ${licId} was registered`);
    displayLicenseOf(smartArmyContract, wallet.address);  
  }

  let balance = await smtTokenIns.balanceOf(wallet.address);
  expect(parseInt(ethers.utils.formatEther(balance))).to.greaterThan(0);

  let tx = await smtTokenIns.connect(wallet).approve(
    smartArmyContract.address,
    ethers.utils.parseUnits(Number(price).toString(), 18)
  );
  await tx.wait();
  console.log("Activation approved transaction: ", tx.hash);

  tx = await smartArmyContract.connect(wallet).activateLicense();
  await tx.wait();
  console.log("License Activate transaction: ", tx.hash);
}

describe("Smtc Ecosystem Contracts Audit", () => {
  const { getContractFactory, getSigners } = ethers;

  beforeEach(async () => {
    [owner, user, anotherUser, farmRewardWallet, sponsor1, sponsor2] = await getSigners();
  });

  describe("Dex Engine Deploy", () => {

    it("Factory deploy", async function () {
      console.log("owner:", owner.address);
      console.log("user:", user.address);
      console.log("another user:", anotherUser.address);
      console.log("sponsor1:", sponsor1.address);
      console.log("sponsor2:", sponsor2.address);

      cyan(`\nDeploying Factory Contract...`);

      // const factoryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
      // if(enabledFactoryOption){
      const Factory = await ethers.getContractFactory("PancakeSwapFactory");      
      exchangeFactory = await Factory.deploy(owner.address);
      await exchangeFactory.deployed();
      initCodePairHash = await exchangeFactory.INIT_CODE_PAIR_HASH();
      console.log("INIT_CODE_PAIR_HASH: ", initCodePairHash);  
      // }
      // exchangeFactory = await ethers.getContractAt("PancakeSwapFactory", factoryAddress);
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

    it("BUSD Token Deploy...", async function () {
      cyan(`\nDeploying BUSD Contract...`);
      const BusdToken = await ethers.getContractFactory("BEP20Token");
      busdContract = await BusdToken.deploy();
      await busdContract.deployed();    
      displayResult("\nBUSD token deployed at", busdContract);
    });
  });
});