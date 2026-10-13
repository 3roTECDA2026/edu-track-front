
// Datos de prueba (mock) para el CRUD de usuarios.
// Este archivo mantiene tipos independientes del backend real.
//
// Mock:
// - IDs numéricos
// - Roles: admin, docente, preceptor
// - Datos simulados de DNI, teléfono, usuario y cursos
//
// Backend real:
// - IDs UUID (string)
// - Roles: admin, docente
// - Datos almacenados en PostgreSQL mediante Prisma
//
// Para desactivar este mock en desarrollo:
// VITE_USE_MOCK=false en .env.local

type MockRole = 'admin' | 'docente' | 'preceptor';

interface MockUserListItem {
  id: number;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string | null;
  username: string;
  role: MockRole;
  active: boolean;
  courseIds: number[];
}

type Body = Omit<MockUserListItem, 'id'> & {
  password?: string;
};

const USE_MOCK =
  import.meta.env.DEV &&
  import.meta.env.VITE_USE_MOCK !== 'false';

// Cursos simulados
export const COURSES = [
  { id: 1, label: '1º Año — Sección A — Matemática' },
  { id: 2, label: '1º Año — Sección B — Matemática' },
  { id: 3, label: '2º Año — Sección A — Matemática' },
  { id: 4, label: '3º Año — Sección A — Física' },
];

// Usuarios simulados
export const INITIAL_USERS: MockUserListItem[] = [
  {
    id: 1,
    firstName: 'María',
    lastName: 'González',
    dni: '25456789',
    email: 'mgonzalez@escuela.edu',
    phone: '351 555-1234',
    username: 'mgonzalez',
    role: 'admin',
    active: true,
    courseIds: [],
  },
  {
    id: 2,
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    dni: '27123456',
    email: 'crodriguez@escuela.edu',
    phone: null,
    username: 'crodriguez',
    role: 'preceptor',
    active: true,
    courseIds: [],
  },
  {
    id: 3,
    firstName: 'Lucía',
    lastName: 'Fernández',
    dni: '30222111',
    email: 'lfernandez@escuela.edu',
    phone: '351 555-2222',
    username: 'lfernandez',
    role: 'preceptor',
    active: true,
    courseIds: [],
  },
  {
    id: 4,
    firstName: 'Jorge',
    lastName: 'Martínez',
    dni: '28333444',
    email: 'jmartinez@escuela.edu',
    phone: null,
    username: 'jmartinez',
    role: 'docente',
    active: true,
    courseIds: [1, 3],
  },
  {
    id: 5,
    firstName: 'Ana',
    lastName: 'López',
    dni: '31555666',
    email: 'alopez@escuela.edu',
    phone: '351 555-3333',
    username: 'alopez',
    role: 'preceptor',
    active: true,
    courseIds: [],
  },
  {
    id: 6,
    firstName: 'Pedro',
    lastName: 'Sánchez',
    dni: '26777888',
    email: 'psanchez@escuela.edu',
    phone: null,
    username: 'psanchez',
    role: 'docente',
    active: false,
    courseIds: [4],
  },
  {
    id: 7,
    firstName: 'Sofía',
    lastName: 'Ramírez',
    dni: '33111222',
    email: 'sramirez@escuela.edu',
    phone: '351 555-4444',
    username: 'sramirez',
    role: 'docente',
    active: true,
    courseIds: [2],
  },
  {
    id: 8,
    firstName: 'Diego',
    lastName: 'Torres',
    dni: '29444555',
    email: 'dtorres@escuela.edu',
    phone: null,
    username: 'dtorres',
    role: 'preceptor',
    active: true,
    courseIds: [],
  },
];

let users: MockUserListItem[] = [...INITIAL_USERS];
let nextId = users.length + 1;

const CONFLICT_MESSAGES = {
  email: 'El email ya está registrado',
  username: 'El nombre de usuario ya está en uso',
  dni: 'El DNI ya está registrado',
} as const;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

const fail = (
  status: number,
  error: string,
  details?: unknown,
): Response =>
  json(
    {
      success: false,
      error,
      details,
    },
    status,
  );

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const wait = (
  ms: number,
  signal?: AbortSignal | null,
): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      reject(new DOMException('Aborted', 'AbortError'));
    }

    signal?.addEventListener('abort', onAbort, { once: true });
  });

