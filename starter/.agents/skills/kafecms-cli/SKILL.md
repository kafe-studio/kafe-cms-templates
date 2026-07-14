---
name: kafecms-cli
description: Use the KafeCMS CLI to manage content, schema, media, and more. Use this skill when you need to interact with a running KafeCMS instance from the command line — creating content, managing collections, uploading media, generating types, or scripting CMS operations.
---

# KafeCMS CLI

The KafeCMS CLI (`kafecms` or `ec`) manages KafeCMS CMS instances. Commands fall into two categories:

- **Local commands** — work directly on a SQLite file, no running server needed: `init`, `dev`, `seed`, `export-seed`, `auth secret`
- **Remote commands** — talk to a running KafeCMS instance via HTTP: `types`, `login`, `logout`, `whoami`, `content`, `schema`, `media`, `search`, `taxonomy`, `menu`

## Authentication

Remote commands resolve auth automatically:

1. `--token` flag
2. `KAFECMS_TOKEN` env var
3. Stored credentials from `kafecms login`
4. Dev bypass (localhost only — no token needed)

For local dev servers, just run the command — auth is handled automatically. For remote instances, run `kafecms login --url https://my-site.pages.dev` first.

## Custom Headers & Reverse Proxies

Sites behind Cloudflare Access or other reverse proxies need auth headers on every request. The CLI supports this via `--header` flags and environment variables.

### Service Tokens (Recommended for CI/Automation)

```bash
# Single header
npx kafecms login --url https://my-site.pages.dev \
  --header "CF-Access-Client-Id: xxx.access" \
  --header "CF-Access-Client-Secret: yyy"

# Short form
npx kafecms login -H "CF-Access-Client-Id: xxx" -H "CF-Access-Client-Secret: yyy"

# Via environment (newline-separated)
export KAFECMS_HEADERS="CF-Access-Client-Id: xxx
CF-Access-Client-Secret: yyy"
npx kafecms login --url https://my-site.pages.dev
```

Headers are persisted to `~/.config/kafecms/auth.json` after login, so subsequent commands inherit them automatically.

### Cloudflare Access Browser Flow

If you don't have service tokens and `cloudflared` is installed, the CLI will automatically:

1. Detect when Access blocks the request
2. Try to get a cached JWT via `cloudflared access token`
3. Fall back to `cloudflared access login` for browser-based auth

This works for interactive use but isn't suitable for CI. Use service tokens for automation.

### Generic Reverse Proxy Auth

The `--header` flag works with any auth scheme:

```bash
# Basic auth
npx kafecms login --url https://example.com -H "Authorization: Basic dXNlcjpwYXNz"

# Custom auth header
npx kafecms login --url https://example.com -H "X-API-Key: secret123"
```

## Quick Reference

### Database Setup

Migrations and seed application happen automatically inside the runtime — there's no separate init/seed step. Just start the dev server (or deploy) and the first request runs pending migrations and applies the bundled seed if the database is empty.

```bash
# Start dev server (runs migrations, applies seed on empty DB, starts Astro)
npx kafecms dev

# Start dev server and generate types from remote
npx kafecms dev --types

# Export an existing database as a seed file
# (the runtime auto-discovers .kafecms/seed.json on first boot;
# `mkdir -p` because the directory may not exist yet)
mkdir -p .kafecms
npx kafecms export-seed > .kafecms/seed.json
npx kafecms export-seed --with-content > .kafecms/seed.json
```

### Type Generation

```bash
# Generate types from local dev server
npx kafecms types

# Generate from remote
npx kafecms types --url https://my-site.pages.dev

# Custom output path
npx kafecms types --output src/types/cms.ts
```

Writes `.kafecms/types.ts` (TypeScript interfaces) and `.kafecms/schema.json`.

### Authentication

```bash
# Login (OAuth Device Flow)
npx kafecms login --url https://my-site.pages.dev

# Check current user
npx kafecms whoami

# Logout
npx kafecms logout

# Generate auth secret for deployment
npx kafecms auth secret
```

