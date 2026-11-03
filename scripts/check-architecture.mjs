import { access, readFile } from "node:fs/promises";

const files = {
  server: "backend/src/server.js",
  pages: "frontend/src/pages.jsx",
  components: "frontend/src/components.jsx",
  app: "frontend/src/App.jsx",
  lazyRoutes: "frontend/src/app/routes/lazyRoutes.jsx",
  siteSettingsRoutes: "backend/src/siteSettingsRoutes.js",
  accessPolicy: "backend/src/core/auth/accessPolicy.js"
  ,api: "frontend/src/api.js"
  ,authContext: "frontend/src/AuthContext.jsx"
};

const source = Object.fromEntries(await Promise.all(
  Object.entries(files).map(async ([name, path]) => [name, await readFile(path, "utf8")])
));
const rootPackage = JSON.parse(await readFile("package.json", "utf8"));
const exists = async (path) => access(path).then(() => true).catch(() => false);

const failures = [];
const requireRule = (condition, message) => { if (!condition) failures.push(message); };
const lineCount = (value) => value.split(/\r?\n/).length;

requireRule(!/origin\s*:\s*["']\*["']/.test(source.server), "Wildcard realtime/HTTP CORS is forbidden.");
requireRule(!/customHeaderHtml|appendChild\(newScript\)|\.innerHTML\s*=/.test(source.app), "App shell must not execute database-provided HTML or scripts.");
requireRule(source.siteSettingsRoutes.includes("siteSettingsUpdateInput(req.body)"), "Site settings must use an explicit DTO allowlist.");
requireRule(source.lazyRoutes.includes('import("../../pages")'), "Large page modules must remain behind a lazy route boundary.");
requireRule(!/from\s+["']\.\/pages["']/.test(source.app), "App must not statically import the legacy pages module.");
requireRule(source.server.includes('from "./core/auth/accessPolicy.js"'), "Server authorization must use the centralized access policy.");
requireRule(!source.server.includes("const ROLE_LEVEL ="), "Role hierarchy must not be duplicated in the server composition root.");
requireRule(!/localStorage\.(getItem|setItem)\(["']iskcon_lms_token/.test(source.api + source.authContext), "Authentication tokens must not be stored in localStorage.");
requireRule(!/Allow passwordless email login/.test(source.server), "Passwordless email login is forbidden.");
requireRule(!/app\.use\(["']\/uploads["']\s*,\s*express\.static/.test(source.server), "The entire uploads tree must not be public.");

const routePattern = /app\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/g;
const routes = new Map();
for (const match of source.server.matchAll(routePattern)) {
  const key = `${match[1].toUpperCase()} ${match[2]}`;
  routes.set(key, (routes.get(key) || 0) + 1);
}
const duplicates = [...routes.entries()].filter(([, count]) => count > 1).map(([route]) => route);
requireRule(!duplicates.length, `Duplicate Express routes are forbidden: ${duplicates.join(", ")}`);
requireRule(
  Array.isArray(rootPackage.workspaces) && rootPackage.workspaces.includes("backend") && rootPackage.workspaces.includes("frontend"),
  "Root package.json must own both npm workspaces."
);
requireRule(!(await exists("backend/package-lock.json")), "Backend lockfile is forbidden; use the root workspace lockfile.");
requireRule(!(await exists("frontend/package-lock.json")), "Frontend lockfile is forbidden; use the root workspace lockfile.");

const legacyBudgets = { server: 8000, pages: 10300, components: 2200 };
for (const [name, budget] of Object.entries(legacyBudgets)) {
  requireRule(lineCount(source[name]) <= budget, `${files[name]} exceeded its ${budget}-line legacy budget; extract a feature module instead.`);
}

if (failures.length) {
  console.error("Architecture checks failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Architecture and security guardrails passed.");
