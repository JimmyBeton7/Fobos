import { useMemo, useState } from "react";
import PieChartBlock from "./components/PieChartBlock";
import VerticalChartBlock from "./components/VerticalChartBlock";
import YearlyVerticalChartBlock from "./components/YearlyVerticalChartBlock";
import "./Reports.styles.css";
import type { AccountRow, CategoryRow } from '../../../../Electron/types';
import { Skeleton } from "primereact/skeleton"
import { Card } from "primereact/card"
import { useData } from "../DataContext";

function ReportsSkeleton() {
  return (
    <div className="charts-page">
      {/* Pie */}
      <Card className="chart-card">
        <Skeleton width="14rem" height="1.25rem" className="mb-3" />

        <div className="chart-filters">
          <div className="charts-multiselect">
            <Skeleton width="100%" height="2.5rem" />
          </div>
          <div className="charts-calendar">
            <Skeleton width="100%" height="2.5rem" />
          </div>
        </div>

        <div className="pie-container">
          <Skeleton width="100%" height="310px" />
        </div>
      </Card>

      {/* Bar */}
      <Card className="chart-card">
        <Skeleton width="14rem" height="1.25rem" className="mb-3" />

        <div className="chart-filters2">
          <div className="charts-multiselect">
            <Skeleton width="100%" height="2.5rem" />
          </div>
          <div className="charts-calendar">
            <Skeleton width="100%" height="2.5rem" />
          </div>
        </div>

        <div className="vertical-container">
          <Skeleton width="100%" height="310px" />
        </div>
      </Card>

      {/* Yearly */}
      <Card className="chart-card">
        <Skeleton width="18rem" height="1.25rem" className="mb-3" />

        <div className="chart-filters">
          <div className="year-dropdown">
            <Skeleton width="100%" height="2.5rem" />
          </div>
          <div className="stacked-toggle">
            <Skeleton width="1.25rem" height="1.25rem" />
            <Skeleton width="6rem" height="1rem" />
          </div>
        </div>

        <div className="vertical-year-container">
          <Skeleton width="100%" height="310px" />
        </div>
      </Card>
    </div>
  );
}

export default function Reports() {

  const { accounts, categories, transactions, loading } = useData();
  const [error, setError] = useState<string | null>(null);

  const isLoading = !!loading?.accounts || !!loading?.categories || !!loading?.transactions;

  const accountsById = useMemo(() => {
    const m: Record<string, AccountRow> = {};
    for (const a of accounts) m[String((a as AccountRow).id ?? a.id)] = a;
    return m;
  }, [accounts]);

  const categoriesById = useMemo(() => {
    const m: Record<string, CategoryRow> = {};
    for (const c of categories) m[String((c as CategoryRow).id ?? c.id)] = c;
    return m;
  }, [categories]);

  if (isLoading) return <ReportsSkeleton />;

  if (error) {
    return <div className="charts-page"><div style={{ color: "tomato" }}>{error}</div></div>;
  }

  return (
    <div className="charts-page">
      <PieChartBlock
        transactions={transactions}
        accountsById={accountsById}
        categoriesById={categoriesById}
      />
      <VerticalChartBlock
        transactions={transactions}
        accountsById={accountsById}
      />
      <YearlyVerticalChartBlock
        transactions={transactions}
        categoriesById={categoriesById}
      />
    </div>
  );
}
