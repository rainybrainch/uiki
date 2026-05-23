# Uwiki — Notion Proxy Worker

Cloudflare Worker that proxies write requests from the Uwiki frontend to the Notion API.

Browsers can't call Notion's API directly because of CORS. This worker holds the Notion Integration token and forwards your structured JSON writes to the right Notion databases.

## 1. Notion side — create an Integration

1. Visit [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations) → **+ New integration**
2. Name: `Uwiki`
3. Associated workspace: pick yours
4. **Internal Integration Token** をコピー (starts with `secret_...` or `ntn_...`)

## 2. Notion side — create 3 databases

Create three Notion databases (full-page or inline) in any workspace location:

### Reflection DB
| Property | Type |
|---|---|
| `title` | Title (default) |
| `text` | Text |
| `heat` | Number |
| `type` | Select (options: dream, grain, wishlist, roadmap) |
| `intensity` | Number |
| `phase` | Text |

### Status DB
| Property | Type |
|---|---|
| `title` | Title |
| `metric` | Text |
| `value` | Text |
| `unit` | Text |

### Environment DB
| Property | Type |
|---|---|
| `title` | Title |
| `key` | Text |
| `value` | Text |

For each database: click **…** → **Connections** → **Add connections** → select the Uwiki integration you created.

Copy each database ID from the URL:
`https://www.notion.so/abc123def456...?v=...` → `abc123def456...`

## 3. Deploy the worker

```bash
# Install Wrangler CLI (one-time)
npm install -g wrangler

# Log in to Cloudflare
wrangler login

# In this directory:
cd worker

# Set the Notion token as a secret
wrangler secret put NOTION_TOKEN
# (paste the token from step 1)

# Deploy
wrangler deploy
```

You'll get a URL like `https://uwiki-notion.your-name.workers.dev`.

## 4. Wire up in Uwiki

1. Open the Uwiki frontend
2. Top bar → **Notion 未接続** button → opens settings modal
3. Fill in:
   - **Proxy URL**: the worker URL from step 3
   - **Reflection / Status / Environment DB ID**: from step 2
4. **接続テスト** → 成功すれば **保存**

From this point on, every time you talk to the Uwiki AI, the structured writes are also forwarded to your Notion. You never have to open Notion.

## CORS / origin

By default the worker allows requests from the origin set in `wrangler.toml` (`ALLOWED_ORIGIN`). Update it for your deployment:

```toml
[vars]
ALLOWED_ORIGIN = "https://uwiki.app"
```

Then redeploy with `wrangler deploy`.

For local dev, set it to `"*"` temporarily or to `"http://localhost:8080"`.

## Pricing

Cloudflare Workers free plan: 100,000 requests/day. Uwiki at normal personal use is **way** under this — typical day is 10-50 writes. Free indefinitely for personal use.

## Security notes

- The `NOTION_TOKEN` is stored as a Cloudflare secret, never in the repo
- The token only accesses databases you explicitly shared with the integration
- The worker doesn't authenticate callers — anyone with the worker URL can call it. To protect, you can add a shared secret header:

```js
// In index.js, near the top of fetch():
if (request.headers.get("X-Uwiki-Secret") !== env.UWIKI_SECRET) {
  return new Response("unauthorized", { status: 401, headers: corsHeaders(allowed) });
}
```

Then `wrangler secret put UWIKI_SECRET`, and add the header in the frontend `pushToNotion` call. (Not required for personal use.)
