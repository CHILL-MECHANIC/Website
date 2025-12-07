import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  checkPhone,
  sendSignInOTP, 
  sendSignUpOTP, 
  verifySignInOTP, 
  verifySignUpOTP,
  resendOTP as resendOTPClient 
} from "@/services/otpClient";
import { useToast } from "@/hooks/use-toast";

export interface UserProfile {
  id: string;
  phone: string | null;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  isProfileComplete: boolean;
  authMethod: 'phone' | 'email';
  isNewUser: boolean;
}

interface AuthContextType {
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  // New separate methods
  checkPhoneExists: (phone: string) => Promise<{ exists: boolean; hasName: boolean }>;
  signUp: (phone: string) => Promise<{ error: any }>;
  signIn: (phone: string) => Promise<{ error: any; userName?: string | null }>;
  verifySignUpOtp: (phone: string, otp: string) => Promise<{ error: any; user?: UserProfile }>;
  verifySignInOtp: (phone: string, otp: string) => Promise<{ error: any; user?: UserProfile }>;
  resendOtp: (phone: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setProfile(user);
        await refreshProfile();
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  };

  const refreshProfile = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile) {
          const userProfile: UserProfile = {
            id: data.profile.id,
            phone: data.profile.phone,
            email: data.profile.email,
            fullName: data.profile.fullName,
            avatarUrl: data.profile.avatarUrl,
            isProfileComplete: data.profile.isProfileComplete,
            authMethod: data.profile.authMethod,
            isNewUser: false
          };
          setProfile(userProfile);
          localStorage.setItem('user', JSON.stringify(userProfile));
        }
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setProfile(null);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const checkPhoneExists = async (phone: string) => {
    const result = await checkPhone(phone);
    return { exists: result.exists, hasName: result.hasName };
  };

  const signUp = async (phone: string) => {
    try {
      const result = await sendSignUpOTP(phone);
      if (!result.success) {
        return { error: { message: result.error || result.message || 'Failed to send OTP' } };
      }
      return { error: null };
    } catch (error) {
      return { error: { message: error instanceof Error ? error.message : 'Failed to send OTP' } };
    }
  };

  const signIn = async (phone: string) => {
    try {
      const result = await sendSignInOTP(phone);
      if (!result.success) {
        return { error: { message: result.error || result.message || 'Failed to send OTP' } };
      }
      return { error: null, userName: result.userName };
    } catch (error) {
      return { error: { message: error instanceof Error ? error.message : 'Failed to send OTP' } };
    }
  };

  const verifySignUpOtp = async (phone: string, otp: string) => {
    try {
      const result = await verifySignUpOTP(phone, otp);

      if (!result.success) {
        return { error: { message: result.error || result.message || 'Verification failed' } };
      }

      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }

      if (result.user) {
        const userProfile: UserProfile = {
          ...result.user,
          isNewUser: true
        };

        setProfile(userProfile);
        localStorage.setItem('user', JSON.stringify(userProfile));

        toast({
          title: "Welcome to ChillMechanic!",
          description: "Please complete your profile to get started."
        });

        return { error: null, user: userProfile };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: error instanceof Error ? error.message : 'Verification failed' } };
    }
  };

  const verifySignInOtp = async (phone: string, otp: string) => {
    try {
      const result = await verifySignInOTP(phone, otp);

      if (!result.success) {
        return { error: { message: result.error || result.message || 'Verification failed' } };
      }

      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }

      if (result.user) {
        const userProfile: UserProfile = {
          ...result.user,
          isNewUser: false
        };

        setProfile(userProfile);
        localStorage.setItem('user', JSON.stringify(userProfile));

        if (userProfile.fullName) {
          toast({
            title: `Hi ${userProfile.fullName}, welcome back!`,
            description: "Great to see you again."
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have been logged in successfully."
          });
        }

        return { error: null, user: userProfile };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: error instanceof Error ? error.message : 'Verification failed' } };
    }
  };

  const resendOtp = async (phone: string) => {
    try {
      const result = await resendOTPClient(phone);
      if (!result.success) {
        return { error: { message: result.error || 'Failed to resend OTP' } };
      }
      return { error: null };
    } catch (error) {
      return { error: { message: error instanceof Error ? error.message : 'Failed to resend OTP' } };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setProfile(null);
    toast({
      title: "Signed out",
      description: "You have been signed out successfully."
    });
  };

  const isAuthenticated = !!profile;

  return (
    <AuthContext.Provider value={{
      profile,
      loading,
      isAuthenticated,
      checkPhoneExists,
      signUp,
      signIn,
      verifySignUpOtp,
      verifySignInOtp,
      resendOtp,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
