import * as fs from "fs";
import * as path from "path";
import {getBuildPath} from "./foundry-path.js";
import {RollupManifestBuilder} from "./build/rollup-plugin-manifest-builder.js";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));

const systemPath = getBuildPath(packageJson.name);

console.log(`Bundling to ${systemPath}`);

export default {
	input: ["module/js/SpinTransition.js"],
	output: {
		file: path.join(systemPath, "module.js"),
	},
	plugins: [
		RollupManifestBuilder.getPlugin(systemPath),
	],
};
