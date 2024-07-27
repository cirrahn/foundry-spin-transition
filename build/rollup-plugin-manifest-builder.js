import fs from "fs";
import path from "path";

export class RollupManifestBuilder {
	static getPlugin (systemPath) {
		return {
			name: "buildManifest",

			generateBundle () {
				const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));

				const manifestJson = {
					"id": packageJson.name,
					"title": "Scene Spin Transition",
					"description": `Spin-transition your way between scenes!`,
					"version": packageJson.version,
					"authors": [
						{
							"name": "cirrahn",
							"url": "https://www.patreon.com/cirrahn",
							"discord": "cirrahn",
							"flags": {
								"patreon": "cirrahn",
								"github": "cirrahn",
							},
						},
					],
					"keywords": [
						"visuals",
					],
					"readme": "README.md",
					"license": "MIT",
					"manifest": `https://github.com/cirrahn/foundry-${packageJson.name}/releases/latest/download/module.json`,
					"download": `https://github.com/cirrahn/foundry-${packageJson.name}/releases/download/v${packageJson.version}/${packageJson.name}.zip`,
					"changelog": `https://raw.githubusercontent.com/cirrahn/foundry-${packageJson.name}/main/CHANGELOG.md`,

					"compatibility": {
						"minimum": "10",
						"verified": "12.330",
					},
					"esmodules": [
						"module.js",
					],
					"socket": true,
				};

				fs.mkdirSync(systemPath, {recursive: true});
				fs.writeFileSync(path.join(systemPath, "module.json"), JSON.stringify(manifestJson, null, "\t"), "utf-8");
			},
		};
	}
}
