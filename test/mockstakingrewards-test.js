const { expect, use } = require("chai");
const { ethers } = require("hardhat");
const chalk = require('chalk');
const { BigNumber, constants: { MaxUint256, AddressZero } } = require("ethers");

const wethABI = require("../artifacts/contracts/libs/weth.sol/WETH.json").abi;
const uniswapRouterABI = require("../artifacts/contracts/libs/dexRouter.sol/IPancakeSwapRouter.json").abi;
const uniswapPairABI = require("../artifacts/contracts/libs/dexfactory.sol/IPancakeSwapPair.json").abi;

let owner, user1, user2, user3, user4, users;
let exchangeFactory;
let wEth;
let exchangeRouter;
let mockStakingRewards;
let mgGovToken;
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

const swapSMTForBNB = async(
  pairInstance,
  inputTokenIns, 
  wallet,
  exchangeRouter,
  swapAmount
) => {
      console.log("----------------------- Swap SMT For BNB ---------------------");
      await displayLiquidityPoolBalance("SMT-BNB Pool:", pairInstance);

      let balance = await ethers.provider.getBalance(wallet.address);
      console.log(">>> old balance: ", ethers.utils.formatEther(balance));

      let tx = await inputTokenIns.connect(wallet).approve(
          exchangeRouter.address,
          ethers.utils.parseUnits(Number(swapAmount+100).toString(), 18)
      );
      await tx.wait();
      let amountIn = ethers.utils.parseUnits(Number(swapAmount).toString(), 18);
      let wEth = await exchangeRouter.WETH();
      let amountsOut = await exchangeRouter.getAmountsOut(
        amountIn,
        [ inputTokenIns.address, wEth ]
      );
      console.log("excepted swap balance: ", ethers.utils.formatEther(amountsOut[1]));

      tx = await exchangeRouter.connect(wallet).swapExactTokensForETHSupportingFeeOnTransferTokens(
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

const ONE = ethers.BigNumber.from(1);
const TWO = ethers.BigNumber.from(2);

function sqrtBN(value) {
    x = ethers.BigNumber.from(value);
    let z = x.add(ONE).div(TWO);
    let y = x;
    while (z.sub(y).isNegative()) {
        y = z;
        z = x.div(z).add(z).div(TWO);
    }
    return y;
}

const toAmount = (amount) => {
    return ethers.utils.formatEther(amount);
}

const parseAmount = (amount) => {
    return ethers.utils.parseEther(amount.toString());
}

describe("Smtc Ecosystem Contracts Audit", () => {
  const { getContractFactory, getSigners } = ethers;

  beforeEach(async () => {
    [owner, user1, user2, user3, user4] = await getSigners();
    users = [user1, user2, user3, user4];
  });

  describe("Dex Engine Deploy", () => {

    it("Factory deploy", async function () {
      green(`owner: ${owner.address}`);
      let i=0;
      for( const user of users )
        console.log(`user${++i}: ${user.address}`);

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
        mgGovToken = await MockGovToken.deploy(exchangeRouter.address);
        await mgGovToken.connect(owner).deployed();    
        displayResult("\nGovernance token deployed at", mgGovToken);

        await expect(await mgGovToken._router()).to.equal(exchangeRouter.address);
        await expect(await mgGovToken.owner()).to.equal(owner.address);

        users.push(owner);
        let i=0;
        for(const user of users) {
            await mgGovToken.connect(owner).mintFunc(
                user.address,
                parseAmount(100000)
            );
            const balance = await mgGovToken.balanceOf(user.address);
            // console.log(`user${++i}: ${toAmount(balance)}`);
        }
        await mgGovToken.connect(owner).mintFunc(
            owner.address,
            parseAmount(10000000)
        );
    });  

    it("MockStakingRewards contract deployed", async function () {
      cyan(`\nDeploying MockStakingRewards Contract...`);
      let tokenAddr = await mgGovToken.address;
      let lpAddr = await mgGovToken._pairWeth();
      let blockNum = await ethers.provider.getBlockNumber();
      const MockStakingRewards = await ethers.getContractFactory("mockStakingRewards");
      mockStakingRewards = await MockStakingRewards.deploy(
        tokenAddr, lpAddr, blockNum
      );
      await mockStakingRewards.deployed();
      displayResult("\nMockStakingRewards contract deployed at", mockStakingRewards);
    });

    it("Add liquidity for MGGovToken", async() => {
        const pairLp = await mgGovToken._pairWeth();
        const pairContract = await ethers.getContractAt(uniswapPairABI, pairLp);
        const tokenAmount = parseAmount(5000);
        const ethAmount = parseAmount(10);
        const wethContract = new ethers.Contract(
          await exchangeRouter.WETH(), wethABI, owner
        );
        const MINIMUM_LIQUIDITY = BigNumber.from(10).pow(3);
        const addrToken0 = await pairContract.token0();
        users.push(owner);
        let i = 0;
        for( const user of users ){
            await expect(
                await mgGovToken.connect(user).approve(
                    exchangeRouter.address,
                    tokenAmount
                )
            ).to.emit(mgGovToken, "Approval")
            .withArgs(user.address, exchangeRouter.address, tokenAmount);
        
            let tx = await exchangeRouter.connect(user).addLiquidityETH(
              mgGovToken.address, parseAmount(5000), 0, 0, 
              user.address, "111111111111111111111",
              {value : ethAmount}
            );
            await expect(tx)
            .to.emit(mgGovToken, "Transfer")
            .withArgs(user.address, pairLp, tokenAmount)
            .to.emit(wethContract, "Deposit")
            .withArgs(exchangeRouter.address, ethAmount)
            .to.emit(wethContract, "Transfer")
            .withArgs(exchangeRouter.address, pairLp, ethAmount)
            .to.emit(pairContract, "Transfer")
            .withArgs(
              AddressZero, 
              user.address,
              i === 0 ? sqrtBN(tokenAmount.mul(ethAmount)).sub(MINIMUM_LIQUIDITY):
                        sqrtBN(tokenAmount.mul(ethAmount))
            )
            .to.emit(pairContract, 'Sync')
            .withArgs(
                addrToken0 === mgGovToken.address ? tokenAmount.mul(i+1) : ethAmount.mul(i+1),
                addrToken0 === mgGovToken.address ? ethAmount.mul(i+1) : tokenAmount.mul(i+1)
            )
            .to.emit(pairContract, 'Mint')
            .withArgs(
              exchangeRouter.address,
              addrToken0 === mgGovToken.address ? tokenAmount : ethAmount,
              addrToken0 === mgGovToken.address ? ethAmount : tokenAmount
            );
            const id = (i < 4)? `user${++i}`: "owner";
            console.log(`LP amount of ${id}: ${toAmount(await pairContract.balanceOf(user.address))}`);
        }
    });

    it("Deposit function test", async() => {
      const pairLp = await mgGovToken._pairWeth();
      const pairContract = await ethers.getContractAt(uniswapPairABI, pairLp);
      const depositAmount = parseAmount(50);
      let i = 0;
      for(const user of users) {
        await expect(
          await pairContract.connect(user).approve(mockStakingRewards.address, depositAmount)
        ).to.emit(pairContract, "Approval")
        .withArgs(user.address, mockStakingRewards.address, depositAmount);

        // await mockStakingRewards.connect(user).deposit(bal);
        await expect(await mockStakingRewards.connect(user).deposit(depositAmount))
        .to.emit(mockStakingRewards, "Deposit")
        .withArgs(user.address, depositAmount);
        
        const info = await mockStakingRewards.userInfo(user.address);
        await expect(info.amount).to.equal(depositAmount);
        console.log(`depositing LP amount of user${++i}: ${toAmount(depositAmount)}`);
      }
    })
  });
});