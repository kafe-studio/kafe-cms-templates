import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import kafecms, { local } from "kafecms/astro";
import { sqlite } from "kafecms/db";

export default defineConfig({
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		kafecms({
			database: sqlite({ url: "file:./data.db" }),
			storage: local({
				directory: "./uploads",
				baseUrl: "/kafecms/api/media/file",
			}),
		}),
	],
	devToolbar: { enabled: false },
});
