import { createServerFn } from "@tanstack/react-start";

/**
 * KBO / BCE Public Search Web Service — SOAP + WS-Security UsernameToken.
 *
 * POC notes:
 *  - Test endpoint per Smals cookbook (ECB Public Search WS, test env).
 *  - Auth = WS-Security UsernameToken with PasswordDigest, Nonce, Created.
 *  - PasswordDigest = Base64( SHA1( nonceBytes + createdBytes + passwordBytes ) )
 *  - Credentials read from env inside handler (never at module scope).
 *  - If the KBO test endpoint is unreachable from this sandbox, we fall back
 *    to a deterministic mock so the UI flow stays demonstrable.
 */

const KBO_ENDPOINT =
  process.env.KBO_WS_ENDPOINT ??
  "https://kbopub.economie.fgov.be/kbo-open-data/services/ws";

export type KboFunction = {
  role: string;
  firstName: string;
  lastName: string;
};

export type KboLookupResult = {
  enterpriseNumber: string;
  companyName: string;
  status: "active" | "inactive" | "unknown";
  address?: string;
  functions: KboFunction[];
  source: "live" | "mock";
  endpoint?: string;
  requestXml?: string; // sanitized (password digest redacted)
  responseXml?: string; // truncated
  error?: string;
};

function redact(xml: string): string {
  return xml.replace(
    /(<wsse:Password[^>]*>)([^<]+)(<\/wsse:Password>)/i,
    "$1[REDACTED_DIGEST]$3",
  );
}

function normalizeEnterprise(nr: string): string {
  return nr.replace(/[^0-9]/g, "");
}

function buildEnvelope(opts: {
  username: string;
  passwordDigest: string;
  nonceB64: string;
  created: string;
  enterpriseNumber: string;
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ws="http://economie.fgov.be/kbopub/webservices/v1">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
                   xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${opts.username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">${opts.passwordDigest}</wsse:Password>
        <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${opts.nonceB64}</wsse:Nonce>
        <wsu:Created>${opts.created}</wsu:Created>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ws:ReadEnterpriseRequest>
      <ws:EnterpriseNumber>${opts.enterpriseNumber}</ws:EnterpriseNumber>
    </ws:ReadEnterpriseRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
}

async function computeDigest(nonce: Uint8Array, created: string, password: string) {
  const enc = new TextEncoder();
  const createdBytes = enc.encode(created);
  const passwordBytes = enc.encode(password);
  const combined = new Uint8Array(nonce.length + createdBytes.length + passwordBytes.length);
  combined.set(nonce, 0);
  combined.set(createdBytes, nonce.length);
  combined.set(passwordBytes, nonce.length + createdBytes.length);
  const hash = await crypto.subtle.digest("SHA-1", combined);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

function bytesToB64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function parseResponse(xml: string, enterpriseNumber: string): KboLookupResult {
  const nameMatch =
    xml.match(/<[^>]*Denomination[^>]*>([^<]+)<\/[^>]*Denomination>/i) ??
    xml.match(/<[^>]*Name[^>]*>([^<]+)<\/[^>]*Name>/i);
  const statusMatch = xml.match(/<[^>]*Status[^>]*>([^<]+)<\/[^>]*Status>/i);
  const status = statusMatch?.[1]?.toLowerCase().includes("act") ? "active" : "inactive";
  const functions: KboFunction[] = [];
  const fnRegex = /<[^>]*Function[^>]*>([\s\S]*?)<\/[^>]*Function>/gi;
  let m: RegExpExecArray | null;
  while ((m = fnRegex.exec(xml))) {
    const block = m[1];
    const role = block.match(/<[^>]*Role[^>]*>([^<]+)</i)?.[1] ?? "Function";
    const first = block.match(/<[^>]*FirstName[^>]*>([^<]+)</i)?.[1] ?? "";
    const last = block.match(/<[^>]*LastName[^>]*>([^<]+)</i)?.[1] ?? "";
    if (first || last) functions.push({ role, firstName: first, lastName: last });
  }
  return {
    enterpriseNumber,
    companyName: nameMatch?.[1] ?? "Unknown company",
    status,
    functions,
    source: "live",
  };
}

function parseResponseWithMeta(xml: string, enterpriseNumber: string, requestXml: string): KboLookupResult {
  const base = parseResponse(xml, enterpriseNumber);
  return { ...base, endpoint: KBO_ENDPOINT, requestXml: redact(requestXml), responseXml: xml.slice(0, 4000) };
}

function mockResult(enterpriseNumber: string, reason: string, requestXml?: string): KboLookupResult {
  const clean = normalizeEnterprise(enterpriseNumber);
  const inactive = clean.endsWith("0000");
  return {
    enterpriseNumber: clean,
    companyName: "NIMBUS COFFEE BVBA",
    status: inactive ? "inactive" : "active",
    address: "Rue de la Loi 16, 1000 Bruxelles",
    functions: [
      { role: "Zaakvoerder", firstName: "Jan", lastName: "Peeters" },
      { role: "Bestuurder", firstName: "Marie", lastName: "Dubois" },
      { role: "Gedelegeerd bestuurder", firstName: "Sophie", lastName: "Van den Berg" },
    ],
    source: "mock",
    endpoint: KBO_ENDPOINT,
    requestXml: requestXml ? redact(requestXml) : undefined,
    error: reason,
  };
}

export const lookupEnterprise = createServerFn({ method: "POST" })
  .inputValidator((d: { enterpriseNumber: string }) => ({
    enterpriseNumber: String(d.enterpriseNumber ?? "").trim(),
  }))
  .handler(async ({ data }): Promise<KboLookupResult> => {
    const nr = normalizeEnterprise(data.enterpriseNumber);
    if (nr.length < 9) {
      return {
        enterpriseNumber: nr,
        companyName: "",
        status: "unknown",
        functions: [],
        source: "mock",
        error: "Enterprise number must be at least 9 digits.",
      };
    }

    const username = process.env.KBO_WS_USERNAME;
    const password = process.env.KBO_WS_PASSWORD;
    if (!username || !password) {
      return mockResult(nr, "KBO credentials not configured — using mock data.");
    }

    try {
      const nonce = crypto.getRandomValues(new Uint8Array(16));
      const created = new Date().toISOString();
      const passwordDigest = await computeDigest(nonce, created, password);
      const envelope = buildEnvelope({
        username,
        passwordDigest,
        nonceB64: bytesToB64(nonce),
        created,
        enterpriseNumber: nr,
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(KBO_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: "\"ReadEnterprise\"",
        },
        body: envelope,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      const text = await res.text();
      if (!res.ok) {
        return mockResult(nr, `KBO HTTP ${res.status} — falling back to mock. ${text.slice(0, 200)}`);
      }
      return parseResponse(text, nr);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return mockResult(nr, `KBO call failed (${msg}) — falling back to mock.`);
    }
  });
