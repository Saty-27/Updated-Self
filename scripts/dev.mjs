import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import net from "node:net";

const localBackend = !process.argv.includes("--external");
const npmCommand = "npm";

const isPortAvailable = (port) => new Promise((resolve) => {
  if (process.platform === "win32") {
    try {
      const listeners = execFileSync("netstat", ["-ano", "-p", "tcp"], { encoding: "utf8", windowsHide: true });
      const occupied = listeners.split(/\r?\n/).some((line) => line.includes("LISTENING") && new RegExp(`[:.]${port}\\s`).test(line));
      resolve(!occupied);
      return;
    } catch {
      // Fall through to the portable bind probe.
    }
  }
  const probe = net.createServer();
  probe.once("error", () => resolve(false));
  probe.once("listening", () => probe.close(() => resolve(true)));
  /* Match Vite's default bind behavior. Probing only 127.0.0.1 can miss
     a process listening on IPv6 localhost (::1). */
  probe.listen(port);
});
const findPort = async (start, attempts = 20) => {
  for (let port = start; port < start + attempts; port += 1) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available development port found between ${start} and ${start + attempts - 1}.`);
};

const frontendPort = await findPort(Number(process.env.FRONTEND_PORT || 5173));
const backendPort = await findPort(Number(process.env.BACKEND_PORT || process.env.PORT || 5055));
const frontendOrigins = `http://localhost:${frontendPort},http://127.0.0.1:${frontendPort}`;
console.log(`[dev] Local database: ${localBackend ? "in-memory MongoDB" : "external MONGO_URI"}`);
console.log(`[dev] Frontend: http://localhost:${frontendPort}`);
console.log(`[dev] API: http://127.0.0.1:${backendPort}/api`);

const services = [
  {
    name: "backend",
    color: "\u001b[36m",
    args: ["run", localBackend ? "dev:local" : "dev", "--workspace", "backend"]
  },
  {
    name: "frontend",
    color: "\u001b[35m",
    args: ["run", "dev", "--workspace", "frontend", "--", "--host", "127.0.0.1", "--port", String(frontendPort), "--strictPort"]
  }
];

const children = new Set();
let stopping = false;

const writeLines = (stream, prefix, color) => {
  let buffered = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    buffered += chunk;
    const lines = buffered.split(/\r?\n/);
    buffered = lines.pop() || "";
    for (const line of lines) process.stdout.write(`${color}[${prefix}]\u001b[0m ${line}\n`);
  });
  stream.on("end", () => {
    if (buffered) process.stdout.write(`${color}[${prefix}]\u001b[0m ${buffered}\n`);
  });
};

const stopAll = () => {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
};

for (const service of services) {
  const child = spawn(npmCommand, service.args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(backendPort),
      SERVER_HOST: "127.0.0.1",
      CLIENT_URL: process.env.CLIENT_URL || frontendOrigins,
      SITE_URL: process.env.SITE_URL || `http://127.0.0.1:${frontendPort}`,
      VITE_API_URL: process.env.VITE_API_URL || `http://127.0.0.1:${backendPort}/api`
    },
    stdio: ["inherit", "pipe", "pipe"],
    shell: process.platform === "win32"
  });
  children.add(child);
  writeLines(child.stdout, service.name, service.color);
  writeLines(child.stderr, service.name, service.color);
  child.on("error", (error) => {
    console.error(`[${service.name}] Failed to start: ${error.message}`);
    process.exitCode = 1;
    stopAll();
  });
  child.on("exit", (code) => {
    children.delete(child);
    if (!stopping && code !== 0) {
      console.error(`[${service.name}] exited with code ${code}. Stopping the remaining service.`);
      process.exitCode = code || 1;
      stopAll();
    }
    if (children.size === 0) process.exit(process.exitCode || 0);
  });
}

process.on("SIGINT", stopAll);
process.on("SIGTERM", stopAll);
