import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class LocalCiIntegration implements IIntegration {
    public readonly id: string = "local_ci";
    public readonly name: string = "Local CI Runner";
    public readonly description: string = "Runs GitHub/GitLab automation jobs locally";

    // Standard tasks to identify inside the automation configurations
    private targetTasks = ["build", "test", "lint", "format", "deploy"];

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        const scripts: IScript[] = [];

        try {
            // 1. Process GitHub Actions for local execution via 'act'
            const githubScripts = await this.discoverGitHubJobs(workingDirectory);
            scripts.push(...githubScripts);

            // 2. Process GitLab CI for local execution via 'gitlab-ci-local'
            const gitlabScripts = await this.discoverGitLabJobs(workingDirectory);
            scripts.push(...gitlabScripts);

            return scripts;
        } catch {
            return scripts;
        }
    }

    /**
     * Parses GitHub workflows and builds local 'act' commands
     */
    private async discoverGitHubJobs(workingDirectory: string): Promise<IScript[]> {
        const scripts: IScript[] = [];
        const workflowDir = join(workingDirectory, ".github", "workflows");

        try {
            const files = await readdir(workflowDir);
            const yamlFiles = files.filter(
                (f: any) => extname(f) === ".yml" || extname(f) === ".yaml"
            );

            for (const file of yamlFiles) {
                const filePath = join(workflowDir, file);
                const content = await readFile(filePath, "utf-8");

                // Basic regex parsing to extract top-level keys inside the 'jobs:' block
                const jobsBlock = content.match(/^jobs:\s*([\s\S]*?)(?:^[a-zA-Z])/m);
                if (!jobsBlock) continue;

                // Find job IDs (indented string keys immediately under 'jobs:')
                const jobMatches = jobsBlock[1].matchAll(/^\s{2}([a-zA-Z0-9_-]+):/gm);

                for (const match of jobMatches) {
                    const jobId = match[1];
                    const lowercaseJob = jobId.toLowerCase();

                    // Check if this job matches our target tasks or is generic
                    const matchedTask = this.targetTasks.find((task) =>
                        lowercaseJob.includes(task)
                    );

                    scripts.push({
                        name: `ci:${matchedTask || lowercaseJob}`,
                        path: filePath,
                        type: "github_actions_local",
                        source: `.github/workflows/${file}`,
                        confidence: matchedTask ? 0.8 : 0.5,
                        description: `(Local CI) Run GitHub job '${jobId}' locally`,
                        // 'act -j <job_id>' executes exactly that specific job locally
                        command: `act -j "${jobId}"`,
                    });
                }
            }
        } catch {
            // Directory doesn't exist, ignore
        }
        return scripts;
    }

    /**
     * Parses GitLab CI configuration and builds 'gitlab-ci-local' commands
     */
    private async discoverGitLabJobs(workingDirectory: string): Promise<IScript[]> {
        const scripts: IScript[] = [];
        const gitlabCiPath = join(workingDirectory, ".gitlab-ci.yml");

        try {
            const content = await readFile(gitlabCiPath, "utf-8");

            // Add job to run the pipeline
            scripts.push({
                name: "pipeline",
                path: gitlabCiPath,
                type: "gitlab_ci_local",
                source: ".gitlab-ci.yml",
                confidence: 0.8,
                description: "(Local CI) Run GitLab pipeline",
                command: "npx gitlab-ci-local",
            });

            // Find root-level job declarations (alphanumeric keys at column 0)
            // Exclude global reserved keywords like stages, image, cache, before_script, variables
            const rootKeys = content.matchAll(/^([a-zA-Z0-9_-]+):/gm);
            const reserved = [
                "stages",
                "image",
                "cache",
                "before_script",
                "after_script",
                "variables",
                "include",
                "workflow",
            ];

            for (const match of rootKeys) {
                const jobId = match[1];
                if (reserved.includes(jobId)) continue;

                const lowercaseJob = jobId.toLowerCase();
                const matchedTask = this.targetTasks.find((task) => lowercaseJob.includes(task));

                scripts.push({
                    name: `ci:${matchedTask || lowercaseJob}`,
                    path: gitlabCiPath,
                    type: "gitlab_ci_local",
                    source: ".gitlab-ci.yml",
                    confidence: matchedTask ? 0.8 : 0.5,
                    description: `(Local CI) Run GitLab job '${jobId}' locally`,
                    command: `npx gitlab-ci-local "${jobId}"`,
                });
            }
        } catch {
            // File doesn't exist, ignore
        }
        return scripts;
    }
}
