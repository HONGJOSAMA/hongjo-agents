# Domain Agents V1

## Purpose
- provide a minimum executable skeleton for the initial five domain agents
- keep each domain agent independently runnable against normalized Phase 2 output

## Run
```bash
node agents/run_domain_agent.mjs macroeconomy
node agents/run_domain_agent.mjs policy_politics
node agents/run_domain_agent.mjs geopolitics_security
node agents/run_domain_agent.mjs supply_chain_trade
node agents/run_domain_agent.mjs cyber_information

node agents/run_all_domain_agents.mjs
```

## Outputs
- `foundation/evaluation/agents/*-agent-output.json`
- `foundation/evaluation/metrics/phase3-domain-agent-smoke.md`
- `foundation/evaluation/metrics/phase3-domain-agent-smoke.json`

## Current Scope
- deterministic heuristic prediction/hypothesis/evidence generation
- minimum 3 evidence records per domain
- intended as Phase 3 bootstrap before specialforce session/AAR adapters and meta agents
