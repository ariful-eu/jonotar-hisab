import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("budget/:year?", "routes/budget.tsx"),
  route("wards", "routes/wards.tsx"),
  route("ward/:no", "routes/ward.tsx"),
  route("projects", "routes/projects.tsx"),
  route("projects/:id", "routes/project.tsx"),
  route("tenders", "routes/tenders.tsx"),
  route("tenders/:id", "routes/tender.tsx"),
  route("services", "routes/services.tsx"),
  route("allowances", "routes/allowances.tsx"),
  route("rights", "routes/rights.tsx"),
  route("rights/:topic", "routes/rights-topic.tsx"),
  route("documents", "routes/documents.tsx"),
  route("about", "routes/about.tsx"),
  route("poster/:kind/:id", "routes/poster.tsx"),
] satisfies RouteConfig;
