import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types/database.types';
import { db } from '../lib/databaseStore';

interface AuthContextType {
  currentUser: Profile;
  availableProfiles: Profile[];
  loginWithPin: (profileId: string, pin: string) => { success: boolean; message?: string };
  setCurrentUserRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const profiles = db.getProfiles();

  // Load from local storage or default to Garçom Marcos
  const [currentUser, setCurrentUser] = useState<Profile>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('espetinho_user_id');
      if (savedId) {
        const found = profiles.find((p) => p.id === savedId);
        if (found) return found;
      }
    }
    // Default to first waiter for quick staff experience
    return profiles.find((p) => p.role === 'garcom') || profiles[0];
  });

  const loginWithPin = (profileId: string, pin: string): { success: boolean; message?: string } => {
    const target = profiles.find((p) => p.id === profileId);
    if (!target) {
      return { success: false, message: 'Usuário não encontrado' };
    }
    if (target.pin_code && target.pin_code !== pin) {
      return { success: false, message: 'PIN incorreto. Tente novamente.' };
    }

    setCurrentUser(target);
    if (typeof window !== 'undefined') {
      localStorage.setItem('espetinho_user_id', target.id);
    }
    return { success: true };
  };

  const setCurrentUserRole = (role: UserRole) => {
    const found = profiles.find((p) => p.role === role);
    if (found) {
      setCurrentUser(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem('espetinho_user_id', found.id);
      }
    }
  };

  const logout = () => {
    const waiter = profiles.find((p) => p.role === 'garcom') || profiles[0];
    setCurrentUser(waiter);
    if (typeof window !== 'undefined') {
      localStorage.setItem('espetinho_user_id', waiter.id);
    }
  };

  useEffect(() => {
    return db.subscribe(() => {
      const updatedProfiles = db.getProfiles();
      const current = updatedProfiles.find((p) => p.id === currentUser.id);
      if (current) setCurrentUser(current);
    });
  }, [currentUser.id]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        availableProfiles: profiles,
        loginWithPin,
        setCurrentUserRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
};
