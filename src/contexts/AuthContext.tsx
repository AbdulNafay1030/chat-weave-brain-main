import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Profile } from '@/types/sidechat';
import { api } from '@/services/api';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (token?: string, googleProfile?: any, mode?: 'login' | 'signup') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { full_name?: string; avatar_url?: string }) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Check for stored session
      const storedUser = localStorage.getItem('sidechat_user');
      const storedToken = localStorage.getItem('sidechat_token');

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);

          // Verify/Refresh from backend
          try {
            const freshUser = await api.getUser(parsedUser.id);
            setUser(freshUser);
            setProfile({
              id: freshUser.id,
              email: freshUser.email,
              full_name: freshUser.name,
              avatar_url: freshUser.avatar || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            localStorage.setItem('sidechat_user', JSON.stringify(freshUser));
          } catch (apiError) {
            console.warn("Failed to refresh user from backend, using stored data", apiError);
            // Fallback to stored data if backend is down
            setUser(parsedUser);
            setProfile({
              id: parsedUser.id,
              email: parsedUser.email,
              full_name: parsedUser.name,
              avatar_url: parsedUser.avatar || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error("Failed to parse stored user", e);
          localStorage.removeItem('sidechat_user');
          localStorage.removeItem('sidechat_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { user: newUser } = await api.register(email, password, fullName);
      setUser(newUser);
      setProfile({
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.name,
        avatar_url: newUser.avatar,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      localStorage.setItem('sidechat_user', JSON.stringify(newUser));
      localStorage.setItem('sidechat_token', 'real-token');
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user: apiUser } = await api.login(email, password);
      
      // Fetch fresh user data from backend to ensure we have the latest avatar
      try {
        const freshUser = await api.getUser(apiUser.id);
        // Use fresh user data which has the latest avatar
        setUser(freshUser);
        setProfile({
          id: freshUser.id,
          email: freshUser.email,
          full_name: freshUser.name,
          avatar_url: freshUser.avatar || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        localStorage.setItem('sidechat_user', JSON.stringify(freshUser));
      } catch (fetchError) {
        // Fallback to apiUser if getUser fails
        console.warn("Failed to fetch fresh user data, using login response", fetchError);
        setUser(apiUser);
        setProfile({
          id: apiUser.id,
          email: apiUser.email,
          full_name: apiUser.name,
          avatar_url: apiUser.avatar || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        localStorage.setItem('sidechat_user', JSON.stringify(apiUser));
      }
      
      localStorage.setItem('sidechat_token', 'real-token');
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signInWithGoogle = async (token?: string, googleProfile?: any, mode: 'login' | 'signup' = 'login') => {
    try {
      if (googleProfile) {
        const { user: apiUser } = await api.googleLogin({
          email: googleProfile.email,
          name: googleProfile.name,
          avatar: googleProfile.picture,
          google_id: googleProfile.sub,
          mode: mode
        });

        // Only set Google avatar if user doesn't have one already (don't overwrite custom avatars)
        if (!apiUser.avatar && googleProfile.picture) {
          try {
            await api.updateUser(apiUser.id, { avatar: googleProfile.picture });
            apiUser.avatar = googleProfile.picture;
          } catch (err) {
            console.warn("Failed to sync Google avatar", err);
          }
        }
        // If user already has an avatar, keep it (don't overwrite with Google's)

        // Fetch fresh user data to ensure we have the latest avatar
        try {
          const freshUser = await api.getUser(apiUser.id);
          setUser(freshUser);
          setProfile({
            id: freshUser.id,
            email: freshUser.email,
            full_name: freshUser.name,
            avatar_url: freshUser.avatar || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          localStorage.setItem('sidechat_user', JSON.stringify(freshUser));
        } catch (fetchError) {
          // Fallback to apiUser if getUser fails
          console.warn("Failed to fetch fresh user data, using login response", fetchError);
          setUser(apiUser);
          setProfile({
            id: apiUser.id,
            email: apiUser.email,
            full_name: apiUser.name,
            avatar_url: apiUser.avatar || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          localStorage.setItem('sidechat_user', JSON.stringify(apiUser));
        }
        
        localStorage.setItem('sidechat_token', token || 'google-token');
        return { error: null };
      }
      return { error: new Error("No Google Data") };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await api.forgotPassword(email);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('sidechat_user');
    localStorage.removeItem('sidechat_token');
  };

  const updateProfile = async (updates: { full_name?: string; avatar_url?: string }) => {
    if (user) {
      // 1. Optimistic Update
      const updatedUser = { ...user, name: updates.full_name || user.name, avatar: updates.avatar_url || user.avatar };
      setUser(updatedUser);
      setProfile((prev) => prev ? { ...prev, full_name: updatedUser.name, avatar_url: updatedUser.avatar } : null);
      localStorage.setItem('sidechat_user', JSON.stringify(updatedUser));

      // 2. Persist to Backend
      try {
        await api.updateUser(user.id, {
          name: updates.full_name,
          avatar: updates.avatar_url
        });
      } catch (e) {
        console.error("Failed to persist profile update", e);
        return { error: e as Error };
      }
    }
    return { error: null };
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const freshUser = await api.getUser(user.id);
        setUser(freshUser);
        setProfile({
          id: freshUser.id,
          email: freshUser.email,
          full_name: freshUser.name,
          avatar_url: freshUser.avatar || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        localStorage.setItem('sidechat_user', JSON.stringify(freshUser));
      } catch (error) {
        console.error("Failed to refresh profile", error);
      }
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
    forgotPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
