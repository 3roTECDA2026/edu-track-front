import { useEffect, useState } from "react";
import { fetchApi } from "@/services/api";

export type AlertType = "ABSENCE" | "HEALTH" | "CONDUCT" | "ACADEMIC";
export type SeverityLevel = "LOW" | "MEDIUM" | "HIGH";

export interface StudentAlert {
  id: string;
  studentId: string;
  studentName: string;
  sectionName: string;
  type: AlertType;
  severity: SeverityLevel;
  title: string;
  description: string;
  valueMetric?: string;
  createdAt: string;
  status: "OPEN" | "RESOLVED";
  note?: string;
}

export interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  currentSection?: {
    grade?: number;
    division?: string;
    shift?: string;
  } | null;
}

type BackendAlertType = "ABSENCES" | "HEALTH" | "CONDUCT" | "DROPOUT_RISK";

const mapUiTypeToBackend = (type: AlertType): BackendAlertType => {
  switch (type) {
    case "ABSENCE":
      return "ABSENCES";
    case "HEALTH":
      return "HEALTH";
    case "CONDUCT":
      return "CONDUCT";
    default:
      return "DROPOUT_RISK";
  }
};

interface CreateAlertInput {
  studentId: string;
  type: Exclude<AlertType, "ACADEMIC">;
  message: string;
}

interface UpdateAlertInput {
  type: AlertType;
  severity: SeverityLevel;
  message: string;
  read: boolean;
}

export function useStudentAlerts() {
  const [alerts, setAlerts] = useState<StudentAlert[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadAlerts = async () => {
      try {
        const data = await fetchApi<StudentAlert[]>("/api/notifications", {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setAlerts(data);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        console.error(
          "No se pudieron cargar las alertas reales:",
          requestError,
        );
        setAlerts([]);
        setError("No se pudieron cargar las alertas reales del sistema.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    const loadStudents = async () => {
      try {
        const response = await fetchApi<{ data: StudentOption[] }>(
          "/api/students?page=1&limit=100",
          { signal: controller.signal },
        );
        if (!controller.signal.aborted) setStudents(response.data ?? []);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          console.error("No se pudieron cargar los estudiantes:", requestError);
        }
      }
    };

    void loadAlerts();
    void loadStudents();

    return () => controller.abort();
  }, []);

  const createAlert = async (input: CreateAlertInput) => {
    if (!input.studentId || !input.message.trim()) {
      setError("Seleccioná un estudiante y escribí un detalle para la alerta.");
      return null;
    }

    try {
      const createdAlert = await fetchApi<StudentAlert>("/api/notifications", {
        method: "POST",
        body: JSON.stringify({
          studentId: input.studentId,
          type: mapUiTypeToBackend(input.type),
          message: input.message.trim(),
          read: false,
        }),
      });
      setAlerts((previousAlerts) => [createdAlert, ...previousAlerts]);
      setError("");
      return createdAlert;
    } catch (requestError) {
      console.error("No se pudo crear la alerta:", requestError);
      setError("No se pudo crear la alerta en la base de datos.");
      return null;
    }
  };

  const updateAlert = async (id: string, input: UpdateAlertInput) => {
    try {
      const updatedAlert = await fetchApi<StudentAlert>(
        `/api/notifications/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            type: mapUiTypeToBackend(input.type),
            severity: input.severity,
            message: input.message,
            read: input.read,
          }),
        },
      );
      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) => (alert.id === id ? updatedAlert : alert)),
      );
      setError("");
      return updatedAlert;
    } catch (requestError) {
      console.error("No se pudo guardar la alerta:", requestError);
      setError("No se pudo guardar la alerta en la base de datos.");
      return null;
    }
  };

  return { alerts, students, loading, error, createAlert, updateAlert };
}
