/**
 * extraer.js — Extractor de contexto de proyecto
 *
 * Uso:    node extraer.js [variables.txt] [carpetaDelProyecto]
 * Salida: extracto.txt en la carpeta actual
 *
 * Lee variables.txt (generado por Gemini) y extrae de .html/.css/.js
 * solo las partes relacionadas con los términos indicados.
 */

const fs = require("fs");
const path = require("path");

/* ================= CONFIG ================= */
const varsPath = process.argv[2] || "variables.txt";
const rootDir = path.resolve(process.argv[3] || ".");
const outputPath = "extracto.txt";

const CODE_EXTS = new Set([".html", ".htm", ".css", ".js", ".mjs"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", ".vscode", ".idea"]);
const SKIP_FILES = new Set(["extraer.js", "extracto.txt", "extracto_delta.txt", "variables.txt", "salida_proyecto.txt"]);
const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const lineOf = (src, offset) => src.slice(0, offset).split("\n").length;

/* ============ 1. LEER variables.txt ============ */
function parseVariables(text) {
    const res = { terminos: [], archivosCompletos: [], estructura: true };
    let section = null;
    for (const raw of text.split(/\r?\n/)) {
        let line = raw.trim();
        if (!line) continue;
        // Comentario de línea completa: "#" seguido de espacio o fin
        // (un id como "#logo-header" NO es comentario: no tiene espacio)
        if (/^#(\s|$)/.test(line)) continue;
        // Comentario inline: todo lo que sigue a un " #" (los términos nunca tienen espacios)
        line = line.replace(/\s+#.*$/, "").trim();
        if (!line) continue;
        const sec = line.match(/^\[([^\]]+)\]$/);
        if (sec) { section = sec[1].trim().toUpperCase(); continue; }
        if (section === "TERMINOS") res.terminos.push(line);
        else if (section === "ARCHIVOS_COMPLETOS") res.archivosCompletos.push(line);
        else if (section === "ESTRUCTURA") res.estructura = !/^false$/i.test(line);
    }
    return res;
}

// Soporta scoping opcional: "termino @ ruta/archivo" → busca ese término SOLO en ese archivo
const classify = (t) => {
    let text = t, scope = null;
    const m = t.match(/^(.*?)\s+@\s+(\S.*)$/);
    if (m) { text = m[1].trim(); scope = m[2].trim().replace(/\\/g, "/"); }
    const base = text.startsWith("#")
        ? { kind: "id", value: text.slice(1) }
        : text.startsWith(".")
            ? { kind: "class", value: text.slice(1) }
            : { kind: "token", value: text };
    return { ...base, raw: t, scope };
};

/* ============ 2. ARCHIVOS ============ */
function walkAll(dir, rel = "") {
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const rp = rel ? rel + "/" + e.name : e.name;
        if (e.isDirectory()) {
            if (SKIP_DIRS.has(e.name)) continue;
            out.push(...walkAll(path.join(dir, e.name), rp));
        } else if (e.isFile() && !SKIP_FILES.has(e.name)) {
            out.push(rp);
        }
    }
    return out.sort();
}

/* ============ 3. HTML ============ */
function parseHtml(src) {
    const root = { tag: "#root", attrs: "", start: 0, end: src.length, children: [], parent: null };
    const stack = [root];
    const tagRe = /<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*?>/g;
    let m;
    while ((m = tagRe.exec(src))) {
        const rawTag = m[0];
        if (rawTag.startsWith("<!--") || rawTag.startsWith("<!")) continue;
        const tm = rawTag.match(/^<\/?\s*([a-zA-Z][\w-]*)/);
        if (!tm) continue;
        const tag = tm[1].toLowerCase();
        const isClose = rawTag.startsWith("</");
        const selfClosing = /\/\s*>$/.test(rawTag) || VOID_TAGS.has(tag);
        if (isClose) {
            for (let i = stack.length - 1; i > 0; i--) {
                if (stack[i].tag === tag) {
                    for (let j = stack.length - 1; j >= i; j--) {
                        if (stack[j].end === src.length) stack[j].end = m.index + rawTag.length;
                    }
                    stack.length = i;
                    break;
                }
            }
        } else if (selfClosing) {
            stack[stack.length - 1].children.push({
                tag, attrs: rawTag, start: m.index, end: m.index + rawTag.length,
                children: [], parent: stack[stack.length - 1],
            });
        } else {
            const node = {
                tag, attrs: rawTag, start: m.index, end: src.length,
                children: [], parent: stack[stack.length - 1],
            };
            node.parent.children.push(node);
            if (tag === "script" || tag === "style") {
                const closeRe = new RegExp("</" + tag + "\\s*>", "ig");
                closeRe.lastIndex = tagRe.lastIndex;
                const cm = closeRe.exec(src);
                if (cm) {
                    node.end = cm.index + cm[0].length;
                    tagRe.lastIndex = node.end;
                    continue;
                }
            }
            stack.push(node);
        }
    }
    return root;
}

function nodeMatches(node, terms) {
    const idRe = (v) => new RegExp(`id\\s*=\\s*["']${escapeRegExp(v)}["']`);
    const classHit = (v) => {
        const cm = node.attrs.match(/class\s*=\s*["']([^"']*)["']/);
        return cm && cm[1].split(/\s+/).includes(v);
    };
    for (const t of terms) {
        if (t.kind === "id" && idRe(t.value).test(node.attrs)) return t;
        if (t.kind === "class" && classHit(t.value)) return t;
        if (t.kind === "token" && (node.tag === t.value.toLowerCase() || idRe(t.value).test(node.attrs) || classHit(t.value))) return t;
    }
    return null;
}

function collectIdentifiers(chunk, into) {
    for (const m of chunk.matchAll(/id\s*=\s*["']([^"']+)["']/g))
        m[1].split(/\s+/).forEach((v) => v.length > 1 && into.ids.add(v));
    for (const m of chunk.matchAll(/class\s*=\s*["']([^"']+)["']/g))
        m[1].split(/\s+/).forEach((v) => v.length > 1 && into.classes.add(v));
}

function extractHtml(src, terms) {
    const root = parseHtml(src);
    const matches = [];
    (function visit(node, ancestorMatched) {
        for (const child of node.children) {
            const term = ancestorMatched ? null : nodeMatches(child, terms);
            if (term) { matches.push({ node: child, term }); visit(child, true); }
            else visit(child, ancestorMatched);
        }
    })(root, false);
    if (!matches.length) return null;
    const counts = {};
    const identifiers = { ids: new Set(), classes: new Set() };
    const parts = matches.map(({ node, term }) => {
        counts[term.raw] = (counts[term.raw] || 0) + 1;
        const text = src.slice(node.start, node.end);
        collectIdentifiers(text, identifiers);
        const chain = [];
        let p = node.parent;
        while (p && p.tag !== "#root") { chain.unshift(p); p = p.parent; }
        const chainStr = chain.map((a) => `  <!-- ANCESTRO: ${a.attrs} -->`).join("\n");
        const header = `--- <${node.tag}> coincide con ${term.raw} (líneas ${lineOf(src, node.start)}-${lineOf(src, node.end)}) ---`;
        const body = `${chainStr ? chainStr + "\n" : ""}${text}`;
        return { header, body, out: `${header}\n${body}` };
    });
    return { parts, counts, identifiers };
}

/* ============ 4. CSS ============ */
function parseCssRules(src) {
    const clean = src.replace(/\/\*[\s\S]*?\*\//g, (mm) => mm.replace(/[^\n]/g, " "));
    const rules = [];
    const atStack = [];
    let pos = 0;
    const n = clean.length;
    while (pos < n) {
        const open = clean.indexOf("{", pos);
        const close = clean.indexOf("}", pos);
        if (open === -1 && close === -1) break;
        if (close !== -1 && (open === -1 || close < open)) {
            if (atStack.length) atStack.pop();
            pos = close + 1;
            continue;
        }
        let prelude = clean.slice(pos, open).trim();
        const semi = prelude.lastIndexOf(";");
        if (semi !== -1) prelude = prelude.slice(semi + 1).trim();
        if (prelude.startsWith("@")) {
            atStack.push(prelude.replace(/\s+/g, " "));
            pos = open + 1;
        } else if (prelude) {
            let depth = 1, j = open + 1;
            while (j < n && depth > 0) {
                if (clean[j] === "{") depth++;
                else if (clean[j] === "}") depth--;
                j++;
            }
            rules.push({ selector: prelude, start: pos, end: j, atChain: atStack.slice() });
            pos = j;
        } else {
            pos = open + 1;
        }
    }
    return rules;
}

function cssSelectorMatches(selector, terms) {
    for (const t of terms) {
        if (t.kind === "id" && new RegExp(`#${escapeRegExp(t.value)}(?![\\w-])`).test(selector)) return t;
        if (t.kind === "class" && new RegExp(`\\.${escapeRegExp(t.value)}(?![\\w-])`).test(selector)) return t;
        if (t.kind === "token" && selector.includes(t.value)) return t;
    }
    return null;
}

// v1.4: los términos también matchean el contenido de at-rules (@media, @supports)
// ej: "orientation @ css/layout.css" extrae solo las reglas dentro de esas media queries
function cssAtMatches(atChain, terms) {
    if (!atChain.length) return null;
    const at = atChain.join(" ");
    for (const t of terms) {
        if (at.includes(t.value)) return t;
    }
    return null;
}

function extractCss(src, terms) {
    const rules = parseCssRules(src);
    const matched = [];
    for (const r of rules) {
        const t = cssSelectorMatches(r.selector, terms) || cssAtMatches(r.atChain, terms);
        if (t) matched.push({ rule: r, term: t });
    }
    if (!matched.length) return null;
    const counts = {};
    matched.forEach(({ term }) => { counts[term.raw] = (counts[term.raw] || 0) + 1; });
    // Variables CSS referenciadas por las reglas encontradas
    const varNames = new Set();
    for (const { rule } of matched)
        for (const m of src.slice(rule.start, rule.end).matchAll(/var\(\s*(--[\w-]+)/g)) varNames.add(m[1]);
    const varDecls = new Set();
    if (varNames.size) {
        for (const r of rules) {
            if (!r.selector.includes(":root") && r.selector.trim() !== "html") continue;
            const body = src.slice(r.start, r.end);
            for (const v of varNames) {
                const dm = body.match(new RegExp(`(${escapeRegExp(v)}\\s*:[^;}]+)`));
                if (dm) varDecls.add(dm[1].trim());
            }
        }
    }
    const parts = matched.map(({ rule }) => {
        const wrapOpen = rule.atChain.map((a) => a + " {").join("\n");
        const wrapClose = rule.atChain.map(() => "}").join("\n");
        const body = src.slice(rule.start, rule.end).trim();
        const out = (wrapOpen ? wrapOpen + "\n" : "") + body + (wrapClose ? "\n" + wrapClose : "");
        return { header: "", body, out };
    });
    if (varDecls.size) {
        const vbody = [...varDecls].join("\n  ");
        parts.unshift({ header: "/* Variables CSS referenciadas */", body: vbody, out: "/* Variables CSS referenciadas */\n:root {\n  " + vbody + "\n}" });
    }
    return { parts, counts };
}

/* ============ 5. JS ============ */
function findEnclosingBlock(src, offset) {
    let depth = 0, open = -1;
    for (let i = offset - 1; i >= 0; i--) {
        const ch = src[i];
        if (ch === "}") depth++;
        else if (ch === "{") {
            if (depth === 0) { open = i; break; }
            depth--;
        }
    }
    if (open === -1) return null;
    const lineStart = src.lastIndexOf("\n", open - 1) + 1;
    let d = 0, end = -1;
    for (let i = open; i < src.length; i++) {
        if (src[i] === "{") d++;
        else if (src[i] === "}") { d--; if (d === 0) { end = i + 1; break; } }
    }
    if (end === -1) end = src.length;
    return { start: lineStart, end };
}

function extractJs(src, terms) {
    const lines = src.split("\n");
    const offsets = [];
    let acc = 0;
    for (const l of lines) { offsets.push(acc); acc += l.length + 1; }
    const termRes = terms.map((t) => {
        const v = escapeRegExp(t.value);
        return { t, re: t.kind === "token" ? new RegExp(`\\b${v}\\b`) : new RegExp(v) };
    });
    const hitLines = new Set();
    const counts = {};
    lines.forEach((l, i) => {
        for (const { t, re } of termRes) {
            if (re.test(l)) {
                hitLines.add(i);
                counts[t.raw] = (counts[t.raw] || 0) + 1;
                break;
            }
        }
    });
    if (!hitLines.size) return null;
    const ranges = [];
    for (const i of hitLines) {
        const blk = findEnclosingBlock(src, offsets[i]);
        if (blk) ranges.push(blk);
        else {
            const from = Math.max(0, i - 5), to = Math.min(lines.length - 1, i + 5);
            ranges.push({ start: offsets[from], end: offsets[to] + lines[to].length });
        }
    }
    ranges.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const r of ranges) {
        const last = merged[merged.length - 1];
        if (last && r.start <= last.end) last.end = Math.max(last.end, r.end);
        else merged.push({ ...r });
    }
    const importLines = lines.filter((l) => /^\s*import\s/.test(l));
    const parts = [];
    if (importLines.length) {
        const ibody = importLines.join("\n");
        parts.push({ header: "// --- imports del archivo ---", body: ibody, out: "// --- imports del archivo ---\n" + ibody });
    }
    for (const r of merged) {
        const b = src.slice(r.start, r.end);
        const header = `// --- líneas ${lineOf(src, r.start)}-${lineOf(src, r.end)} ---`;
        parts.push({ header, body: b, out: header + "\n" + b });
    }
    return { parts, counts };
}

/* ============ 6. MAIN ============ */
function main() {
    if (!fs.existsSync(varsPath)) {
        console.error(`✘ No se encontró "${varsPath}". Crealo con la salida de Gemini.`);
        process.exit(1);
    }
    const vars = parseVariables(fs.readFileSync(varsPath, "utf8"));
    const terms = vars.terminos.map(classify);
    if (!terms.length && !vars.archivosCompletos.length) {
        console.error("✘ variables.txt no tiene términos ni archivos completos.");
        process.exit(1);
    }

    const allFiles = walkAll(rootDir);
    const codeFiles = allFiles.filter((f) => CODE_EXTS.has(path.extname(f).toLowerCase()));
    const cache = new Map();
    const read = (rel) => {
        if (!cache.has(rel)) cache.set(rel, fs.readFileSync(path.join(rootDir, rel), "utf8"));
        return cache.get(rel);
    };

    const report = new Map();
    const touch = (raw, file, tipo, count) => {
        if (!report.has(raw)) report.set(raw, []);
        report.get(raw).push(`${file} (${tipo}: ${count})`);
    };
    const isUserTerm = (raw) => terms.some((t) => t.raw === raw);
    // Filtra términos por scope (los que no tienen @ aplican a todos los archivos)
    const forFile = (list, f) => list.filter((t) => !t.scope || t.scope === f);

    /* ---- MODO DELTA (v1.3) ---- */
    const deltaPath = "extracto_delta.txt";
    const forceFull = process.argv.includes("--full");
    const oldExtract = !forceFull && fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    const alreadySent = (body) => !!oldExtract && oldExtract.includes(body);
    const skipped = [];
    const splitParts = (f, parts, section) => {
        const full = `### ${f}\n` + parts.map((p) => p.out).join("\n\n");
        const newParts = parts.filter((p) => !alreadySent(p.body));
        const skippedCount = parts.length - newParts.length;
        if (skippedCount > 0) skipped.push(`- ${f} (${section}: ${skippedCount} bloque/s sin cambios)`);
        const delta = newParts.length ? `### ${f}\n` + newParts.map((p) => p.out).join("\n\n") : null;
        return { full, delta };
    };

    const out = [];
    out.push("=== EXTRACTO DE PROYECTO ===");
    out.push(`Generado: ${new Date().toISOString()}`);
    out.push(`Términos: ${vars.terminos.join(", ") || "(ninguno)"}`);
    if (vars.archivosCompletos.length) out.push(`Archivos completos: ${vars.archivosCompletos.join(", ")}`);

    if (vars.estructura) {
        out.push("\n=== ESTRUCTURA DE ARCHIVOS ===");
        out.push(allFiles.join("\n"));
    }

    const fullUsed = [];
    const fullBlocksDelta = [];
    if (vars.archivosCompletos.length) {
        out.push("\n=== ARCHIVOS COMPLETOS ===");
        for (const rel of vars.archivosCompletos) {
            if (fs.existsSync(path.join(rootDir, rel))) {
                const fullContent = read(rel);
                const wasSentBefore = !!oldExtract && oldExtract.includes(`--- ${rel} (completo`);
                const changed = !alreadySent(fullContent);
                const header = `--- ${rel} (completo${wasSentBefore && changed ? ", MODIFICADO — reemplaza la versión anterior" : ""}) ---`;
                out.push(`${header}\n${fullContent}`);
                if (changed) fullBlocksDelta.push(`${header}\n${fullContent}`);
                else skipped.push(`- ${rel} (archivo completo sin cambios)`);
                fullUsed.push(rel);
                // Contar términos dentro del archivo completo para el REPORTE
                for (const t of terms) {
                    if (t.scope && t.scope !== rel) continue;
                    const occ = fullContent.split(t.value).length - 1;
                    if (occ > 0) touch(t.raw, rel, "archivo completo", occ);
                }
            } else {
                out.push(`--- ${rel} → NO ENCONTRADO ---`);
            }
        }
    }

    // HTML: solo términos del usuario; además recolecta ids/clases para expansión automática
    const auto = { ids: new Set(), classes: new Set() };
    const extractedFiles = new Set(fullUsed);
    const htmlOut = [];
    const htmlDelta = [];
    for (const f of codeFiles.filter((f) => /\.html?$/i.test(f) && !fullUsed.includes(f))) { // los fullUsed ya se incluyeron enteros
        const r = extractHtml(read(f), forFile(terms, f));
        if (!r) continue;
        const split = splitParts(f, r.parts, "html");
        htmlOut.push(split.full);
        if (split.delta) htmlDelta.push(split.delta);
        extractedFiles.add(f);
        r.identifiers.ids.forEach((i) => auto.ids.add(i));
        r.identifiers.classes.forEach((c) => auto.classes.add(c));
        for (const [raw, c] of Object.entries(r.counts)) touch(raw, f, "html", c);
    }

    const autoTerms = [
        ...[...auto.ids].map((i) => ({ kind: "id", value: i, raw: `#${i}` })),
        ...[...auto.classes].map((c) => ({ kind: "class", value: c, raw: `.${c}` })),
    ].filter((at) => !terms.some((t) => t.value === at.value));
    const searchTerms = [...terms, ...autoTerms];

    const cssOut = [];
    const cssDelta = [];
    for (const f of codeFiles.filter((f) => f.endsWith(".css") && !fullUsed.includes(f))) {
        const r = extractCss(read(f), forFile(searchTerms, f));
        if (!r) continue;
        const split = splitParts(f, r.parts, "css");
        cssOut.push(split.full);
        if (split.delta) cssDelta.push(split.delta);
        extractedFiles.add(f);
        for (const [raw, c] of Object.entries(r.counts)) if (isUserTerm(raw)) touch(raw, f, "css", c);
    }

    const jsOut = [];
    const jsDelta = [];
    for (const f of codeFiles.filter((f) => /\.m?js$/.test(f) && !fullUsed.includes(f))) {
        const r = extractJs(read(f), forFile(searchTerms, f));
        if (!r) continue;
        const split = splitParts(f, r.parts, "js");
        jsOut.push(split.full);
        if (split.delta) jsDelta.push(split.delta);
        extractedFiles.add(f);
        for (const [raw, c] of Object.entries(r.counts)) if (isUserTerm(raw)) touch(raw, f, "js", c);
    }

    if (htmlOut.length) out.push("\n=== HTML (extractos) ===\n" + htmlOut.join("\n\n"));
    if (cssOut.length) out.push("\n=== CSS (reglas relevantes) ===\n" + cssOut.join("\n\n"));
    if (jsOut.length) out.push("\n=== JS (bloques relevantes) ===\n" + jsOut.join("\n\n"));

    const related = [];
    for (const t of terms) {
        for (const f of codeFiles) {
            if (extractedFiles.has(f)) continue;
            if (t.scope && t.scope !== f) continue;
            if (read(f).includes(t.value)) related.push(`- ${t.raw} también aparece en: ${f}`);
        }
    }
    if (related.length) out.push("\n=== POSIBLEMENTE RELACIONADO (no incluido) ===\n" + related.join("\n"));

    out.push("\n=== REPORTE ===");
    for (const t of terms) {
        const hits = report.get(t.raw);
        out.push(hits && hits.length ? `✔ ${t.raw} → ${hits.join(", ")}` : `✘ ${t.raw} → NO encontrado en ningún archivo`);
    }
    for (const rel of vars.archivosCompletos) {
        out.push(fs.existsSync(path.join(rootDir, rel)) ? `✔ ${rel} → incluido completo` : `✘ ${rel} → archivo NO encontrado`);
    }

    fs.writeFileSync(outputPath, out.join("\n"), "utf8");

    /* ---- ESCRIBIR DELTA ---- */
    const deltaOut = [];
    deltaOut.push("=== EXTRACTO DELTA (solo lo nuevo o modificado) ===");
    deltaOut.push(`Generado: ${new Date().toISOString()}`);
    deltaOut.push("Este extracto contiene SOLO lo nuevo o modificado respecto del último extracto ya enviado a Claude en este chat. Todo lo que NO está acá sigue vigente tal como lo tiene Claude.");
    deltaOut.push(`Términos: ${vars.terminos.join(", ") || "(ninguno)"}`);
    if (vars.estructura) {
        const tree = allFiles.join("\n");
        if (!alreadySent(tree)) deltaOut.push("\n=== ESTRUCTURA DE ARCHIVOS ===\n" + tree);
    }
    if (fullBlocksDelta.length) deltaOut.push("\n=== ARCHIVOS COMPLETOS ===\n" + fullBlocksDelta.join("\n\n"));
    if (htmlDelta.length) deltaOut.push("\n=== HTML (extractos) ===\n" + htmlDelta.join("\n\n"));
    if (cssDelta.length) deltaOut.push("\n=== CSS (reglas relevantes) ===\n" + cssDelta.join("\n\n"));
    if (jsDelta.length) deltaOut.push("\n=== JS (bloques relevantes) ===\n" + jsDelta.join("\n\n"));
    if (related.length) deltaOut.push("\n=== POSIBLEMENTE RELACIONADO (no incluido) ===\n" + related.join("\n"));
    deltaOut.push("\n=== REPORTE ===");
    for (const t of terms) {
        const hits = report.get(t.raw);
        deltaOut.push(hits && hits.length ? `✔ ${t.raw} → ${hits.join(", ")}` : `✘ ${t.raw} → NO encontrado en ningún archivo`);
    }
    if (skipped.length) deltaOut.push("\n=== YA ENVIADO ANTES (sin cambios, no se repite) ===\n" + skipped.join("\n"));
    const nothingNew = !fullBlocksDelta.length && !htmlDelta.length && !cssDelta.length && !jsDelta.length;
    if (nothingNew) deltaOut.push("\n(no hay contenido nuevo: todo lo pedido ya fue enviado antes y no cambió)");
    fs.writeFileSync(deltaPath, deltaOut.join("\n"), "utf8");

    console.log(`✔ Listo: ${outputPath} (completo)`);
    console.log(oldExtract ? `✔ ${deltaPath} (solo lo nuevo/modificado${nothingNew ? ": nada" : ""})` : `✔ ${deltaPath} (no había extracto previo: contiene todo)`);
    const missing = terms.filter((t) => !report.has(t.raw));
    if (missing.length) console.log(`⚠ Términos sin coincidencias: ${missing.map((t) => t.raw).join(", ")}`);
}

main();