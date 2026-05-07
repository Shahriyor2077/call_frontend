export type Role = 'SUPERADMIN' | 'ADMIN' | 'OPERATOR';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  centerId?: string;
  center?: Center;
  isActive: boolean;
  salarySetting?: SalarySetting;
}

export interface Center {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  subscription?: Subscription;
  admin?: { id: string; name: string; phone: string };
  _count?: { users: number; students: number };
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  operatorLimit: number;
  durationDays: number;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  centerId: string;
  planId: string;
  plan: Plan;
  status: 'ACTIVE' | 'EXPIRED' | 'DEMO' | 'SUSPENDED';
  startDate: string;
  endDate: string;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  durationUnit: 'month' | 'hour';
  duration: number;
  price: number;
  maxStudents: number;
  isActive: boolean;
  _count?: { groups: number };
}

export interface Group {
  id: string;
  courseId: string;
  course: Course;
  name: string;
  type: 'ONLINE' | 'OFFLINE';
  status: 'GATHERING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  maxStudents: number;
  price?: number;
  meetLink?: string;
  platform?: string;
  room?: string;
  address?: string;
  days: string[];
  startTime: string;
  endTime: string;
  startDate?: string;
  endDate?: string;
  _count?: { enrollments: number };
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  interest?: string;
  source?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'ENROLLED' | 'NOT_COME' | 'REJECTED';
  notes?: string;
  operator: { id: string; name: string };
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  email?: string;
  operator: { id: string; name: string };
  enrollments: Array<{ group: Group & { course: Course }; isActive: boolean }>;
  payments: Payment[];
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  type: 'ADVANCE' | 'MONTHLY';
  method: 'CASH' | 'PAYME' | 'CLICK' | 'BANK_TRANSFER';
  isRefunded: boolean;
  notes?: string;
  paidAt: string;
  student: { id: string; name: string; phone: string };
  operator: { id: string; name: string };
}

export interface SalarySetting {
  percentage: number;
  fixedAmount: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
