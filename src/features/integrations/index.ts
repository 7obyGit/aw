import { integrationManager } from "./manager";
import { NpmIntegration } from "./impl/npm/npmIntegration";
import { ShellIntegration } from "./impl/shell/shellIntegration";
import { AwIntegration } from "./impl/aw/awIntegration";
import { DotnetIntegration } from "./impl/dotnet/dotnetIntegration.js";
import { MavenIntegration } from "./impl/java/mavenIntegration.js";
import { GradleIntegration } from "./impl/java/gradleIntegration.js";
import { BatchIntegration } from "./impl/shell/batchIntegration.js";
import { PowershellIntegration } from "./impl/shell/powershellIntegration.js";
import { UvIntegration } from "./impl/python/uvIntegration.js";
import { PoetryIntegration } from "./impl/python/poetryIntegration.js";
import { LocalCiIntegration } from "./impl/ci/localCiIntegration.js";
import { ScriptSearchIntegration } from "./impl/search/scriptSearchIntegration.js";
import { MakefileIntegration } from "./impl/makefile/makefileIntegration.js";
import { DockerComposeIntegration } from "./impl/docker/dockerComposeIntegration.js";
import { CargoIntegration } from "./impl/rust/cargoIntegration.js";
import { GoIntegration } from "./impl/go/goIntegration.js";
import { TaskfileIntegration } from "./impl/task/taskfileIntegration.js";
import { JustfileIntegration } from "./impl/just/justfileIntegration.js";

// Register built-in integrations
integrationManager.register(new AwIntegration());
integrationManager.register(new LocalCiIntegration());
integrationManager.register(new DotnetIntegration());
integrationManager.register(new MavenIntegration());
integrationManager.register(new GradleIntegration());
integrationManager.register(new NpmIntegration());
integrationManager.register(new PoetryIntegration());
integrationManager.register(new UvIntegration());
integrationManager.register(new PowershellIntegration());
integrationManager.register(new BatchIntegration());
integrationManager.register(new MakefileIntegration());
integrationManager.register(new DockerComposeIntegration());
integrationManager.register(new CargoIntegration());
integrationManager.register(new GoIntegration());
integrationManager.register(new TaskfileIntegration());
integrationManager.register(new JustfileIntegration());

const shellIntegration: ShellIntegration = new ShellIntegration();
integrationManager.register(shellIntegration);
integrationManager.register(new ScriptSearchIntegration(shellIntegration));

export * from "./types/IIntegration";
export * from "./manager";
