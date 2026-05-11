import { buildScriptHostname } from "../utils/script-hostname.js";
export function createBranchChangeRouteHandler(options) {
    return (workspaceId, _oldBranch, newBranch) => {
        // Only service scripts register routes, so branch renames only touch services.
        const routes = options.routeStore.listRoutesForWorkspace(workspaceId);
        if (routes.length === 0) {
            return;
        }
        const updates = [];
        for (const route of routes) {
            const newHostname = buildScriptHostname({
                projectSlug: route.projectSlug,
                branchName: newBranch,
                scriptName: route.scriptName,
            });
            if (newHostname !== route.hostname) {
                updates.push({
                    oldHostname: route.hostname,
                    newHostname,
                    route,
                });
            }
        }
        if (updates.length === 0) {
            return;
        }
        for (const { oldHostname, newHostname, route } of updates) {
            options.routeStore.removeRoute(oldHostname);
            options.routeStore.registerRoute({
                hostname: newHostname,
                port: route.port,
                workspaceId: route.workspaceId,
                projectSlug: route.projectSlug,
                scriptName: route.scriptName,
            });
            options.logger?.info({
                oldHostname,
                newHostname,
                scriptName: route.scriptName,
            }, "Updated script route for branch rename");
        }
        options.onRoutesChanged(workspaceId);
    };
}
//# sourceMappingURL=script-route-branch-handler.js.map