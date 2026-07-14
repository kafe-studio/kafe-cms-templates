---
name: building-kafecms-site
description: Build and customize KafeCMS CMS sites on Astro. Use when creating pages, defining collections, writing seed files, querying content, rendering Portable Text, setting up menus/taxonomies/widgets, configuring deployment, or any task involving an KafeCMS-powered Astro site. Assumes basic Astro knowledge but provides all KafeCMS-specific patterns.
---

# Building an KafeCMS Site

KafeCMS is a CMS built on Astro. It stores schema in the database (not in code), serves content via live content collections, and provides a full admin UI at `/kafecms/admin`. Sites are standard Astro projects with the `kafecms` integration.

## Common Gotchas

These are the things that silently break sites. Know them before you start.

1. **Image fields are objects, not strings.** `post.data.featured_image` is `{ id, src, alt }`. Writing `<img src={post.data.featured_image} />` renders `[object Object]`. Use `<Image image={post.data.featured_image} />` from `"kafecms/ui"`.

2. **`entry.id` vs `entry.data.id` are different things.** `entry.id` is the slug (use in URLs). `entry.data.id` is the database ULID (use for `getEntryTerms`, `Comments`, and other API calls that need the real ID). Mixing them up causes silent empty results.

3. **Taxonomy names must match the seed exactly.** If your seed defines `"name": "category"`, you must query `getTerm("category", slug)` -- not `"categories"`. Wrong name = empty results, no error.

4. **Always pass `cacheHint` to `Astro.cache.set()`.** Every query returns a `cacheHint`. Call `Astro.cache.set(cacheHint)` on every page that queries content, or cache invalidation won't work when editors publish changes.

5. **No `getStaticPaths` for CMS content.** KafeCMS content is dynamic. Pages must be server-rendered (`output: "server"` in `astro.config.mjs`).

## File Structure

Every KafeCMS site has these key files:

```
my-site/
├── astro.config.mjs          # Astro config with kafecms() integration
├── src/
│   ├── live.config.ts         # KafeCMS loader registration (boilerplate)
│   ├── pages/                 # Astro pages (all server-rendered)
│   ├── layouts/               # Layout components
│   └── components/            # Reusable components
├── seed/
│   └── seed.json              # Schema + demo content
├── kafecms-env.d.ts          # Generated types (from `kafecms types`)
└── package.json
```

## Workflow

### 1. Configure the project

Read **[references/configuration.md](references/configuration.md)** for `astro.config.mjs`, `live.config.ts`, deployment targets (Node vs Cloudflare), and type generation.

### 2. Design the schema

Read **[references/schema-and-seed.md](references/schema-and-seed.md)** for collection definitions, field types, taxonomies, menus, widget areas, sections, bylines, and the complete seed file format.

### 3. Build the pages

Read **[references/querying-and-rendering.md](references/querying-and-rendering.md)** for content queries, Portable Text rendering, the Image component, visual editing attributes, caching, and common page patterns (list, detail, taxonomy archive, RSS, search, 404).

### 4. Wire up site features

Read **[references/site-features.md](references/site-features.md)** for site settings, navigation menus, taxonomies, widget areas, search, SEO meta, comments, and page contributions.

### 5. Create the seed file

Write `seed/seed.json` with collections, fields, taxonomies, menus, widgets, and sample content.

### 6. Run and verify

```bash
npx kafecms dev          # Start dev server (runs migrations + seeds, and generates types)
```

The admin UI is at `http://localhost:4321/kafecms/admin`.

## Quick API Cheat Sheet

```typescript
// Content (entries have .data.byline and .data.bylines eagerly loaded)
import { getKafeCMSCollection, getKafeCMSEntry } from "kafecms";
const { entries, nextCursor, cacheHint } = await getKafeCMSCollection("posts", {
	limit: 10,
	cursor,
	orderBy: { published_at: "desc" },
});
const { entry: post, cacheHint } = await getKafeCMSEntry("posts", slug);

// Site features
import {
	getSiteSettings,
	getMenu,
	getTaxonomyTerms,
	getTerm,
	getEntryTerms,
	getEntriesByTerm,
	getWidgetArea,
	search,
	getSection,
	getSeoMeta,
} from "kafecms";

// Bylines (standalone queries -- usually not needed since entries have bylines attached)
import { getByline, getBylineBySlug } from "kafecms";

// UI components
import {
	PortableText,
	Image,
	Comments,
	CommentForm,
	WidgetArea,
	KafeCMSHead,
	KafeCMSBodyStart,
	KafeCMSBodyEnd,
} from "kafecms/ui";
import LiveSearch from "kafecms/ui/search";

// Page context (for plugin contributions)
import { createPublicPageContext } from "kafecms/page";
```

## Plugins

KafeCMS supports plugins for extending the CMS with hooks, storage, settings, admin UI, API routes, and custom Portable Text block types. Consider a plugin when you need to:

- React to content lifecycle events (e.g., send a notification on publish, sync to an external service)
- Add custom admin pages or dashboard widgets
- Add custom block types to the Portable Text editor (e.g., embedded maps, code playgrounds, CTAs)
- Provide a reusable service (e.g., analytics, forms, comments via a third-party provider)

Plugins are registered in `astro.config.mjs`:

```javascript
kafecms({
	database: sqlite({ url: "file:./data.db" }),
	storage: local({ directory: "./uploads", baseUrl: "/kafecms/api/media/file" }),
	plugins: [myPlugin()],
}),
```

**To build a plugin, load the `creating-plugins` skill** (in `.agents/skills/creating-plugins/`). It covers plugin anatomy, hooks, storage, admin UI, API routes, Portable Text blocks, capabilities, and the full `definePlugin()` API.

## Reference Documents

| File                                                                         | Contents                                                            |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [references/configuration.md](references/configuration.md)                   | Project setup, astro.config, live.config, deployment, types         |
| [references/schema-and-seed.md](references/schema-and-seed.md)               | Collections, fields, taxonomies, menus, widgets, seed format        |
| [references/querying-and-rendering.md](references/querying-and-rendering.md) | Content APIs, PortableText, Image, caching, page patterns           |
| [references/site-features.md](references/site-features.md)                   | Settings, menus, widgets, search, SEO, comments, page contributions |
