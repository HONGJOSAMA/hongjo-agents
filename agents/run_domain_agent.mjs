#!/usr/bin/env node

import { runAgent as runMacroeconomy } from "./macroeconomy/agent.mjs";
import { runAgent as runPolicyPolitics } from "./policy_politics/agent.mjs";
import { runAgent as runGeopoliticsSecurity } from "./geopolitics_security/agent.mjs";
import { runAgent as runSupplyChainTrade } from "./supply_chain_trade/agent.mjs";
import { runAgent as runCyberInformation } from "./cyber_information/agent.mjs";

const registry = {
  macroeconomy: runMacroeconomy,
  policy_politics: runPolicyPolitics,
  geopolitics_security: runGeopoliticsSecurity,
  supply_chain_trade: runSupplyChainTrade,
  cyber_information: runCyberInformation,
};

const domainKey = process.argv[2];

if (!domainKey || !registry[domainKey]) {
  console.error(`unknown_domain:${domainKey || "missing"}`);
  console.error(`available_domains=${Object.keys(registry).join(",")}`);
  process.exit(1);
}

const result = await registry[domainKey]();
console.log(JSON.stringify(result, null, 2));
