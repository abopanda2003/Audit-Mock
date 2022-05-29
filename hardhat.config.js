require('hardhat-deploy');
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");

const projectId = "d0fb6991f2531e92d0b3bf75";

const privateKey = "441f9868114e069248d1e6d22b3db155629b964584e36b0a8469a545ffa47c93";
const privateKey2 = "43fc6f8e12b711efbc1355b630746179275862afc3ae67c365d2a7e663b1e160";
const privateKey3 = "1ba6c7cc75d518f067512b9d8973481e1075b59b5ee218e81ca96c03e4030c22";
const apiKeyForEtherscan = "AB4XPH3MTUIFSG8CM14SEF5D7BH84T1XUX";
const optimizerEnabled = true;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  abiExporter: {
    path: './abis',
    clear: true,
    flat: true,
  },
  etherscan: {
    apiKey: apiKeyForEtherscan,
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
    enabled: process.env.REPORT_GAS ? true : false,
  },
  mocha: {
    timeout: 30000,
  },
  namedAccounts: {
    deployer: ''
  },
  defaultNetwork: "hardhat",

  networks: {
    hardhat: {
      chainId: 1337, //bsctestnet
      allowUnlimitedContractSize: true
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    polygonmainnet: {
      url: `https://speedy-nodes-nyc.moralis.io/${projectId}/polygon/mainnet`,
      accounts: [privateKey, privateKey2, privateKey3]
    },
    mumbai: {
      url: `https://speedy-nodes-nyc.moralis.io/${projectId}/polygon/mumbai`,
      accounts: [privateKey, privateKey2, privateKey3]
    },
    ethermainnet: {
      url: `https://speedy-nodes-nyc.moralis.io/${projectId}/eth/mainnet`,
      accounts: [privateKey, privateKey2, privateKey3]
    },
    kovan: {
      url: `https://speedy-nodes-nyc.moralis.io/${projectId}/eth/kovan`,
      accounts: [privateKey, privateKey2, privateKey3]
    },
    rinkeby: {
      url: `https://speedy-nodes-nyc.moralis.io/${projectId}/eth/rinkeby`,
      accounts: [privateKey, privateKey2, privateKey3]
    },
    bscmainnet: {
      url: `https://speedy-nodes-nyc.moralis.io/${projectId}/bsc/mainnet`,
      accounts: [privateKey, privateKey2, privateKey3]
    },
    fantom: {
      url: "https://rpc.ftm.tools/",
      accounts: [privateKey, privateKey2, privateKey3]
    },
    fantomtestnet: {
      url: "https://rpc.testnet.fantom.network",
      accounts: [privateKey, privateKey2, privateKey3]
    },
    bsctestnet: {
      url: `https://speedy-nodes-nyc.moralis.io/${projectId}/bsc/testnet`,
      accounts: [privateKey, privateKey2, privateKey3]
    }
  },
  solidity: {
    compilers: [
      {
        version: '0.8.10',
        settings: {
          optimizer: {
            enabled: optimizerEnabled,
            runs: 1,
          },
          evmVersion: 'berlin',
        }
      },
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: optimizerEnabled,
            runs: 1,
          },
          evmVersion: 'berlin',
        }
      },
      {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: optimizerEnabled,
            runs: 1,
          },
          evmVersion: 'berlin',
        }
      },
      {
        version: '0.5.16',
        settings: {
          optimizer: {
            enabled: optimizerEnabled,
            runs: 1,
          },
          evmVersion: 'berlin',
        }
      }
    ],
  },
}

