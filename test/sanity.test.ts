import { execSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import matter from "gray-matter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SKILLS_DIR = join(__dirname, "..", "skills");
const PUBLIC_SKILL_NAMES = [
	"sora-market",
	"supabase",
	"supabase-postgres-best-practices",
] as const;

type InstallResult = {
	commandExitCode: number;
	commandOutput: string;
	installedSkillNames: string[];
	installDir: string;
};

/**
 * Dynamically discover all skill names from the skills/ directory
 */
function discoverSkillNames(): string[] {
	if (!existsSync(SKILLS_DIR)) {
		return [];
	}

	return readdirSync(SKILLS_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.filter((entry) => existsSync(join(SKILLS_DIR, entry.name, "SKILL.md")))
		.map((entry) => entry.name);
}

function createPublicSourceSnapshot(): string {
	const sourceDir = mkdtempSync(join(tmpdir(), "agent-skills-source-"));
	cpSync(SKILLS_DIR, join(sourceDir, "skills"), { recursive: true });
	return sourceDir;
}

function runSkillsAdd(sourceDir: string, skillName?: string): InstallResult {
	const installDir = mkdtempSync(join(tmpdir(), "agent-skills-install-"));
	const claudeSkillsDir = join(installDir, ".claude", "skills");
	const skillArg = skillName ? ` --skill ${skillName}` : "";
	let commandOutput: string;
	let commandExitCode: number;

	try {
		commandOutput = execSync(
			`npx skills add ${sourceDir} -a claude-code -y${skillArg}`,
			{
				cwd: installDir,
				encoding: "utf-8",
				stdio: ["pipe", "pipe", "pipe"],
				timeout: 120000, // 2 minute timeout
			},
		);
		commandExitCode = 0;
	} catch (error) {
		const execError = error as {
			stdout?: string;
			stderr?: string;
			status?: number;
		};
		commandOutput = `${execError.stdout ?? ""}\n${execError.stderr ?? ""}`;
		commandExitCode = execError.status ?? 1;
	}

	const installedSkillNames = existsSync(claudeSkillsDir)
		? readdirSync(claudeSkillsDir, { withFileTypes: true })
				.filter((entry) => entry.isDirectory())
				.map((entry) => entry.name)
				.sort()
		: [];

	return {
		commandExitCode,
		commandOutput,
		installedSkillNames,
		installDir,
	};
}

const CONFLICT_MARKER = /^(<<<<<<< |=======$|>>>>>>> )/m;

describe("release workflow authentication", () => {
	const raw = readFileSync(
		join(__dirname, "..", ".github", "workflows", "release.yml"),
		"utf8",
	);
	const { data: workflow } = matter(`---\n${raw}\n---`);
	const release = workflow.jobs.release;
	const steps = release.steps as Array<{
		id?: string;
		name?: string;
		if?: string;
		with?: Record<string, string>;
		env?: Record<string, string>;
	}>;

	it("requires both credentials before generating a release App token", () => {
		expect(release.env.HAS_RELEASE_APP).toBe(
			"${{ secrets.GH_APP_ID != '' && secrets.GH_APP_PRIVATE_KEY != '' }}",
		);
		const step = steps.find((step) => step.id === "generate-token");
		expect(step?.if).toBe("${{ env.HAS_RELEASE_APP == 'true' }}");
		expect(step?.with).toMatchObject({
			"client-id": "${{ secrets.GH_APP_ID }}",
			"private-key": "${{ secrets.GH_APP_PRIVATE_KEY }}",
		});
	});

	it("uses the App token or the repository token for releases and uploads", () => {
		const token = "${{ steps.generate-token.outputs.token || github.token }}";
		expect(steps.find((step) => step.id === "release")?.with?.token).toBe(token);
		expect(
			steps.find((step) => step.name === "Upload release assets")?.env?.GITHUB_TOKEN,
		).toBe(token);
		expect(workflow.permissions).toMatchObject({
			contents: "write",
			"pull-requests": "write",
		});
	});

	it("requires an upstream release and both credentials for the plugin App", () => {
		expect(release.env.HAS_PLUGIN_APP).toBe(
			"${{ secrets.GH_APP_ID_SUPABASE_PLUGIN != '' && secrets.GH_APP_PRIVATE_KEY_SUPABASE_PLUGIN != '' }}",
		);
		expect(steps.find((step) => step.id === "generate-token-plugin")?.if).toBe(
			"${{ steps.release.outputs.release_created && github.repository == 'supabase/agent-skills' && env.HAS_PLUGIN_APP == 'true' }}",
		);
	});

	it("does not dispatch plugin sync without a plugin token", () => {
		const step = steps.find(
			(step) => step.name === "Trigger supabase-plugin skill sync",
		);
		expect(step?.if).toBe(
			"${{ steps.release.outputs.release_created && steps.generate-token-plugin.outputs.token != '' }}",
		);
		expect(step?.env?.GH_TOKEN).toBe(
			"${{ steps.generate-token-plugin.outputs.token }}",
		);
	});
});

describe("skill manifests", () => {
	const skillNames = discoverSkillNames().sort();

	it("discovers the public skills", () => {
		expect(skillNames).toEqual([...PUBLIC_SKILL_NAMES]);
	});

	it.each(PUBLIC_SKILL_NAMES)(
		"%s SKILL.md has parseable frontmatter and no conflict markers",
		(skillName) => {
			const skillMdPath = join(SKILLS_DIR, skillName, "SKILL.md");
			const raw = readFileSync(skillMdPath, "utf8");

			expect(
				CONFLICT_MARKER.test(raw),
				`${skillName} SKILL.md contains unresolved merge conflict markers`,
			).toBe(false);
			expect(
				raw.startsWith("---\n"),
				`${skillName} SKILL.md must start with YAML frontmatter`,
			).toBe(true);

			const { data } = matter(raw);
			expect(data.name).toBe(skillName);
			expect(data.description).toEqual(expect.any(String));
			expect(String(data.description).length).toBeGreaterThan(0);

			const metadata = data.metadata as { version?: unknown } | undefined;
			expect(metadata?.version).toMatch(/^\d+\.\d+\.\d+$/);
		},
	);
});

describe("skills add sanity check", () => {
	let publicSourceDir: string;
	let installAllResult: InstallResult;
	const createdInstallDirs: string[] = [];
	const skillNames = discoverSkillNames().sort();

	beforeAll(() => {
		publicSourceDir = createPublicSourceSnapshot();
		installAllResult = runSkillsAdd(publicSourceDir);
		createdInstallDirs.push(installAllResult.installDir);
	});

	afterAll(() => {
		rmSync(publicSourceDir, { recursive: true, force: true });
		for (const installDir of createdInstallDirs) {
			rmSync(installDir, { recursive: true, force: true });
		}
	});

	it("should discover exactly the public skills", () => {
		expect(skillNames).toEqual([...PUBLIC_SKILL_NAMES]);
		console.log(
			`Discovered ${skillNames.length} skills: ${skillNames.join(", ")}`,
		);
	});

	it("should install all public skills without failing", () => {
		const hasError =
			/\bError\b/i.test(installAllResult.commandOutput) && !/✓/.test(installAllResult.commandOutput);

		if (hasError) {
			console.log("Command output:", installAllResult.commandOutput);
		}

		expect(installAllResult.commandExitCode).toBe(0);
	});

	it("should install exactly the public skills when installing all", () => {
		expect(installAllResult.installedSkillNames).toEqual([...PUBLIC_SKILL_NAMES]);
	});

	it("should not install skill-creator in the public install flow", () => {
		expect(installAllResult.installedSkillNames).not.toContain("skill-creator");
	});

	it.each(PUBLIC_SKILL_NAMES)(
		"should install only %s when using --skill",
		(skillName) => {
			const result = runSkillsAdd(publicSourceDir, skillName);
			createdInstallDirs.push(result.installDir);
			expect(result.commandExitCode).toBe(0);
			expect(result.installedSkillNames).toEqual([skillName]);
		},
	);

	it("should have SKILL.md in each installed public skill", () => {
		for (const skillName of installAllResult.installedSkillNames) {
			const skillMdPath = join(
				installAllResult.installDir,
				".claude",
				"skills",
				skillName,
				"SKILL.md",
			);
			expect(
				existsSync(skillMdPath),
				`Expected SKILL.md to exist at ${skillMdPath}`,
			).toBe(true);
		}
	});
});
