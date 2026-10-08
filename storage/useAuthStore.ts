import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveAuthToken, getAuthToken, removeAuthToken } from '../services/secureStore';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
}

interface AuthState {
  user: UserAccount | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (account: {
    username: string;
    password: string;
    name: string;
    email: string;
    studentId: string;
    department: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAuthSession: () => Promise<void>;
}

// ผู้ใช้เริ่มต้นสำหรับเข้าสู่ระบบทดสอบ
const INITIAL_DEMO_USER: UserAccount = {
  id: 'usr-kku-01',
  username: 'chukiat',
  name: 'นายชูเกียรติ คำมณีจันทร์',
  email: 'chukiat.ka@kkumail.com',
  studentId: '663450174-1',
  department: 'วิทยาการคอมพิวเตอร์และสารสนเทศ มข.',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: INITIAL_DEMO_USER,
      token: 'jwt-demo-token-663450174-1',
      isAuthenticated: true,
      isLoading: false,

      login: async (username, password) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 600)); // simulate network delay

        // Simple auth validation
        if (!username.trim() || !password.trim()) {
          set({ isLoading: false });
          return { success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' };
        }

        // Demo login accepted (หรือตรวจสอบ chukiat / 1234)
        const token = `jwt_token_${Date.now()}`;
        await saveAuthToken(token);

        const loggedInUser: UserAccount = {
          ...INITIAL_DEMO_USER,
          username: username.trim(),
        };

        set({
          user: loggedInUser,
          token,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true, message: 'เข้าสู่ระบบสำเร็จ' };
      },

      register: async (account) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 600));

        if (!account.username.trim() || !account.password.trim() || !account.name.trim()) {
          set({ isLoading: false });
          return { success: false, message: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' };
        }

        const token = `jwt_token_reg_${Date.now()}`;
        await saveAuthToken(token);

        const newUser: UserAccount = {
          id: `usr-${Date.now()}`,
          username: account.username.trim(),
          name: account.name.trim(),
          email: account.email.trim(),
          studentId: account.studentId.trim() || '663450174-1',
          department: account.department.trim() || 'วิทยาการคอมพิวเตอร์และสารสนเทศ',
        };

        set({
          user: newUser,
          token,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true, message: 'ลงทะเบียนสำเร็จ ยินดีต้อนรับสู่นักสำรวจ!' };
      },

      logout: async () => {
        await removeAuthToken();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuthSession: async () => {
        const token = await getAuthToken();
        if (token) {
          set({ token, isAuthenticated: true });
        } else {
          set({ token: null, isAuthenticated: false, user: null });
        }
      },
    }),
    {
      name: 'campusquest-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
