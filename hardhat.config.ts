import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import "solidity-coverage";
import dotenv from "dotenv";

import "./tasks/accounts";
import "./tasks/FHECounter";

// Load .env file (local development) if present. Does NOT override existing env vars.
dotenv.config();

// Prefer environment variables (from .env or shell), fallback to hardhat vars, then defaults.
function getVar(name: string, defaultValue: string): string {
  return process.env[name] || vars.get(name, defaultValue);
}

const MNEMONIC = getVar("MNEMONIC", "test test test test test test test test test test test junk");
const PRIVATE_KEY = getVar("PRIVATE_KEY", "");
const INFURA_API_KEY = getVar("INFURA_API_KEY", "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz");
const SEPOLIA_RPC_URL = getVar("SEPOLIA_RPC_URL", "");

// PRIVATE_KEY takes precedence; fallback to mnemonic-based HD accounts
const sepoliaAccounts = PRIVATE_KEY ? [PRIVATE_KEY] : { mnemonic: MNEMONIC, path: "m/44'/60'/0'/0/", count: 10 };

const sepoliaUrl = SEPOLIA_RPC_URL || `https://sepolia.infura.io/v3/${INFURA_API_KEY}`;

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || vars.get("ETHERSCAN_API_KEY", ""),
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC,
      },
      chainId: 31337,
    },
    anvil: {
      accounts: {
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0/",
        count: 10,
      },
      chainId: 31337,
      url: "http://localhost:8545",
    },
    sepolia: {
      accounts: sepoliaAccounts,
      chainId: 11155111,
      url: sepoliaUrl,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
      evmVersion: "cancun",
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;
