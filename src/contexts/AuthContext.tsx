import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types/database.types';
import { db } from '../lib/databaseStore';

interface AuthContextType {
  currentUser: Profile;
  setCurrentUserRole: (role: UserRole) => void;
  availableProfiles: Profile[];
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const profiles = db.getProfiles();
  const [currentUser, setCurrentUser] = useState<Profile>(profiles[0]); // Default to admin

  const setCurrentUserRole = (role: UserRole) => {
    const found = profiles.find((p) => p.role === role);
    if (found) {
      setCurrentUser(found);
    }
  };

  const logout = () => {
    // defaults back to waiter or first profile
    setCurrentUser(profiles[1]);
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
        setCurrentUserRole,
        availableProfiles: profiles,
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
