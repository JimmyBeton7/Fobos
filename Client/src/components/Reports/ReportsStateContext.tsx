import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ReportsState = {
  // Pie chart
  pieDateRange: Date[] | null;
  setPieDateRange: (v: Date[] | null) => void;
  pieSelectedAccountIds: string[];
  setPieSelectedAccountIds: (ids: string[]) => void;
  pieInitialized: boolean;
  setPieInitialized: (v: boolean) => void;

  // Vertical chart (incomes vs expenses)
  barDateRange: Date[] | null;
  setBarDateRange: (v: Date[] | null) => void;
  barSelectedAccountIds: string[];
  setBarSelectedAccountIds: (ids: string[]) => void;
  barInitialized: boolean;
  setBarInitialized: (v: boolean) => void;

  // Yearly chart
  yearlyYear: number | null;
  setYearlyYear: (v: number | null) => void;
  yearlyStacked: boolean;
  setYearlyStacked: (v: boolean) => void;
  yearlyInitialized: boolean;
  setYearlyInitialized: (v: boolean) => void;
};

const ReportsStateContext = createContext<ReportsState | undefined>(undefined);

export function ReportsStateProvider({ children }: { children: ReactNode }) {
  // Pie
  const [pieDateRange, setPieDateRange] = useState<Date[] | null>(null);
  const [pieSelectedAccountIds, setPieSelectedAccountIds] = useState<string[]>(
    []
  );
  const [pieInitialized, setPieInitialized] = useState(false);

  // Vertical
  const [barDateRange, setBarDateRange] = useState<Date[] | null>(null);
  const [barSelectedAccountIds, setBarSelectedAccountIds] = useState<string[]>(
    []
  );
  const [barInitialized, setBarInitialized] = useState(false);

  // Yearly
  const [yearlyYear, setYearlyYear] = useState<number | null>(null);
  const [yearlyStacked, setYearlyStacked] = useState(false);
  const [yearlyInitialized, setYearlyInitialized] = useState(false);

  const value = useMemo(
    () => ({
      pieDateRange,
      setPieDateRange,
      pieSelectedAccountIds,
      setPieSelectedAccountIds,
      pieInitialized,
      setPieInitialized,

      barDateRange,
      setBarDateRange,
      barSelectedAccountIds,
      setBarSelectedAccountIds,
      barInitialized,
      setBarInitialized,

      yearlyYear,
      setYearlyYear,
      yearlyStacked,
      setYearlyStacked,
      yearlyInitialized,
      setYearlyInitialized,
    }),
    [
      pieDateRange,
      pieSelectedAccountIds,
      pieInitialized,
      barDateRange,
      barSelectedAccountIds,
      barInitialized,
      yearlyYear,
      yearlyStacked,
      yearlyInitialized,
    ]
  );

  return (
    <ReportsStateContext.Provider value={value}>
      {children}
    </ReportsStateContext.Provider>
  );
}

export function useReportsState() {
  const ctx = useContext(ReportsStateContext);
  if (!ctx) {
    throw new Error("useReportsState must be used within ReportsStateProvider");
  }
  return ctx;
}
