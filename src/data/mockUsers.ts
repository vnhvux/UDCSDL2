export interface MockUser {
  username: string;
  password?: string;
  role: 'student' | 'lecturer' | 'qldt' | 'qlcsvc';
  displayName: string;
  email: string;
}

export const MOCK_USERS: Record<string, MockUser> = {
  '11243876': {
    username: '11243876',
    password: 'qnggvnhh',
    role: 'student',
    displayName: 'Sinh viên NEU',
    email: '11243876@st.neu.edu.vn'
  },
  'vinhlt': {
    username: 'vinhlt',
    password: 'ivinhlee',
    role: 'lecturer',
    displayName: 'Lê Tuấn Vinh',
    email: 'vinhlt@gv.neu.edu.vn'
  },
  'nguyenluutuong': {
    username: 'nguyenluutuong',
    password: 'luutong1012',
    role: 'qldt',
    displayName: 'Lưu Tường Nguyên',
    email: 'nguyenluutuong@qldt.neu.edu.vn'
  },
  'dqvinh@csvc.neu.edu.vn': {
    username: 'dqvinh@csvc.neu.edu.vn',
    password: 'dqvinh',
    role: 'qlcsvc',
    displayName: 'Đinh Quang Vinh',
    email: 'dqvinh@csvc.neu.edu.vn'
  }
};

export const getMockUser = (): MockUser | null => {
  const userStr = localStorage.getItem('mockUser');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const setMockUser = (user: MockUser | null) => {
  if (user) {
    localStorage.setItem('mockUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('mockUser');
  }
};
