const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REQUIRED_ENTRY = '\\node_modules\\@koe\\core\\dist\\index.js';
const SEARCH_ROOTS = ['release'];

function collectAsars(rootDir) {
    if (!fs.existsSync(rootDir)) {
        return [];
    }

    const matches = [];
    const queue = [rootDir];

    while (queue.length > 0) {
        const currentDir = queue.shift();
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                queue.push(fullPath);
                continue;
            }

            if (
                entry.isFile()
                && entry.name === 'app.asar'
                && fullPath.includes(`${path.sep}resources${path.sep}`)
            ) {
                matches.push(fullPath);
            }
        }
    }

    return matches;
}

function listAsarEntries(asarPath) {
    const relativeAsarPath = path.relative(process.cwd(), asarPath) || asarPath;
    const result = process.platform === 'win32'
        ? spawnSync(
            'cmd.exe',
            ['/d', '/s', '/c', `pnpm exec asar list ${relativeAsarPath}`],
            {
                encoding: 'utf8',
                stdio: 'pipe'
            }
        )
        : spawnSync(
            'pnpm',
            ['exec', 'asar', 'list', relativeAsarPath],
            {
                encoding: 'utf8',
                stdio: 'pipe'
            }
        );

    if (result.status !== 0) {
        throw new Error(
            `Failed to inspect ${asarPath}\n${result.stderr || result.stdout || 'Unknown asar error'}`
        );
    }

    return result.stdout.split(/\r?\n/).filter(Boolean);
}

function verifyAsar(asarPath) {
    const entries = listAsarEntries(asarPath);
    const hasCoreEntry = entries.includes(REQUIRED_ENTRY);

    if (!hasCoreEntry) {
        throw new Error(
            `Missing packaged workspace module entry ${REQUIRED_ENTRY} in ${asarPath}`
        );
    }
}

function main() {
    const workspaceRoot = process.cwd();
    const asarPaths = SEARCH_ROOTS.flatMap((root) => collectAsars(path.join(workspaceRoot, root)));

    if (asarPaths.length === 0) {
        throw new Error('No packaged desktop app.asar files were found under release/.');
    }

    for (const asarPath of asarPaths) {
        verifyAsar(asarPath);
        console.log(`[verify-packaged-desktop] OK: ${path.relative(workspaceRoot, asarPath)}`);
    }
}

try {
    main();
} catch (error) {
    console.error(`[verify-packaged-desktop] ${error.message}`);
    process.exit(1);
}
