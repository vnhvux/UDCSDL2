import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { seedDatabase } from './seed';
import { getMockUser, setMockUser, MockUser } from './data/mockUsers';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [mockUser, setMockUserState] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setMockUserState(getMockUser());
      setLoading(false);
      if (user) {
        // Seed the database on login (only once if empty)
        seedDatabase().catch(console.error);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      setMockUser(null);
      setMockUserState(null);
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8b0000]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <Dashboard onLogout={handleLogout} mockUser={mockUser} />
      ) : (
        <Login />
      )}
    </div>
  );
}
