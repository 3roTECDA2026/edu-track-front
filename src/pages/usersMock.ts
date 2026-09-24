// Datos de prueba (mock) para el CRUD de usuarios.
// Archivo separado a propósito: cuando existan los endpoints reales
// (/users y /courses) se elimina este archivo y su import en UsersPage.tsx, y listo.
//
// Diferencia con gradesMock.ts: además de los datos, este archivo simula la API.
// Al importarse reemplaza fetch para /users y /courses; el resto de las
// llamadas pasa al fetch real. Está activo por defecto en desarrollo
// (npm run dev), así que el equipo ve los datos sin configurar nada.
// Para usar el backend real: VITE_USE_MOCK=false en .env.local.
// En un build de producción nunca se activa.
import type { UserListItem } from '@/services/users.service';

const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== 'false';

type Body = Omit<UserListItem, 'id'> & { password?: string };

export const COURSES = [
  { id: 1, label: '1º Año — Sección A — Matemática' },
  { id: 2, label: '1º Año — Sección B — Matemática' },
  { id: 3, label: '2º Año — Sección A — Matemática' },
  { id: 4, label: '3º Año — Sección A — Física' },
];

export const INITIAL_USERS: UserListItem[] = [
  { id: 1, firstName: 'María', lastName: 'González', dni: '25456789', email: 'mgonzalez@escuela.edu', phone: '351 555-1234', username: 'mgonzalez', role: 'admin', active: true, courseIds: [] },
  { id: 2, firstName: 'Carlos', lastName: 'Rodríguez', dni: '27123456', email: 'crodriguez@escuela.edu', phone: null, username: 'crodriguez', role: 'preceptor', active: true, courseIds: [] },
  { id: 3, firstName: 'Lucía', lastName: 'Fernández', dni: '30222111', email: 'lfernandez@escuela.edu', phone: '351 555-2222', username: 'lfernandez', role: 'preceptor', active: true, courseIds: [] },
  { id: 4, firstName: 'Jorge', lastName: 'Martínez', dni: '28333444', email: 'jmartinez@escuela.edu', phone: null, username: 'jmartinez', role: 'docente', active: true, courseIds: [1, 3] },
  { id: 5, firstName: 'Ana', lastName: 'López', dni: '31555666', email: 'alopez@escuela.edu', phone: '351 555-3333', username: 'alopez', role: 'preceptor', active: true, courseIds: [] },
  { id: 6, firstName: 'Pedro', lastName: 'Sánchez', dni: '26777888', email: 'psanchez@escuela.edu', phone: null, username: 'psanchez', role: 'docente', active: false, courseIds: [4] },
  { id: 7, firstName: 'Sofía', lastName: 'Ramírez', dni: '33111222', email: 'sramirez@escuela.edu', phone: '351 555-4444', username: 'sramirez', role: 'docente', active: true, courseIds: [2] },
  { id: 8, firstName: 'Diego', lastName: 'Torres', dni: '29444555', email: 'dtorres@escuela.edu', phone: null, username: 'dtorres', role: 'preceptor', active: true, courseIds: [] },
];

let users: UserListItem[] = [...INITIAL_USERS];
let nextId = users.length + 1;

const CONFLICT_MESSAGES = {
  email: 'El email ya está registrado',
  username: 'El nombre de usuario ya está en uso',
  dni: 'El DNI ya está registrado',
} as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const fail = (status: number, error: string, details?: unknown) =>
  json({ success: false, error, details }, status);

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const wait = (ms: number, signal?: AbortSignal | null) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

const findConflict = (b: Body, excludeId?: number): keyof typeof CONFLICT_MESSAGES | null => {
  const others = users.filter((u) => u.id !== excludeId);
  if (others.some((u) => u.email.toLowerCase() === b.email.toLowerCase())) return 'email';
  if (others.some((u) => u.username.toLowerCase() === b.username.toLowerCase())) return 'username';
  if (others.some((u) => u.dni === b.dni)) return 'dni';
  return null;
};

const toUser = (id: number, b: Body): UserListItem => ({
  id,
  firstName: b.firstName,
  lastName: b.lastName,
  dni: b.dni,
  email: b.email,
  phone: b.phone ?? null,
  username: b.username,
  role: b.role,
  active: b.active,
  courseIds: b.role === 'docente' ? (b.courseIds ?? []) : [],
});

function handle(method: string, url: URL, body?: Body): Response | null {
  const path = url.pathname;

  if (method === 'GET' && path === '/courses') {
    return json({ success: true, data: COURSES });
  }

  if (path === '/users' && method === 'GET') {
    const q = url.searchParams;
    const page = Number(q.get('page') ?? 1);
    const limit = Number(q.get('limit') ?? 10);
    const search = normalize(q.get('search') ?? '');
    const role = q.get('role');
    const active = q.get('active');

    const filtered = users.filter((u) => {
      if (role && u.role !== role) return false;
      if (active && String(u.active) !== active) return false;
      if (search && !normalize(`${u.firstName} ${u.lastName} ${u.email}`).includes(search)) return false;
      return true;
    });

    return json({
      success: true,
      data: filtered.slice((page - 1) * limit, page * limit),
      pagination: { page, limit, total: filtered.length },
    });
  }

  if (path === '/users' && method === 'POST' && body) {
    const conflict = findConflict(body);
    if (conflict) return fail(409, CONFLICT_MESSAGES[conflict], { field: conflict });
    const created = toUser(nextId++, body);
    users = [created, ...users];
    return json({ success: true, data: created, message: 'Usuario creado' }, 201);
  }

  const one = path.match(/^\/users\/([^/]+)$/);
  if (one && method === 'PUT' && body) {
    const id = Number(one[1]);
    if (!users.some((u) => u.id === id)) return fail(404, 'Usuario no encontrado');
    const conflict = findConflict(body, id);
    if (conflict) return fail(409, CONFLICT_MESSAGES[conflict], { field: conflict });
    const updated = toUser(id, body);
    users = users.map((u) => (u.id === id ? updated : u));
    return json({ success: true, data: updated, message: 'Usuario actualizado' });
  }

  const toggle = path.match(/^\/users\/([^/]+)\/(suspend|activate)$/);
  if (toggle && method === 'PATCH') {
    const id = Number(toggle[1]);
    const target = users.find((u) => u.id === id);
    if (!target) return fail(404, 'Usuario no encontrado');
    const updated = { ...target, active: toggle[2] === 'activate' };
    users = users.map((u) => (u.id === id ? updated : u));
    return json({ success: true, data: updated });
  }

  return null;
}

if (USE_MOCK) {
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const isRequest = input instanceof Request;
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(rawUrl, window.location.origin);

    if (!/^\/(users|courses)(\/|$)/.test(url.pathname)) return realFetch(input, init);

    const method = (init?.method ?? (isRequest ? input.method : 'GET')).toUpperCase();
    const signal = init?.signal ?? (isRequest ? input.signal : undefined);
    await wait(300 + Math.random() * 300, signal); // latencia simulada

    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Body) : undefined;
    return handle(method, url, body) ?? realFetch(input, init);
  };

  console.info('[mock] API simulada activa para /users y /courses (VITE_USE_MOCK=false para desactivar)');
}