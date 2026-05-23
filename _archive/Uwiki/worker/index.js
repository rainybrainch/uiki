// Uwiki — Notion proxy worker.
// Deploy with: wrangler deploy
//
// Required secrets (set via `wrangler secret put`):
//   NOTION_TOKEN — your Notion Integration Internal Token
//
// Optional environment (in wrangler.toml [vars]):
//   ALLOWED_ORIGIN — frontend origin (e.g. "https://uwiki.app"). Defaults to "*".

const NOTION_API = "https://api.notion.com/v1/pages";
const NOTION_VERSION = "2022-06-28";

// Map a flat props bag → Notion `properties` shape.
// We treat the first text-y field as the database's title.
function propsToNotion(props) {
  const out = {};
  let titleAssigned = false;

  // Find title-worthy fallback (any string prop or the first non-null entry)
  const titleText =
    props.text || props.title || props.name ||
    Object.values(props).find((v) => typeof v === "string") ||
    "Entry";

  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    if (typeof v === "number") {
      out[k] = { number: v };
    } else if (typeof v === "boolean") {
      out[k] = { checkbox: v };
    } else {
      // Convert long strings to rich_text; short identifiers to select if shape suggests it.
      out[k] = { rich_text: [{ text: { content: String(v).slice(0, 2000) } }] };
    }
  }

  // Ensure a "title" property exists for Notion (DBs must have a title column).
  out.title = { title: [{ text: { content: String(titleText).slice(0, 200) } }] };
  return out;
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || "*";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(allowed) });
    }
    if (request.method !== "POST") {
      return new Response("method not allowed", { status: 405, headers: corsHeaders(allowed) });
    }

    let body;
    try { body = await request.json(); }
    catch { return new Response(JSON.stringify({ ok: false, reason: "bad json" }), {
      status: 400, headers: { ...corsHeaders(allowed), "Content-Type": "application/json" }
    }); }

    const { writes = [], dbIds = {} } = body;
    const token = env.NOTION_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ ok: false, reason: "NOTION_TOKEN not configured" }), {
        status: 500, headers: { ...corsHeaders(allowed), "Content-Type": "application/json" }
      });
    }

    const results = [];
    for (const w of writes) {
      const databaseId = dbIds[w.db];
      if (!databaseId) { results.push({ db: w.db, ok: false, reason: "no db id" }); continue; }

      try {
        const res = await fetch(NOTION_API, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            parent: { database_id: databaseId },
            properties: propsToNotion(w.props),
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          results.push({ db: w.db, ok: false, status: res.status, error: text.slice(0, 300) });
        } else {
          const data = await res.json();
          results.push({ db: w.db, ok: true, id: data.id });
        }
      } catch (e) {
        results.push({ db: w.db, ok: false, error: e.message || "fetch failed" });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders(allowed), "Content-Type": "application/json" }
    });
  },
};
