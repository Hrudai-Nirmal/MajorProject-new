import { notFound } from "next/navigation";
import {
  AuditDesk,
  CompareDesk,
  singleFilters,
} from "@/components/research-desk";
export default function ResearchPage({
  params,
  searchParams,
}: {
  params: { tool: string };
  searchParams: Record<string, string | string[]>;
}) {
  const filters = singleFilters(searchParams);
  if (["coverage", "disagreements"].includes(params.tool))
    return <AuditDesk params={filters} coverage={params.tool === "coverage"} />;
  if (["pair", "history"].includes(params.tool))
    return <CompareDesk params={filters} history={params.tool === "history"} />;
  notFound();
}
