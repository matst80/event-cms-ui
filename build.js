const { build } = require("esbuild");
const { solidPlugin } = require("esbuild-plugin-solid");

build({
	entryPoints: ["src/index.tsx"],
	bundle: true,
	watch: true,
	outfile: "www/main.js",
	minify: true,
	loader: {
		".svg": "dataurl",
	},
	logLevel: "info",
	plugins: [solidPlugin()],
}).catch(() => process.exit(1));
