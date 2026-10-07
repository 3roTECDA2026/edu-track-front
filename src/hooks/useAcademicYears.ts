import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { fetchApi } from "@/services/api";

export interface AcademicYearOption {
  id: string;
  year: number;
  active: boolean;
  term1StartDate?: string | null;
  term1EndDate?: string | null;
  term2StartDate?: string | null;
  term2EndDate?: string | null;
}

const STORAGE_KEY = "notar-selected-academic-year";

interface AcademicYearsContextValue {
  academicYears: AcademicYearOption[];
  selectedYear: number | undefined;
  setSelectedYear: (year: number | undefined) => void;
  loading: boolean;
  error: string | null;
}

const AcademicYearsContext = createContext<AcademicYearsContextValue | null>(
  null,
);

function readStoredAcademicYear(): number | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return undefined;
  }

  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

export function AcademicYearsProvider({ children }: { children: ReactNode }) {
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadAcademicYears = async () => {
      try {
        const data = await fetchApi<AcademicYearOption[]>(
          "/api/academic-years",
          {
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) return;

        setAcademicYears(data);

        const activeYear = data.find((yearEntry) => yearEntry.active)?.year;
        const fallbackYear = data[0]?.year;
        const storedYear = readStoredAcademicYear();
        const validStoredYear =
          storedYear !== undefined
            ? data.find((yearEntry) => yearEntry.year === storedYear)?.year
            : undefined;
        const initialYear =
          validStoredYear ?? activeYear ?? fallbackYear ?? undefined;

        setSelectedYear((previousYear) => previousYear ?? initialYear);

        if (initialYear !== undefined) {
          window.localStorage.setItem(STORAGE_KEY, String(initialYear));
        }

        setError(null);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setAcademicYears([]);
        setSelectedYear(undefined);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudieron cargar los años lectivos.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadAcademicYears();

    return () => controller.abort();
  }, []);

  const handleSelectYear = (year: number | undefined) => {
    setSelectedYear(year);

    if (year === undefined) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, String(year));
  };

  const value = {
    academicYears,
    selectedYear,
    setSelectedYear: handleSelectYear,
    loading,
    error,
  };

  return createElement(AcademicYearsContext.Provider, { value }, children);
}

export function useAcademicYears() {
  const context = useContext(AcademicYearsContext);

  if (!context) {
    throw new Error(
      "useAcademicYears must be used within AcademicYearsProvider",
    );
  }

  return context;
}
