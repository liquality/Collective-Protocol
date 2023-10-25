import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades';
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
  },
};

export default config;
