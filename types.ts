export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN'
}

export enum SelectionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export enum SystemPhase {
  SETUP = 'SETUP',
  STUDENT_SELECTION = 'STUDENT_SELECTION',
  TEACHER_SELECTION = 'TEACHER_SELECTION',
  COMPLETED = 'COMPLETED'
}

export interface User {
  id: string;
  username: string; // 学号或工号
  password?: string;
  name: string;
  role: UserRole;
  // Specific fields
  researchArea?: string; // For teachers
  title?: string; // For teachers
  maxQuota?: number; // For teachers
  projectExp?: string; // For students (submitted during selection)
  
  // Added fields
  gender?: string;
  phone?: string;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  name: string;
  title: string;
  school: string;
  researchDirection: string;
  qq: string;
  phone: string;
  studentSelectQuota: number;
  teacherConfirmQuota: number;
}

export interface Selection {
  id: string;
  studentId: string;
  teacherId: string;
  studentName: string;
  studentIntro: string;
  status: SelectionStatus;
  timestamp: number;
}

export interface SystemConfig {
  currentPhase: SystemPhase;
  defaultMaxQuota: number;
}