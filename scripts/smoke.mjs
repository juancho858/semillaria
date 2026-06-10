#!/usr/bin/env node
// Smoke test: corre `vite build` + `vite preview` y verifica que las rutas
// principales rendericen sin pantalla en blanco ni error SSR 500.
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

const ROUTES = ["/", "/mapa", "/predicciones", "/analizador", "/diagnostico"];
const PORT = 4173;
const HOST = `http://127.0.0.1:${PORT}`;

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", ...opts });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    p.on("error", reject);
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok || r.status === 404) return;
    } catch {}
    await wait(500);
  }
  throw new Error(`Server not responding at ${url}`);
}

async function checkRoute(path) {
  const res = await fetch(HOST + path, { redirect: "manual" });
  const body = await res.text();

  const problems = [];
  if (res.status >= 500) problems.push(`HTTP ${res.status}`);
  if (body.includes('"unhandled":true')) problems.push("h3 unhandled error envelope");
  if (body.includes('"message":"HTTPError"')) problems.push("HTTPError envelope");

  // Heurística pantalla-en-blanco: el shell debe contener algo de UI dentro de <body>.
  const bodyMatch = body.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const inner = bodyMatch?.[1] ?? "";
  const visible = inner.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, "").trim();
  if (visible.length < 20) problems.push(`blank body (visible chars: ${visible.length})`);

  return { path, status: res.status, ok: problems.length === 0, problems };
}

(async () => {
  console.log("▶ vite build");
  await run("bunx", ["--bun", "vite", "build"]);

  console.log("▶ vite preview");
  const preview = spawn("bunx", ["--bun", "vite", "preview", "--port", String(PORT)], {
    stdio: "inherit",
  });

  try {
    await waitForServer(HOST + "/");
    let failed = 0;
    for (const r of ROUTES) {
      const out = await checkRoute(r);
      if (out.ok) {
        console.log(`✓ ${r.padEnd(14)} ${out.status}`);
      } else {
        failed++;
        console.error(`✗ ${r.padEnd(14)} ${out.status}  → ${out.problems.join("; ")}`);
      }
    }
    if (failed > 0) {
      console.error(`\n${failed} ruta(s) fallaron el smoke test`);
      process.exit(1);
    }
    console.log("\n✅ Smoke test OK");
  } finally {
    preview.kill("SIGTERM");
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
