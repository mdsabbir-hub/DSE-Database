import { getTableData } from "@/lib/data";
import DataTable from "@/components/DataTable";

export const dynamic = "force-static";

export default function PortfolioPage() {
  const { columns, rows } = getTableData("02-portfolio");
  return (
    <>
      <h1 className="page-title">Portfolio</h1>
      <p className="page-meta">Current open positions</p>
      <DataTable columns={columns} rows={rows} />
    </>
  );
}
