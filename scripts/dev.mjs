import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';

const isWin = process.platform === 'win32';
const nodeExecutable = process.execPath;
const projectRoot = process.cwd();
const n8nUserFolder = path.join(os.homedir(), '.n8n-node-cli');
const pinnedN8nVersion = '1.123.15';
const persistentN8nInstallDir = path.join(projectRoot, '.n8n-dev-server');
const persistentN8nPackageJson = path.join(persistentN8nInstallDir, 'package.json');
const persistentN8nBinary = isWin
	? path.join(persistentN8nInstallDir, 'node_modules', '.bin', 'n8n.cmd')
	: path.join(persistentN8nInstallDir, 'node_modules', '.bin', 'n8n');
const persistentN8nPackageManifest = path.join(
	persistentN8nInstallDir,
	'node_modules',
	'n8n',
	'package.json',
);
const localN8nNodeCli = path.join(
	projectRoot,
	'node_modules',
	'@n8n',
	'node-cli',
	'bin',
	'n8n-node.mjs',
);
const npmCliPath = isWin
	? path.join(process.env.APPDATA ?? '', 'npm', 'node_modules', 'npm', 'bin', 'npm-cli.js')
	: path.join(path.dirname(path.dirname(process.execPath)), 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js');
const localN8nCache = path.join(projectRoot, '.npm-n8n-cache');
const nodeMajorVersion = Number.parseInt(process.versions.node.split('.')[0], 10);

const sharedEnv = {
	...process.env,
	N8N_DEV_RELOAD: 'true',
	DB_SQLITE_POOL_SIZE: '10',
	N8N_USER_FOLDER: n8nUserFolder,
};

const processes = [];

function ensureDir(dirPath) {
	fs.mkdirSync(dirPath, { recursive: true });
}

function readInstalledN8nVersion() {
	if (!fs.existsSync(persistentN8nPackageManifest)) return null;

	try {
		const manifest = JSON.parse(fs.readFileSync(persistentN8nPackageManifest, 'utf8'));
		return manifest.version ?? null;
	} catch {
		return null;
	}
}

function ensurePersistentN8nPackageJson() {
	ensureDir(persistentN8nInstallDir);

	const packageJson = {
		name: 'n8n-dev-server-runtime',
		private: true,
		description: 'Persistent local n8n runtime for npm run dev',
	};

	fs.writeFileSync(persistentN8nPackageJson, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function bootstrapPersistentN8nInstall() {
	const installedVersion = readInstalledN8nVersion();

	if (installedVersion === pinnedN8nVersion && fs.existsSync(persistentN8nBinary)) {
		return;
	}

	ensurePersistentN8nPackageJson();

	console.log(`[n8n Server] Preparing local pinned n8n@${pinnedN8nVersion} runtime...`);

	const install = spawnSync(
		nodeExecutable,
		[
			npmCliPath,
			'install',
			'--no-package-lock',
			'--save-exact',
			`n8n@${pinnedN8nVersion}`,
		],
		{
			cwd: persistentN8nInstallDir,
			stdio: 'inherit',
			shell: isWin,
			env: {
				...sharedEnv,
				npm_config_cache: localN8nCache,
			},
		},
	);

	if (install.status !== 0 || !fs.existsSync(persistentN8nBinary)) {
		process.exit(install.status ?? 1);
	}
}

function checkWindowsN8nPrereqs() {
	if (nodeMajorVersion !== 22) {
		console.error([
			'npm run dev requires Node.js 22 for this project.',
			'',
			'Reason:',
			'- The pinned n8n dev server used by this repo is currently stable with Node 22.',
			'- Node 24 triggers native dependency install failures on Windows during n8n startup.',
			'',
			'Switch this project shell to Node 22 and try again.',
		].join('\n'));

		process.exit(1);
	}

	if (!isWin) return;

	const configuredPython = process.env.npm_config_python ?? process.env.PYTHON;

	if (configuredPython) return;

	const pyList = spawnSync('py', ['-0p'], {
		encoding: 'utf8',
		shell: false,
	});

	if (pyList.status !== 0) return;

	const defaultPythonLine = pyList.stdout
		.split(/\r?\n/)
		.map((line) => line.trim())
		.find((line) => line.includes('*'));

	if (!defaultPythonLine?.includes('Python314')) return;

	const distutilsCheck = spawnSync('py', ['-3.14', '-c', 'import distutils'], {
		encoding: 'utf8',
		shell: false,
	});

	if (distutilsCheck.status === 0) return;

	console.error([
		'npm run dev cannot start n8n on this Windows setup right now.',
		'',
		'Root cause:',
		'- n8n startup pulls in sqlite3, which falls back to node-gyp when no compatible prebuild is available.',
		'- node-gyp is currently selecting Python 3.14 on this machine.',
		'- Python 3.14 removed distutils, so the sqlite3 native build fails before n8n can start.',
		'',
		'Why it looks stuck:',
		'- the n8n subprocess fails during its hidden install/startup path while the TypeScript watcher keeps running.',
		'',
		'How to fix locally:',
		'1. Install Python 3.12 or 3.11 with pip/setuptools included.',
		'2. Point npm/node-gyp to it, for example:',
		'   npm config set python "C:\\Path\\To\\Python312\\python.exe"',
		'3. Re-run `npm run dev`.',
		'',
		'Optional verification command:',
		'   npm install --save-dev n8n@1.123.15',
	].join('\n'));

	process.exit(1);
}

function run(name, command, args, options = {}) {
	const child = spawn(command, args, {
		stdio: 'inherit',
		shell: isWin,
		env: sharedEnv,
		...options,
	});

	child.on('exit', (code, signal) => {
		const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
		console.log(`[${name}] exited with ${reason}`);
		shutdown(code ?? 0);
	});

	child.on('error', (error) => {
		console.error(`[${name}] failed:`, error);
		shutdown(1);
	});

	processes.push(child);
	return child;
}

let shuttingDown = false;

function shutdown(exitCode) {
	if (shuttingDown) return;
	shuttingDown = true;

	for (const child of processes) {
		if (!child.killed) child.kill();
	}

	process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

checkWindowsN8nPrereqs();
bootstrapPersistentN8nInstall();

run('TypeScript + node link', nodeExecutable, [localN8nNodeCli, 'dev', '--external-n8n']);
run('n8n Server', persistentN8nBinary, [], {
	cwd: n8nUserFolder,
	env: {
		...sharedEnv,
		npm_config_cache: localN8nCache,
	},
});
