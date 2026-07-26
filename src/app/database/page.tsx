import { getTableData } from "@/lib/data";
import DataTable from "@/components/DataTable";

export const dynamic = "force-static";

export default function DatabasePage() {
  const { columns, rows } = getTableData("04-database");
  return (
    <>
      <h1 className="page-title">Database</h1>
      <p className="page-meta">Security master - all tracked companies</p>
      <DataTable columns={columns} rows={rows} />
    </>
  );
}
