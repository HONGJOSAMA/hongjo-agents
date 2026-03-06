import { getDefaultDomainKey, getDefaultOrganizationId, loadSampleByEntity, toIsoTime, toNumberOrNull } from "./common.mjs";

function toObservationRecord(row, index) {
  const organizationId = row.organizationId || getDefaultOrganizationId();
  const domainKey = row.domainKey || getDefaultDomainKey();
  const id = row.id || `api-obs-${String(index + 1).padStart(4, "0")}`;

  return {
    connector: "api",
    entityType: "Observation",
    id,
    organizationId,
    sourceType: row.sourceType || "api",
    sourceKey: row.sourceKey || "external_api",
    observedAt: toIsoTime(row.observedAt || row.createdAt || row.timestamp),
    domainKey,
    signalType: row.signalType || row.metric || "api_signal",
    signalValue: row.signalValue ?? row.value ?? row.payload ?? "",
    confidence: toNumberOrNull(row.confidence, 0.7),
    tags: Array.isArray(row.tags) ? row.tags : ["api-ingest"],
    piiFlag: Boolean(row.piiFlag),
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