// Detectar conflictos entre usuarios simulados
const findConflict = (
  body: Body,
  excludeId?: number,
): keyof typeof CONFLICT_MESSAGES | null => {
  const others = users.filter((user) => user.id !== excludeId);

  if (
    others.some(
      (user) =>
        user.email.toLowerCase() === body.email.toLowerCase(),
    )
  ) {
    return 'email';
  }

  if (
    others.some(
      (user) =>
        user.username.toLowerCase() === body.username.toLowerCase(),
    )
  ) {
    return 'username';
  }

  if (others.some((user) => user.dni === body.dni)) {
    return 'dni';
  }

  return null;
};

// Convertir el cuerpo de la petición en un usuario simulado
const toUser = (
  id: number,
  body: Body,
): MockUserListItem => ({
  id,
  firstName: body.firstName,
  lastName: body.lastName,
  dni: body.dni,
  email: body.email,
  phone: body.phone ?? null,
  username: body.username,
  role: body.role,
  active: body.active,
  courseIds:
    body.role === 'docente' ? (body.courseIds ?? []) : [],
});

// Simulación de endpoints
function handle(
  method: string,
  url: URL,
  body?: Body,
): Response | null {
  const path = url.pathname;

  // GET /courses
  if (method === 'GET' && path === '/courses') {
    return json({
      success: true,
      data: COURSES,
    });
  }

  // GET /users
  if (method === 'GET' && path === '/users') {
    const query = url.searchParams;

    const page = Number(query.get('page') ?? 1);
    const limit = Number(query.get('limit') ?? 10);
    const search = normalize(query.get('search') ?? '');
    const role = query.get('role');
    const active = query.get('active');

    const filtered = users.filter((user) => {
      if (role && user.role !== role) {
        return false;
      }

      if (active && String(user.active) !== active) {
        return false;
      }

      if (
        search &&
        !normalize(
          `${user.firstName} ${user.lastName} ${user.email}`,
        ).includes(search)
      ) {
        return false;
      }

      return true;
    });

    return json({
      success: true,
      data: filtered.slice(
        (page - 1) * limit,
        page * limit,
      ),
      pagination: {
        page,
        limit,
        total: filtered.length,
      },
    });
  }

  // POST /users
  if (method === 'POST' && path === '/users' && body) {
    const conflict = findConflict(body);

    if (conflict) {
      return fail(
        409,
        CONFLICT_MESSAGES[conflict],
        { field: conflict },
      );
    }

    const created = toUser(nextId++, body);

    users = [created, ...users];

    return json(
      {
        success: true,
        data: created,
        message: 'Usuario creado',
      },
      201,
    );
  }

  // PUT /users/:id
  const one = path.match(/^\/users\/([^/]+)$/);

  if (one && method === 'PUT' && body) {
    const id = Number(one[1]);

    if (!users.some((user) => user.id === id)) {
      return fail(404, 'Usuario no encontrado');
    }

    const conflict = findConflict(body, id);

    if (conflict) {
      return fail(
        409,
        CONFLICT_MESSAGES[conflict],
        { field: conflict },
      );
    }

    const updated = toUser(id, body);

    users = users.map((user) =>
      user.id === id ? updated : user,
    );

    return json({
      success: true,
      data: updated,
      message: 'Usuario actualizado',
    });
  }

  // PATCH /users/:id/suspend
  // PATCH /users/:id/activate
  const toggle = path.match(
    /^\/users\/([^/]+)\/(suspend|activate)$/,
  );

  if (toggle && method === 'PATCH') {
    const id = Number(toggle[1]);

    const target = users.find(
      (user) => user.id === id,
    );

    if (!target) {
      return fail(404, 'Usuario no encontrado');
    }

    const updated: MockUserListItem = {
      ...target,
      active: toggle[2] === 'activate',
    };

    users = users.map((user) =>
      user.id === id ? updated : user,
    );

    return json({
      success: true,
      data: updated,
    });
  }

  return null;
}

// Interceptar fetch únicamente para rutas mock
if (USE_MOCK) {
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const isRequest = input instanceof Request;

    const rawUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    const url = new URL(
      rawUrl,
      window.location.origin,
    );

    // No interceptar rutas reales /api/*
    if (
      !/^\/(users|courses)(\/|$)/.test(url.pathname)
    ) {
      return realFetch(input, init);
    }

    const method = (
      init?.method ??
      (isRequest ? input.method : 'GET')
    ).toUpperCase();

    const signal =
      init?.signal ??
      (isRequest ? input.signal : undefined);

    await wait(
      300 + Math.random() * 300,
      signal,
    );

    const body =
      typeof init?.body === 'string'
        ? (JSON.parse(init.body) as Body)
        : undefined;

    return (
      handle(method, url, body) ??
      realFetch(input, init)
    );
  };

  console.info(
    '[mock] API simulada activa para /users y /courses',
  );
}
