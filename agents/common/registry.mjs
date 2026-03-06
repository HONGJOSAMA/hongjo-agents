#!/usr/bin/env node

import path from "node:path";
import { runAgent as runMacroeconomy } from "../macroeconomy/agent.mjs";
import { runAgent as runPolicyPolitics } from "../policy_politics/agent.mjs";
import { runAgent as runGeopoliticsSecurity } from "../geopolitics_security/agent.mjs";
import { runAgent as runSupplyChainTrade } from "../supply_chain_trade/agent.mjs";
import { runAgent as runCyberInformation } from "../cyber_information/agent.mjs";

const ROOT_DIR = process.cwd();

export const domainRegistry = [
  {
    domainKey: "macroeconomy",
    runAgent: runMacroeconomy,
    contractPath: path.resolve(ROOT_DIR, "agents/macroeconomy/contract.json"),
  },
  {
    domainKey: "policy_politics",
    runAgent: runPolicyPolitics,
    contractPath: path.resolve(ROOT_DIR, "agents/policy_politics/contract.json"),
  },
  {
    domainKey: "geopolitics_security",
    runAgent: runGeopoliticsSecurity,
    contractPath: path.resolve(ROOT_DIR, "agents/geopolitics_security/contract.json"),
  },
  {
    domainKey: "supply_chain_trade",
    runAgent: runSupplyChainTrade,
    contractPath: path.resolve(ROOT_DIR, "agents/supply_chain_trade/contract.json"),
  },
  {
    domainKey: "cyber_information",
    runAgent: runCyberInformation,
    contractPath: path.resolve(ROOT_DIR, "agents/cyber_information/contract.json"),
  },
];

export const domainRegistryMap = Object.fromEntries(
  domainRegistry.map((entry) => [entry.domainKey, entry]),
);
