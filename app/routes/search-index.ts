import { loadDataset } from "../data/load.server";
import { buildSearchEntries } from "../data/search-entries";

export async function loader() {
  return Response.json(buildSearchEntries(loadDataset()));
}
