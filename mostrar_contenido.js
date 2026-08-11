#!/usr/bin/env node
'use strict';

// Node.js equivalent of mostrar_contenido_v1.sh
// Ejecutar desde la raiz del proyecto con: node mostrar_contenido.js
//
// Genera dos archivos:
//   - salida_proyecto.txt      -> arbol + contenido de cada archivo (igual que el script original)
//   - estructura_proyecto.txt  -> solo las rutas de archivos, en el mismo formato que
//                                 la seccion "ESTRUCTURA DE ARCHIVOS" de extracto.txt

const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const CONTENT_OUTPUT_FILE = 'salida_proyecto.txt';
const STRUCTURE_OUTPUT_FILE = 'estructura_proyecto.txt';
const SCRIPT_NAME = path.basename(__filename);

// --- REGLAS DE EXCLUSION (script original + carpetas/archivos que no son de la web) ---
const EXCLUDED_NAMES = new Set([
    '.git',
    '.atl',
    '.claude',
    'openspec',
    'node_modules',
    'package-lock.json',
    '.gitignore',
    'elementos_web.md',
    'extracto.txt',
    CONTENT_OUTPUT_FILE,
    STRUCTURE_OUTPUT_FILE,
    'mostrar_contenido_v1.sh',
    'mostrar_contenido_v1.txt',
    SCRIPT_NAME,
    'foxford-version-vieja',
    'Recursos',
]);

const IMAGE_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.webp', '.mp4',
]);

function isExcluded(name) {
    return EXCLUDED_NAMES.has(name);
}

// --- Listado recursivo con contenido (equivalente a listar_recursivo del .sh) ---

function listarRecursivoContenido(indent, dirAbs, lines) {
    const items = fs.readdirSync(dirAbs).sort();

    for (const name of items) {
        if (isExcluded(name)) continue;

        const itemAbs = path.join(dirAbs, name);
        const stat = fs.statSync(itemAbs);

        if (stat.isDirectory()) {
            lines.push(`${indent}📁 ${name}`);
            listarRecursivoContenido(`${indent}|   `, itemAbs, lines);
        } else if (stat.isFile()) {
            const ext = path.extname(name).toLowerCase();
            lines.push(`${indent}📄 ${name}`);

            if (IMAGE_EXTENSIONS.has(ext)) {
                lines.push(`${indent}|   (Contenido omitido para archivos de imagen)`);
            } else {
                lines.push(`${indent}|   --------------------------------------------------`);
                const content = fs.readFileSync(itemAbs, 'utf8');
                const fileLines = content.split(/\r\n|\r|\n/);
                if (fileLines.length > 0 && fileLines[fileLines.length - 1] === '') {
                    fileLines.pop();
                }
                for (const line of fileLines) {
                    lines.push(`${indent}|   ${line}`);
                }
                lines.push(`${indent}|   --------------------------------------------------`);
            }
        }
    }
}

// --- Listado recursivo de solo estructura (rutas relativas, sin contenido) ---

function listarRecursivoEstructura(dirAbs, relPath, paths) {
    const items = fs.readdirSync(dirAbs).sort();

    for (const name of items) {
        if (isExcluded(name)) continue;

        const itemAbs = path.join(dirAbs, name);
        const itemRel = relPath ? `${relPath}/${name}` : name;
        const stat = fs.statSync(itemAbs);

        if (stat.isDirectory()) {
            listarRecursivoEstructura(itemAbs, itemRel, paths);
        } else if (stat.isFile()) {
            paths.push(itemRel);
        }
    }
}

// --- Ejecucion principal ---

function main() {
    console.error(`Generando archivo de salida en ${CONTENT_OUTPUT_FILE} (exclusiones aplicadas)...`);
    const contentLines = [];
    listarRecursivoContenido('', ROOT_DIR, contentLines);
    fs.writeFileSync(
        path.join(ROOT_DIR, CONTENT_OUTPUT_FILE),
        contentLines.join('\n') + '\n',
        'utf8'
    );
    console.error(`Proceso completado. Revisa el archivo ${CONTENT_OUTPUT_FILE}.`);

    console.error(`Generando archivo de estructura en ${STRUCTURE_OUTPUT_FILE}...`);
    const structurePaths = [];
    listarRecursivoEstructura(ROOT_DIR, '', structurePaths);
    structurePaths.sort();
    fs.writeFileSync(
        path.join(ROOT_DIR, STRUCTURE_OUTPUT_FILE),
        structurePaths.join('\n') + '\n',
        'utf8'
    );
    console.error(`Proceso completado. Revisa el archivo ${STRUCTURE_OUTPUT_FILE}.`);
}

main();
