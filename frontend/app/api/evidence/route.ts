/** Retrieve snapshot citations when live chat generation is unavailable. */
import { NextRequest, NextResponse } from "next/server";
import {
  byId,
  cite,
  passages,
  publications,
  searchEvidence,
} from "@/lib/research";
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const id = params.get("id");
  if (id) {
    const row = passages.find((p) => p.id === id);
    return NextResponse.json(row ? cite(row) : null, {
      status: row ? 200 : 404,
    });
  }
  const query = params.get("q")?.trim();
  if (!query || query.length > 400)
    return NextResponse.json(
      { error: "Enter up to 400 characters." },
      { status: 400 },
    );
  const docs = publications.filter(
    (d) => !params.get("market") || d.market === params.get("market"),
  );
  return NextResponse.json(
    searchEvidence(query, docs, 3).map((row) => ({
      ...cite(row),
      summary: row.summary,
      market: byId.get(row.document_id)!.market,
    })),
  );
}
