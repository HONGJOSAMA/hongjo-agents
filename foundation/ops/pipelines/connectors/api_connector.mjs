import {
  getDefaultDomainKey,
  getDefaultOrganizationId,
  loadConnectorMapping,
  loadSampleByEntity,
  pickField,
  toIsoTime,
  toNumberOrNull,
} from "./common.mjs";

const mapping = loadConnectorMapping();
const apiFields = mapping?.api?.fields || {};

function toObservationRecord(row, index) {
  const organizationId = pickField(row, apiFields.organizationId, getDefaultOrganizationId());
  const domainKey = pickField(row, apiFields.domainKey, getDefaultDomainKey());
  const id = pickField(row, apiFields.id, `api-obs-${String(index + 1).padStart(4, "0")}`);

  return {
    connector: "api",
    entityType: "Observation",
    id,
    organizationId,
    sourceType: pickField(row, apiFields.sourceType, "api"),
    sourceKey: pickField(row, apiFields.sourceKey, "external_api"),
    observedAt: toIsoTime(pickField(row, apiFields.observedAt, undefined)),
    domainKey,
    signalType: pickField(row, apiFields.signalType, "api_signal"),
    signalValue: pickField(row, apiFields.signalValue, ""),
    confidence: toNumberOrNull(pickField(row, apiFields.confidence, 0.7), 0.7),
    tags: Array.isArray(row.tags) ? row.tags : ["api-ingest"],
    piiFlag: Boolean(pickField(row, apiFields.piiFlag, false)),
  };
}

async function fetchApiRows() {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    return [];
  }

  const endpoint = process.env.API_ENDPOINT || "/observations";
  const url = new URL(endpoint, baseUrl).toString();
  const token = process.env.API_TOKEN;
  const timeoutMs = Number(process.env.API_TIMEOUT_MS || 15000);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`api request failed: ${res.status}`);
    }

    const body = await res.json();
    if (Array.isArray(body)) {
      return body;
    }
    if (Array.isArray(body.data)) {
      return body.data;
    }
    if (Array.isArray(body.items)) {
      return body.items;
    }
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function runApiConnector() {
  const liveRows = await fetchApiRows();
  if (liveRows.length > 0) {
    return liveRows.map(toObservationRecord);
  }

  const fallbackRows = loadSampleByEntity("Observation", 40);
  return fallbackRows.map((row) => ({ connector: "api", ...row }));
}
