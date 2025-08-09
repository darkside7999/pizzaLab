import express, { Request, Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';

// Domain models
export type SubscriptionTier = 'VIP' | 'NORMAL';
export type CoachSpecialty = 'YOGA' | 'BOXEO' | 'ENTRENAMIENTO_FISICO';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  pricePerMonth: number;
  access: CoachSpecialty[];
}

export interface Coach {
  id: string;
  name: string;
  specialty: CoachSpecialty;
}

export interface Machine {
  id: string;
  name: string;
  quantity: number;
}

export interface PersonBase {
  id: string;
  name: string;
}

export interface Customer extends PersonBase {
  role: 'CLIENTE';
  subscriptionPlanId: string;
}

export interface Employee extends PersonBase {
  role: 'EMPLEADO' | 'JEFE';
}

export type User = Customer | Employee;

// In-memory DB (seeds with defaults)
const db = {
  plans: [] as SubscriptionPlan[],
  coaches: [] as Coach[],
  machines: [] as Machine[],
  users: [] as User[],
  settings: {
    gymName: 'Titan Gym',
    welcomeMessage: 'Bienvenido a Titan Gym — Tu progreso, nuestra misión.'
  }
};

function seed() {
  if (db.plans.length > 0) return;
  const planNormal: SubscriptionPlan = {
    id: randomUUID(),
    name: 'Plan Normal',
    tier: 'NORMAL',
    pricePerMonth: 29.9,
    access: ['ENTRENAMIENTO_FISICO']
  };
  const planVip: SubscriptionPlan = {
    id: randomUUID(),
    name: 'Plan VIP',
    tier: 'VIP',
    pricePerMonth: 59.9,
    access: ['YOGA', 'BOXEO', 'ENTRENAMIENTO_FISICO']
  };

  db.plans.push(planNormal, planVip);

  db.coaches.push(
    { id: randomUUID(), name: 'Lucía', specialty: 'YOGA' },
    { id: randomUUID(), name: 'Marco', specialty: 'BOXEO' },
    { id: randomUUID(), name: 'Sara', specialty: 'ENTRENAMIENTO_FISICO' }
  );

  db.machines.push(
    { id: randomUUID(), name: 'Cinta de correr', quantity: 10 },
    { id: randomUUID(), name: 'Bicicleta estática', quantity: 8 },
    { id: randomUUID(), name: 'Máquina de remo', quantity: 5 },
    { id: randomUUID(), name: 'Prensa de piernas', quantity: 3 }
  );

  db.users.push(
    { id: randomUUID(), name: 'Ana', role: 'JEFE' },
    { id: randomUUID(), name: 'Luis', role: 'EMPLEADO' },
    { id: randomUUID(), name: 'Marta', role: 'EMPLEADO' },
    { id: randomUUID(), name: 'Pedro', role: 'CLIENTE', subscriptionPlanId: planVip.id },
    { id: randomUUID(), name: 'Laura', role: 'CLIENTE', subscriptionPlanId: planNormal.id }
  );
}

seed();

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'api', version: '0.1.0' });
});

// Public content
app.get('/api/welcome', (_req: Request, res: Response) => {
  res.json({ gymName: db.settings.gymName, message: db.settings.welcomeMessage });
});

// Plans
app.get('/api/plans', (_req, res) => res.json(db.plans));
app.post('/api/plans', (req, res) => {
  const body = req.body as Partial<SubscriptionPlan>;
  const plan: SubscriptionPlan = {
    id: randomUUID(),
    name: body.name ?? 'Nuevo plan',
    tier: (body.tier as SubscriptionTier) ?? 'NORMAL',
    pricePerMonth: body.pricePerMonth ?? 0,
    access: (body.access as CoachSpecialty[]) ?? []
  };
  db.plans.push(plan);
  res.status(201).json(plan);
});

// Coaches
app.get('/api/coaches', (_req, res) => res.json(db.coaches));
app.post('/api/coaches', (req, res) => {
  const body = req.body as Partial<Coach>;
  const coach: Coach = {
    id: randomUUID(),
    name: body.name ?? 'Nuevo coach',
    specialty: (body.specialty as CoachSpecialty) ?? 'ENTRENAMIENTO_FISICO'
  };
  db.coaches.push(coach);
  res.status(201).json(coach);
});

// Machines
app.get('/api/machines', (_req, res) => res.json(db.machines));
app.post('/api/machines', (req, res) => {
  const body = req.body as Partial<Machine>;
  const machine: Machine = {
    id: randomUUID(),
    name: body.name ?? 'Nueva máquina',
    quantity: body.quantity ?? 1
  };
  db.machines.push(machine);
  res.status(201).json(machine);
});

// Users
app.get('/api/users', (_req, res) => res.json(db.users));
app.post('/api/users', (req, res) => {
  const body = req.body as Partial<User & { subscriptionPlanId?: string }>;
  if (body && 'role' in body && body.role === 'CLIENTE') {
    const planId = (body as any).subscriptionPlanId ?? db.plans.find(p => p.tier === 'NORMAL')?.id;
    const customer: Customer = {
      id: randomUUID(),
      name: body.name ?? 'Nuevo cliente',
      role: 'CLIENTE',
      subscriptionPlanId: planId as string
    };
    db.users.push(customer);
    return res.status(201).json(customer);
  } else {
    const employee: Employee = {
      id: randomUUID(),
      name: body.name ?? 'Nuevo empleado',
      role: (body as any).role === 'JEFE' ? 'JEFE' : 'EMPLEADO'
    };
    db.users.push(employee);
    return res.status(201).json(employee);
  }
});

// Admin: settings
app.get('/api/admin/settings', (_req, res) => res.json(db.settings));
app.put('/api/admin/settings', (req, res) => {
  const { gymName, welcomeMessage } = req.body as Partial<typeof db.settings>;
  if (typeof gymName === 'string') db.settings.gymName = gymName;
  if (typeof welcomeMessage === 'string') db.settings.welcomeMessage = welcomeMessage;
  res.json(db.settings);
});

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});