### Content CRUD

The CLI is designed for agents. Create and update auto-publish by default so agents get read-after-write consistency without managing drafts.

```bash
# List content
npx kafecms content list posts
npx kafecms content list posts --status published --limit 10

# Get a single item (Portable Text fields converted to markdown)
# Returns draft data if a pending draft exists
npx kafecms content get posts 01ABC123
npx kafecms content get posts 01ABC123 --raw        # skip PT->markdown conversion
npx kafecms content get posts 01ABC123 --published   # ignore pending drafts

# Create content (auto-publishes by default)
npx kafecms content create posts --data '{"title": "Hello", "body": "# World"}'
npx kafecms content create posts --file post.json --slug hello-world
npx kafecms content create posts --draft --data '...'  # keep as draft
cat post.json | npx kafecms content create posts --stdin

# Update (requires --rev from a prior get, auto-publishes by default)
npx kafecms content update posts 01ABC123 --rev MToyMDI2... --data '{"title": "Updated"}'
npx kafecms content update posts 01ABC123 --rev MToyMDI2... --draft --data '...'  # keep as draft

# Delete (soft delete)
npx kafecms content delete posts 01ABC123

# Lifecycle
npx kafecms content publish posts 01ABC123
npx kafecms content unpublish posts 01ABC123
npx kafecms content schedule posts 01ABC123 --at 2026-03-01T09:00:00Z
npx kafecms content restore posts 01ABC123
```

### Schema Management

```bash
# List collections
npx kafecms schema list

# Get collection with fields
npx kafecms schema get posts

# Create collection
npx kafecms schema create articles --label Articles --description "Blog articles"

# Delete collection
npx kafecms schema delete articles --force

# Add field
npx kafecms schema add-field posts body --type portableText --label "Body Content"
npx kafecms schema add-field posts featured --type boolean --required

# Remove field
npx kafecms schema remove-field posts featured
```

Field types: `string`, `text`, `number`, `integer`, `boolean`, `datetime`, `select`, `multiSelect`, `image`, `file`, `reference`, `portableText`, `json`, `slug`, `url`. See `FIELD_TYPE_TO_COLUMN` in `packages/core/src/schema/types.ts` for the authoritative list.

### Media

```bash
# List media
npx kafecms media list
npx kafecms media list --mime image/png

# Upload
npx kafecms media upload ./photo.jpg --alt "A sunset" --caption "Bristol, 2026"

# Get / delete
npx kafecms media get 01MEDIA123
npx kafecms media delete 01MEDIA123
```

### Search

```bash
npx kafecms search "hello world"
npx kafecms search "hello" --collection posts --limit 5
```

### Taxonomies

```bash
npx kafecms taxonomy list
npx kafecms taxonomy terms categories
npx kafecms taxonomy add-term categories --name "Tech" --slug tech
npx kafecms taxonomy add-term categories --name "Frontend" --parent 01PARENT123
```

### Menus

```bash
npx kafecms menu list
npx kafecms menu get primary
```

## Drafts and Publishing

The CLI auto-publishes on `create` and `update` by default. This means:

- **`create`** creates the item and immediately publishes it
- **`update`** updates the item and publishes if a draft revision was created
- **`get`** returns draft data if a pending draft exists (e.g. from the admin UI)

Use `--draft` on create/update to skip auto-publishing. Use `--published` on get to ignore pending drafts.

Collections that support revisions store edits as draft revisions. The CLI handles this transparently — agents don't need to know whether a collection uses revisions or not.

## JSON Output

All remote commands support `--json` for machine-readable output. It's auto-enabled when stdout is piped.

```bash
# Pipe to jq
npx kafecms content list posts --json | jq '.items[].slug'

# Use in scripts
ID=$(npx kafecms content create posts --data '{"title":"Hello"}' --json | jq -r '.id')
```

## Editing Flow

For details on how content editing works — Portable Text/markdown conversion, `_rev` tokens, and raw mode — see **[EDITING-FLOW.md](./EDITING-FLOW.md)**.
