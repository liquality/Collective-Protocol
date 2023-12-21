import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades';
import "@nomicfoundation/hardhat-verify";
import "hardhat-tracer";
import * as dotenv from 'dotenv';

dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      }
    },
    compilers: [
      {
        version: "0.8.20",
      },
      {version: "0.8.12"},
    ]
  },
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545/',
    },
    hardhat: {
      forking: {
        url: process.env.MUMBAI_RPC as string,
      },
    },
    polygonMumbai: {
      url: process.env.MUMBAI_RPC,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      }
    },
    "optimismGoerli": {
      url:  process.env.OPTIMISM_GOERLI_RPC,//`https://opt-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
      chainId: 80001
    },
    "optimism": {
      url:  process.env.OPTIMISM_RPC,//`https://opt-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      }
    },
    "zoraGoerli" : {
      url: process.env.ZORA_GOERLI_RPC,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      }
    },
    "baseGoerli" : {
      url: process.env.BASE_GOERLI_RPC,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
    },
    "base" : {
      url: process.env.BASE_RPC,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      }
    },
    "arbitrumTestnet" : {
      url: process.env.ARBITRUM_TESTNET_RPC,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      }
    },
    "arbitrum" : {
      url: process.env.ARBITRUM_RPC,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      }
    },
    "sepolia" : {
      url: process.env.SEPOLIA_RPC,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
    },
    "goerli" : {
      url: process.env.GOERLI_RPC,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
    },
  },  
  etherscan: {
    apiKey: {
      base: process.env.ETHERSCAN_BASE_KEY as string,
      optimism: process.env.ETHERSCAN_OPTIMISM_KEY as string,
      arbitrumOne : process.env.ETHERSCAN_ARBITRUM_KEY as string,
      polygonMumbai: process.env.ETHERSCAN_MUMBAI_KEY as string,
      sepolia: process.env.ETHERSCAN_SEPOLIA_KEY as string,
    }
  },
  tracer: {
    tasks: ["deploy", "mycooltask"],
  },
  
};

// task('customTask', 'Description of your custom task').setAction(async (_, hre) => {
//   // Your task logic here
//   console.log('Running custom task');
// });

export default config;
