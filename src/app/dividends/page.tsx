import { getTableData } from "@/lib/data";
import DataTable from "@/components/DataTable";

export const dynamic = "force-static";

export default function DividendsPage() {
  const { columns, rows } = getTableData("06-dividend-tracker");
  return (
    <>
      <h1 className="page-title">Dividends</h1>
      <p className="page-meta">Dividend payment history</p>
      <DataTable columns={columns} rows={rows} />
    </>
  );
}
