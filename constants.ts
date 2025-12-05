import { SystemPhase, UserRole, User, SystemConfig } from './types';

export const STORAGE_KEYS = {
  USERS: 'tm_users',
  SELECTIONS: 'tm_selections',
  CONFIG: 'tm_config',
  CURRENT_USER: 'tm_current_user'
};

export const INITIAL_CONFIG: SystemConfig = {
  currentPhase: SystemPhase.STUDENT_SELECTION,
  defaultMaxQuota: 5
};

// Seed data for demonstration
export const SEED_USERS: User[] = [
  { id: 'admin', username: 'admin', password: '123', name: '系统管理员', role: UserRole.ADMIN },
  { id: 't1', username: 'T001', password: '123', name: '张教授', role: UserRole.TEACHER, researchArea: '人工智能与深度学习', title: '教授', maxQuota: 5 },
  { id: 't2', username: 'T002', password: '123', name: '李副教授', role: UserRole.TEACHER, researchArea: '云计算与分布式系统', title: '副教授', maxQuota: 3 },
  { id: 't3', username: 'T003', password: '123', name: '王讲师', role: UserRole.TEACHER, researchArea: 'Web前端工程化', title: '讲师', maxQuota: 4 },
  { id: 't4', username: 'T004', password: '123', name: '赵教授', role: UserRole.TEACHER, researchArea: '网络安全与密码学', title: '教授', maxQuota: 2 },
  { id: 's1', username: 'S2021001', password: '123', name: '陈同学', role: UserRole.STUDENT },
  { id: 's2', username: 'S2021002', password: '123', name: '林同学', role: UserRole.STUDENT },
  { id: 's3', username: 'S2021003', password: '123', name: '黄同学', role: UserRole.STUDENT },
  { id: 's4', username: 'S2021004', password: '123', name: '周同学', role: UserRole.STUDENT },
];