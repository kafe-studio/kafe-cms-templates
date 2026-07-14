// Worker entry: Astro's fetch handler plus KafeCMS's scheduled() handler, which
// the Cron Trigger in wrangler.jsonc drives. PluginBridge is the sandbox
// Durable Object, re-exported here so its binding resolves.
export { default, PluginBridge } from "@kafe.studio/cloudflare/worker";
