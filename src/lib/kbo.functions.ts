import { createServerFn } from "@tanstack/react-start";

/**
 * KBO / BCE Public Search Web Service — SOAP + WS-Security UsernameToken.
 *
 * Uses KBO-issued credentials against the configured Public Search endpoint:
 *   https://kbopub.economie.fgov.be/kbopubws180000/services/wsKBOPub
 *
 * Overridable via KBO_WS_ENDPOINT env var.
 *
 * Auth: WS-Security UsernameToken with PasswordDigest, Nonce, Created.
 *   PasswordDigest = Base64( SHA1( nonceBytes + createdBytes + passwordBytes ) )
 */

export type KboFunction = {
  role: string;
  firstName: string;
  lastName: string;
};

export type KboLookupResult = {
  enterpriseNumber: string;
  companyName: string;
  status: "active" | "inactive" | "unknown";
  statusRaw?: string;
  address?: string;
  functions: KboFunction[];
  source: "live" | "error";
  endpoint?: string;
  httpStatus?: number;
  requestXml?: string; // sanitized (password digest redacted)
  responseXml?: string; // truncated
  error?: string;
};

function redact(xml: string): string {
  return xml
    .replace(
      /(<[^>]*Username[^>]*>)([^<]+)(<\/[^>]*Username>)/gi,
      "$1[REDACTED_USERNAME]$3",
    )
    .replace(
      /(<[^>]*Password[^>]*>)([^<]+)(<\/[^>]*Password>)/gi,
      "$1[REDACTED_DIGEST]$3",
    );
}

function normalizeEnterprise(nr: string): string {
  return nr.replace(/[^0-9]/g, "");
}

function formatBceNumber(nr: string): string {
  // KBO expects the enterprise number as "NNNN.NNN.NNN" in many operations,
  // but the WS accepts both dotted and undotted. We send undotted for stability.
  return nr;
}

