#!/usr/bin/env node

import { domainRegistryMap } from "./common/registry.mjs";

const domainKey = process.argv[2];

if (!domainKey || !domainRegistryMap[domainKey]) {
  console.error(`unknown_domain:${domainKey || "missing"}`);
  console.error(`available_domains=${Object.keys(domainRegistryMap).join(",")}`);
  process.exit(1);
}

const result = await domainRegistryMap[domainKey].runAgent();
console.log(JSON.stringify(result, null, 2));
