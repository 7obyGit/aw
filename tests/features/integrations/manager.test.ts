import { describe, it, expect, vi } from "vitest";
import { IntegrationManager } from "../../../src/features/integrations/manager";
import { IIntegration } from "../../../src/features/integrations/types/IIntegration";
import { IScript } from "../../../src/features/scripts/types/IScript";

describe("IntegrationManager", () => {
    it("should register and return integrations", () => {
        const manager = new IntegrationManager();
        const mockIntegration = { id: "test" } as IIntegration;

        manager.register(mockIntegration);

        expect(manager.getIntegrations()).toContain(mockIntegration);
    });

    it("should discover scripts from all registered integrations", async () => {
        const manager = new IntegrationManager();

        const script1: IScript = {
            name: "s1",
            path: "p1",
            type: "t1",
            source: "src1",
            confidence: 1,
            command: "c1",
        };
        const script2: IScript = {
            name: "s2",
            path: "p2",
            type: "t2",
            source: "src2",
            confidence: 1,
            command: "c2",
        };

        const int1: IIntegration = {
            id: "i1",
            name: "n1",
            description: "d1",
            getScripts: vi.fn().mockResolvedValue([script1]),
        };
        const int2: IIntegration = {
            id: "i2",
            name: "n2",
            description: "d2",
            getScripts: vi.fn().mockResolvedValue([script2]),
        };

        manager.register(int1);
        manager.register(int2);

        const scripts = await manager.discoverScripts("/some/dir");

        expect(scripts).toHaveLength(2);
        expect(scripts).toContain(script1);
        expect(scripts).toContain(script2);
        expect(int1.getScripts).toHaveBeenCalledWith("/some/dir");
        expect(int2.getScripts).toHaveBeenCalledWith("/some/dir");
    });

    it("should return a specific script by name", async () => {
        const manager = new IntegrationManager();
        const script: IScript = {
            name: "target",
            path: "p1",
            type: "t1",
            source: "src1",
            confidence: 1,
            command: "c1",
        };

        const integration: IIntegration = {
            id: "i1",
            name: "n1",
            description: "d1",
            getScripts: vi.fn().mockResolvedValue([script]),
        };

        manager.register(integration);

        const found = await manager.getScript("target", "/some/dir");
        expect(found).toBe(script);

        const notFound = await manager.getScript("nonexistent", "/some/dir");
        expect(notFound).toBeUndefined();
    });
});
