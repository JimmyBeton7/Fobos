import React, { useEffect, useMemo } from "react";
import { Chart } from "primereact/chart";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import type {
  TransactionRow,
  CategoryRow,
} from "../../../../../Electron/types";
import { useReportsState } from "../ReportsStateContext";

type Props = {
  transactions: TransactionRow[];
  categoriesById: Record<string, CategoryRow>;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const STACK_COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#8BC34A",
  "#E91E63",
  "#00BCD4",
  "#C9CBCF",
];

export default function YearlyVerticalChartBlock({
   transactions,
   categoriesById,
}: Props) {
  const {
    yearlyYear,
    setYearlyYear,
    yearlyStacked,
    setYearlyStacked,
    yearlyInitialized,
    setYearlyInitialized,
  } = useReportsState();

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const t of transactions) {
      const d = new Date(String((t as any).date));
      if (!isNaN(d.getTime())) set.add(d.getFullYear());
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [transactions]);

  const currentYear = new Date().getFullYear();
  const defaultYear = years.includes(currentYear)
    ? currentYear
    : years[0] ?? currentYear;

  useEffect(() => {
    if (!yearlyInitialized && years.length) {
      setYearlyYear(yearlyYear ?? defaultYear);
      setYearlyInitialized(true);
    }
  }, [
    yearlyInitialized,
    yearlyYear,
    years,
    defaultYear,
    setYearlyYear,
    setYearlyInitialized,
  ]);

  const year = yearlyYear ?? defaultYear;
  const stacked = yearlyStacked;

  const { incomes, expenseTotals, expensesByCat } = useMemo(() => {
    const incomes = Array(12).fill(0) as number[];
    const expensesByCat: Record<string, number[]> = {};

    for (const t of transactions) {
      const d = new Date(String((t as any).date));
      if (isNaN(d.getTime())) continue;
      const y = d.getFullYear();
      if (y !== year) continue;

      const month = d.getMonth();
      const amountCents = Number(
        (t as any).amountCents ??
        (t as TransactionRow).amount_cents ??
        0
      );
      const kind: "income" | "expense" | undefined =
        (t as TransactionRow).kind;

      if (kind === "income" || (kind === undefined && amountCents > 0)) {
        incomes[month] += Math.max(amountCents, 0) / 100;
      } else if (kind === "expense" || (kind === undefined && amountCents < 0)) {
        const catId = String(
          (t as any).own_category_id ??
          (t as any).owncategoryId ??
          (t as any).category_id ??
          (t as any).categoryId ??
          "uncategorized"
        );
        if (!expensesByCat[catId]) {
          expensesByCat[catId] = Array(12).fill(0);
        }
        expensesByCat[catId][month] += Math.abs(amountCents) / 100;
      }
    }

    const expenseTotals = Array(12).fill(0) as number[];
    for (const arr of Object.values(expensesByCat)) {
      for (let m = 0; m < 12; m++) {
        expenseTotals[m] += arr[m];
      }
    }

    return { incomes, expenseTotals, expensesByCat };
  }, [transactions, year]);

  const data = useMemo(() => {
    if (!stacked) {
      return {
        labels: MONTH_LABELS,
        datasets: [
          {
            label: "Incomes",
            backgroundColor: "#4CAF50",
            data: incomes.map((v) => Number(v.toFixed(2))),
          },
          {
            label: "Expenses",
            backgroundColor: "#EF5350",
            data: expenseTotals.map((v) => Number(v.toFixed(2))),
          },
        ],
      };
    }

    const datasets: any[] = [];

    datasets.push({
      label: "Incomes",
      backgroundColor: "#4CAF50",
      data: incomes.map((v) => Number(v.toFixed(2))),
      stack: "incomes",
    });

    const catIds = Object.keys(expensesByCat);

    catIds.forEach((catId, idx) => {
      const cat = categoriesById[catId];
      const name =
        (cat && (cat as CategoryRow).name) || `Category ${catId}`;
      const color =
        (cat && ((cat as CategoryRow).color_hex || (cat as any).color)) ||
        STACK_COLORS[idx % STACK_COLORS.length];

      datasets.push({
        label: name,
        backgroundColor: color,
        data: expensesByCat[catId].map((v) => Number(v.toFixed(2))),
        stack: "expenses",
      });
    });

    return {
      labels: MONTH_LABELS,
      datasets,
    };
  }, [incomes, expenseTotals, expensesByCat, stacked, categoriesById]);

  const options = useMemo(
    () => ({
      indexAxis: "x",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#fff" },
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) =>
              `${ctx.dataset.label}: ${Number(
                ctx.parsed.y ?? ctx.parsed
              ).toLocaleString("pl-PL", {
                style: "currency",
                currency: "PLN",
              })}`,
          },
        },
      },
      scales: {
        x: {
          stacked,
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
        y: {
          stacked,
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
      },
    }),
    [stacked]
  );

  const yearOptions = years.map((y) => ({ label: String(y), value: y }));
  const dropdownValue =
    yearOptions.find((o) => o.value === year)?.value ?? defaultYear;

  return (
    <Card title="Incomes vs expenses by month" className="chart-card">
      <div className="chart-filters">
        <div className="year-dropdown">
          <Dropdown
            value={dropdownValue}
            options={yearOptions}
            onChange={(e) => setYearlyYear(e.value)}
            placeholder="Select year"
            className="w-full"
          />
        </div>

        <div className="stacked-toggle">
          <Checkbox
            inputId="stackedToggle"
            checked={stacked}
            onChange={(e) => setYearlyStacked(!!e.checked)}
          />
          <label htmlFor="stackedToggle">Stacked</label>
        </div>
      </div>

      <div className="vertical-year-container">
        <Chart
          type="bar"
          data={data}
          options={options}
          style={{ height: "100%" }}
        />
      </div>
    </Card>
  );
}
