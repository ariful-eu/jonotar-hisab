import { type RouteConfig, index, route } from "@react-router/dev/routes";
import { loadDataset } from "./data/load.server";

// With ssr:false, a param route with a loader but zero prerendered paths fails the build.
const ds = loadDataset();

export default [
  index("routes/home.tsx"),
  route("budget/:year?", "routes/budget.tsx"),
  route("wards", "routes/wards.tsx"),
  route("ward/:no", "routes/ward.tsx"),
  route("projects", "routes/projects.tsx"),
  ...(ds.projects.length > 0 ? [route("projects/:id", "routes/project.tsx")] : []),
  route("tenders", "routes/tenders.tsx"),
  ...(ds.tenders.length > 0 ? [route("tenders/:id", "routes/tender.tsx")] : []),
  route("services", "routes/services.tsx"),
  route("allowances", "routes/allowances.tsx"),
  route("allowances/check", "routes/allowance-check.tsx"),
  route("notices", "routes/notices.tsx"),
  route("search-index.json", "routes/search-index.ts"),
  route("rights", "routes/rights.tsx"),
  route("rights/:topic", "routes/rights-topic.tsx"),
  route("documents", "routes/documents.tsx"),
  route("about", "routes/about.tsx"),
  route("poster/:kind/:id", "routes/poster.tsx"),
] satisfies RouteConfig;
