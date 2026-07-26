import { getTableData } from "@/lib/data";
import DataTable from "@/components/DataTable";

export const dynamic = "force-static";

export default function WatchlistPage() {
  const { columns, rows } = getTableData("05-watchlist");
  return (
    <>
      <h1 className="page-title">Watchlist</h1>
      <p className="page-meta">Symbols you&apos;re tracking but don&apos;t currently hold</p>
      <DataTable columns={columns} rows={rows} />
    </>
  );
}
