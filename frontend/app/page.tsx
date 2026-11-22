import { SearchDesk, singleFilters } from "@/components/research-desk";
export default function Home({
  searchParams,
}: {
  searchParams: Record<string, string | string[]>;
}) {
  return <SearchDesk params={singleFilters(searchParams)} />;
}
