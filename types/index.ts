export interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  operatorLimit: number;
  isActive: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  centerId: string;
  planId: string;
  plan?: Plan;
  status: 'ACTIVE' | 'DEMO' | 'EXPIRED';
  startDate: string;
  endDate: string;
}

export interface Center {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  subscription?: Subscription;
  admin?: Pick<User, 'id' | 'name' | 'phone'> | null;
  _count?: {
    users: number;
    students: number;
    groups?: number;
  };
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'OPERATOR';
  centerId: string | null;
  center?: Center;
  isActive: boolean;
  createdAt: string;
}

export interface Teacher {
  id: string;
  name: string;
  phone?: string;
  specialty?: string;
  centerId: string;
  isActive: boolean;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  price?: number;
  duration?: number;
  centerId: string;
}

export interface Group {
  id: string;
  name: string;
  type: string;
  status: string;
  maxStudents: number;
  price?: number;
  days: string[];
  startTime: string;
  endTime: string;
  startDate?: string;
  endDate?: string;
  courseId: string;
  course: Course;
  teacherId?: string;
  teacher?: Pick<Teacher, 'id' | 'name' | 'specialty'>;
  centerId: string;
  isArchived: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  parentPhone?: string;
  gender?: 'MALE' | 'FEMALE';
  birthDate?: string;
  notes?: string;
  centerId: string;
  operatorId?: string;
  operator?: Pick<User, 'id' | 'name'>;
  enrollments?: Enrollment[];
  createdAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  groupId: string;
  isActive: boolean;
  enrolledAt: string;
  group?: Group;
}

export interface Payment {
  id: string;
  amount: number;
  discountAmount: number;
  type: string;
  method: string;
  isRefunded: boolean;
  notes?: string;
  paidAt: string;
  studentId: string;
  student?: Pick<Student, 'id' | 'name' | 'phone'>;
  operatorId: string;
  operator?: Pick<User, 'id' | 'name'>;
  centerId: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  interest?: string;
  source?: string;
  notes?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'ENROLLED' | 'NOT_COME' | 'REJECTED';
  centerId: string;
  operatorId: string;
  operator?: Pick<User, 'id' | 'name'>;
  createdAt: string;
}
