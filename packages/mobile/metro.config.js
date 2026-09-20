const path = require("path");

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// モノレポ構成では Metro にワークスペースルートを教える必要がある。
// 手順は https://docs.expo.dev/guides/monorepos/ に準拠。
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// 上記 2 箇所だけを見るようにして、親ディレクトリを遡る解決を止める
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, {
  input: "./src/global.css",
});
