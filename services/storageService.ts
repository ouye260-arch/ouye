import { STORAGE_KEYS, SEED_USERS, INITIAL_CONFIG } from '../constants';
import { User, Selection, SystemConfig, UserRole, SelectionStatus } from '../types';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class StorageService {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(INITIAL_CONFIG));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SELECTIONS)) {
      localStorage.setItem(STORAGE_KEYS.SELECTIONS, JSON.stringify([]));
    }
  }

  // --- Users ---
  getUsers(): User[] {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  }

  saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  addUsers(newUsers: User[]) {
    const currentUsers = this.getUsers();
    // Filter out duplicates based on username
    const uniqueNewUsers = newUsers.filter(nu => !currentUsers.some(cu => cu.username === nu.username));
    const updatedUsers = [...currentUsers, ...uniqueNewUsers];
    this.saveUsers(updatedUsers);
    return uniqueNewUsers.length;
  }

  findUser(username: string): User | undefined {
    return this.getUsers().find(u => u.username === username);
  }

  getTeachers(): User[] {
    return this.getUsers().filter(u => u.role === UserRole.TEACHER);
  }

  // --- Selections ---
  getSelections(): Selection[] {
    const s = localStorage.getItem(STORAGE_KEYS.SELECTIONS);
    return s ? JSON.parse(s) : [];
  }

  saveSelections(selections: Selection[]) {
    localStorage.setItem(STORAGE_KEYS.SELECTIONS, JSON.stringify(selections));
  }

  // --- Config ---
  getConfig(): SystemConfig {
    const c = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return c ? JSON.parse(c) : INITIAL_CONFIG;
  }

  saveConfig(config: SystemConfig) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }

  // --- Business Logic Wrappers ---

  async login(username: string, password: string): Promise<User | null> {
    await delay(300); // Simulate network
    const user = this.findUser(username);
    if (user && user.password === password) {
      const { password, ...safeUser } = user;
      return safeUser as User;
    }
    return null;
  }

  async getTeacherStats(teacherId: string): Promise<{ current: number, max: number }> {
    const teacher = this.getUsers().find(u => u.id === teacherId);
    if (!teacher) return { current: 0, max: 0 };
    
    const selections = this.getSelections();
    // Count accepted students
    const acceptedCount = selections.filter(s => s.teacherId === teacherId && s.status === SelectionStatus.ACCEPTED).length;
    
    return {
      current: acceptedCount,
      max: teacher.maxQuota || 0
    };
  }
  
  // Get all selections related to a specific teacher
  getTeacherApplications(teacherId: string): Selection[] {
    return this.getSelections().filter(s => s.teacherId === teacherId);
  }

  // Student makes a selection
  async makeSelection(studentId: string, teacherId: string, studentName: string, intro: string): Promise<{ success: boolean; message: string }> {
    await delay(300);
    const selections = this.getSelections();
    
    // Check if student already selected someone (active selection)
    const existing = selections.find(s => s.studentId === studentId && s.status !== SelectionStatus.REJECTED);
    if (existing) {
      return { success: false, message: '您已经选择了导师，请先撤销当前选择。' };
    }

    const teacherStats = await this.getTeacherStats(teacherId);
    
    // Check quota (In simulation, we count accepted only, strictly speaking pending doesn't consume quota until accepted, 
    // but some systems block pending too. We will allow pending as long as accepted < max)
    if (teacherStats.current >= teacherStats.max) {
       return { success: false, message: '该导师名额已满。' };
    }

    const newSelection: Selection = {
      id: Date.now().toString(),
      studentId,
      teacherId,
      studentName,
      studentIntro: intro,
      status: SelectionStatus.PENDING,
      timestamp: Date.now()
    };

    selections.push(newSelection);
    this.saveSelections(selections);
    return { success: true, message: '选择成功，等待导师确认。' };
  }

  // Student cancels selection
  async cancelSelection(studentId: string): Promise<boolean> {
    await delay(200);
    let selections = this.getSelections();
    const beforeCount = selections.length;
    // Remove pending selections. If accepted, typically cannot cancel without admin, but for simplicity here we allow if config permits? 
    // Let's restrict: can only cancel if PENDING.
    selections = selections.filter(s => !(s.studentId === studentId && s.status === SelectionStatus.PENDING));
    
    if (selections.length === beforeCount) return false; // Nothing removed
    
    this.saveSelections(selections);
    return true;
  }

  // Teacher actions
  async updateSelectionStatus(selectionId: string, newStatus: SelectionStatus): Promise<boolean> {
    await delay(200);
    const selections = this.getSelections();
    const index = selections.findIndex(s => s.id === selectionId);
    if (index === -1) return false;

    const selection = selections[index];
    
    if (newStatus === SelectionStatus.ACCEPTED) {
       const stats = await this.getTeacherStats(selection.teacherId);
       if (stats.current >= stats.max) return false; // Double check quota
    }

    selections[index].status = newStatus;
    this.saveSelections(selections);
    return true;
  }

  // Admin resets
  resetSystem() {
     localStorage.clear();
     this.init();
     window.location.reload();
  }
}

export const storageService = new StorageService();