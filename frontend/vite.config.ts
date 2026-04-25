import path from "node:path";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, path.resolve(__dirname, "../"), "");

	return {
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		define: {
			"process.env.BASE_URL": JSON.stringify(env.BASE_URL || ""),
		},
		server: {
			proxy: {
				"/api": {
					target: env.BASE_URL || "http://localhost:5000",
					changeOrigin: true,
				},
			},
		},
	};
});
