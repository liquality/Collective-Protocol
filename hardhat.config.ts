import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades';
import "@nomicfoundation/hardhat-verify";
import * as dotenv from 'dotenv';

dotenv.config()

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545/',
    },
    polygonMumbai: {
      url: process.env.MUMBAI_RPC,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
    },
    "optimismGoerli": {
      url:  process.env.OPTIMISM_GOERLI_RPC,//`https://opt-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      }
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
    }
  },  
  etherscan: {
    apiKey: (process.env.DEFAULT_NETWORK?.includes("base"))? process.env.ETHERSCAN_BASE_KEY : process.env.ETHERSCAN_OPTIMISM_KEY,
  },
};

export default config;
