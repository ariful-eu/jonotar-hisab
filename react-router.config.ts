import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  basename: process.env.BASE_PATH ?? "/",
  async prerender() {
    const { loadDataset } = await import("./app/data/load.server");
    const { allPaths } = await import("./app/data/paths");
    return allPaths(loadDataset());
  },
} satisfies Config;
