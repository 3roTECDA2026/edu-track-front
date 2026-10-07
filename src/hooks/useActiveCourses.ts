import { useEffect, useState } from "react";
import { fetchApi } from "@/services/api";

type Shift = "MORNING" | "AFTERNOON" | "EVENING" | "EXTRA_TIME";

interface ClassSectionResponse {
  id: string;
  year: number;
  grade: number;
  division: string;
  shift: Shift;
}

export type CourseStatusType =
  | "NORMAL"
  | "TEACHER_ABSENT"
  | "INSTITUTIONAL_OUTING";

export interface ActiveCourseData {
  sectionId: string;
  sectionName: string;
  academicYear: number;
  shift: Shift;
  subjectName?: string;
  teacherName?: string;
  status: CourseStatusType;
  note?: string;
}

export function useActiveCourses() {
  const [courses, setCourses] = useState<ActiveCourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadCourses = async () => {
      try {
        const sections = await fetchApi<ClassSectionResponse[]>(
          "/api/class-sections",
          { signal: controller.signal },
        );

        if (controller.signal.aborted) return;

        setCourses((previousCourses) =>
          sections.map((section) => {
            const existing = previousCourses.find(
              (course) => course.sectionId === section.id,
            );

            return {
              sectionId: section.id,
              sectionName: `${section.grade}° ${section.division}`,
              academicYear: section.year,
              shift: section.shift,
              status: existing?.status ?? "NORMAL",
              note: existing?.note,
            };
          }),
        );
        setError(null);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setCourses([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudieron cargar los cursos.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadCourses();
    return () => controller.abort();
  }, []);

  const updateCourseStatus = (
    sectionId: string,
    status: CourseStatusType,
    note: string,
  ) => {
    setCourses((previousCourses) =>
      previousCourses.map((course) =>
        course.sectionId === sectionId ? { ...course, status, note } : course,
      ),
    );
  };

  return { courses, loading, error, updateCourseStatus };
}
