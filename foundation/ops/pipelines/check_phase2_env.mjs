#!/usr/bin/env node

const requiredForLive = [
  "API_BASE_URL",
];

const optional = [
  "API_TOKEN",
  "API_ENDPOINT",
  "DOC_INPUT_DIR",
  "CSV_INPUT_DIR",
  "PIPELINE_ORGANIZATION_ID",
  "PIPELINE_DEFAULT_DOMAIN_KEY",
  "PIPELINE_MIN_INGEST_SUCCESS_RATE",
  "PIPELINE_MAX_MISSING_RATE",
  "PIPELINE_MAX_DUPLICATE_RATE",
];

const missingRequired = requiredForLive.filter((key) => !process.env[key]);

console.log("# Phase2 Env Check");
console.log(`required_missing=${missingRequired.length}`);
if (missingRequired.length > 0) {
  console.log(`missing_required=${missingRequired.join(",")}`);
}

optional.forEach((key) => {
  const value = process.env[key];
  if (value) {
    console.log(`${key}=set`);
  } else {
    console.log(`${key}=unset`);
  }
});

if (missingRequired.length > 0) {
  process.exitCode = 1;
}