function buildEnvelope(opts: {
  username: string;
  passwordDigest: string;
  nonceB64: string;
  created: string;
  expires: string;
  requestId: string;
  enterpriseNumber: string;
  language: string;
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:mes="http://economie.fgov.be/kbopub/webservices/v1/messages"
                  xmlns:dat="http://economie.fgov.be/kbopub/webservices/v1/datamodel">
  <soapenv:Header>
    <wsse:Security soapenv:mustUnderstand="1"
                   xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
                   xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      <wsu:Timestamp>
        <wsu:Created>${opts.created}</wsu:Created>
        <wsu:Expires>${opts.expires}</wsu:Expires>
      </wsu:Timestamp>
      <wsse:UsernameToken>
        <wsse:Username>${opts.username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">${opts.passwordDigest}</wsse:Password>
        <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${opts.nonceB64}</wsse:Nonce>
        <wsu:Created>${opts.created}</wsu:Created>
      </wsse:UsernameToken>
    </wsse:Security>
    <mes:RequestContext>
      <mes:Id>${opts.requestId}</mes:Id>
      <mes:Language>${opts.language}</mes:Language>
    </mes:RequestContext>
  </soapenv:Header>
  <soapenv:Body>
    <mes:ReadEnterpriseRequest>
      <dat:EnterpriseNumber>${opts.enterpriseNumber}</dat:EnterpriseNumber>
    </mes:ReadEnterpriseRequest>
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

function makeRequestId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Grab first matching tag content, ignoring namespaces. */
function firstTag(xml: string, localName: string): string | undefined {
  const re = new RegExp(`<(?:[a-zA-Z0-9]+:)?${localName}\\b[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9]+:)?${localName}>`, "i");
  const m = xml.match(re);
  return m?.[1]?.trim();
}

function firstValueInBlock(xml: string, localName: string): string | undefined {
  const block = firstTag(xml, localName);
  return block ? firstTag(block, "Value") : undefined;
}

function classifyStatus(raw?: string): "active" | "inactive" | "unknown" {
  if (!raw) return "unknown";
  const s = raw.toLowerCase();
  // KBO status codes: "AC" active, "ST" stopped, others = inactive.
  if (s === "ac" || s.includes("actief") || s.includes("actif") || s.includes("active")) return "active";
  if (s === "st" || s.includes("stopgezet") || s.includes("arrêt") || s.includes("arret") || s.includes("stopped") || s.includes("cessé") || s.includes("cesse")) return "inactive";
  return "unknown";
}

function parseFunctions(xml: string): KboFunction[] {
  const out: KboFunction[] = [];
  const fnRegex = /<(?:[a-zA-Z0-9]+:)?Function\b[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9]+:)?Function>/gi;
  let m: RegExpExecArray | null;
  while ((m = fnRegex.exec(xml))) {
    const block = m[1];
    const role =
      firstValueInBlock(block, "Description") ??
      firstTag(block, "FunctionDescription") ??
      firstTag(block, "Role") ??
      firstTag(block, "Description") ??
      "Function";
    const first = firstTag(block, "FirstName") ?? firstTag(block, "GivenName") ?? "";
    const last = firstTag(block, "LastName") ?? firstTag(block, "FamilyName") ?? firstTag(block, "Surname") ?? firstTag(block, "Name") ?? "";
    if (first || last) out.push({ role, firstName: first, lastName: last });
  }
  return out;
}

function parseSoapFault(xml: string): string | undefined {
  const fault =
    firstTag(xml, "faultstring") ??
    firstTag(xml, "Reason") ??
    firstTag(xml, "Text");
  return fault;
}

export const lookupEnterprise = createServerFn({ method: "POST" })
  .inputValidator((d: { enterpriseNumber: string }) => ({
    enterpriseNumber: String(d.enterpriseNumber ?? "").trim(),
  }))
  .handler(async ({ data }): Promise<KboLookupResult> => {
    const endpoint =
      process.env.KBO_WS_ENDPOINT ??
      "https://kbopub.economie.fgov.be/kbopubws180000/services/wsKBOPub";
    const nr = normalizeEnterprise(data.enterpriseNumber);
    if (nr.length < 9) {
      return {
        enterpriseNumber: nr,
        companyName: "",
        status: "unknown",
        functions: [],
        source: "error",
        endpoint,
        error: "Enterprise number must be at least 9 digits.",
      };
    }

    const username = process.env.KBO_WS_USERNAME;
    const password = process.env.KBO_WS_PASSWORD;
    if (!username || !password) {
      return {
        enterpriseNumber: nr,
        companyName: "",
        status: "unknown",
        functions: [],
        source: "error",
        endpoint,
        error:
          "KBO credentials not configured. Set KBO_WS_USERNAME and KBO_WS_PASSWORD.",
      };
    }

    const nonce = crypto.getRandomValues(new Uint8Array(16));
    const now = new Date();
    const created = now.toISOString();
    const expires = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    let envelope = "";
    try {
      const passwordDigest = await computeDigest(nonce, created, password);
      envelope = buildEnvelope({
        username,
        passwordDigest,
        nonceB64: bytesToB64(nonce),
        created,
        expires,
        requestId: makeRequestId(),
        enterpriseNumber: formatBceNumber(nr),
        language: "fr",
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: "\"http://fgov.economie.be/kbopub/ReadEnterprise\"",
        },
        body: envelope,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      const text = await res.text();

      if (!res.ok) {
        const fault = parseSoapFault(text);
        return {
          enterpriseNumber: nr,
          companyName: "",
          status: "unknown",
          functions: [],
          source: "error",
          endpoint,
          httpStatus: res.status,
          requestXml: redact(envelope),
          responseXml: text.slice(0, 4000),
          error: `KBO HTTP ${res.status}${fault ? ` — ${fault}` : ""}`,
        };
      }

      const fault = parseSoapFault(text);
      if (fault) {
        return {
          enterpriseNumber: nr,
          companyName: "",
          status: "unknown",
          functions: [],
          source: "error",
          endpoint,
          httpStatus: res.status,
          requestXml: redact(envelope),
          responseXml: text.slice(0, 4000),
          error: `KBO SOAP fault: ${fault}`,
        };
      }

      const name =
        firstValueInBlock(text, "Denomination") ??
        firstTag(text, "EnterpriseName") ??
        firstTag(text, "Name") ??
        "";
      const statusBlock = firstTag(text, "Status");
      const statusRaw =
        (statusBlock ? firstTag(statusBlock, "Code") : undefined) ??
        (statusBlock ? firstValueInBlock(statusBlock, "Description") : undefined) ??
        firstTag(text, "StatusCode") ??
        firstTag(text, "EnterpriseStatus");
      const status = classifyStatus(statusRaw);
      const composedAddress =
        [
          firstValueInBlock(text, "Street"),
          firstTag(text, "HouseNumber"),
          firstTag(text, "Zipcode") ?? firstTag(text, "ZipCode"),
          firstValueInBlock(text, "Municipality"),
        ]
          .filter(Boolean)
          .join(" ") || undefined;
      const address = firstTag(text, "FormattedAddress") ?? composedAddress;

      return {
        enterpriseNumber: nr,
        companyName: name || "Unknown company",
        status,
        statusRaw,
        address,
        functions: parseFunctions(text),
        source: "live",
        endpoint,
        httpStatus: res.status,
        requestXml: redact(envelope),
        responseXml: text.slice(0, 4000),
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        enterpriseNumber: nr,
        companyName: "",
        status: "unknown",
        functions: [],
        source: "error",
        endpoint,
        requestXml: envelope ? redact(envelope) : undefined,
        error: `KBO call failed: ${msg}`,
      };
    }
  });
