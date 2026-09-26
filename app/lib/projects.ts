import type { ProjectRow } from "../data/schemas";

export type ProjectFilter = { ward: string; scheme: string; status: string };

export function filterProjects(projects: ProjectRow[], f: ProjectFilter): ProjectRow[] {
  return projects.filter((p) =>
    (f.ward === "" || (f.ward === "none" ? p.ward === null : String(p.ward) === f.ward)) &&
    (f.scheme === "" || p.scheme === f.scheme) &&
    (f.status === "" || p.status === f.status),
  );
}
