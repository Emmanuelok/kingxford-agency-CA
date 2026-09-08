/** Unpublished by default. Enable only in local or access-protected development
 * deployments until the studio, workbench and hosted integrations are approved.
 * This switch controls availability; it is not an authentication mechanism.
 */
export const WORKSPACE_ENABLED = process.env.NEXT_PUBLIC_AVALON_WORKSPACE_ENABLED === "true";
