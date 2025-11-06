import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Check user role from user_roles table
            const { data: roles } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .eq("role", "admin")
              .maybeSingle();
            
            setIsAdmin(!!roles);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Auth state change error:", error);
          setIsAdmin(false);
        } finally {
          setLoading(false);
        }
      }
    );

    // Safety: ensure we never hang in loading state
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // THEN check for existing session
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        try {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            const { data: roles } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .eq("role", "admin")
              .maybeSingle();
            
              setIsAdmin(!!roles);
          }
        } catch (error) {
          console.error("Get session error:", error);
          setIsAdmin(false);
        } finally {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Get session failed:", err);
        setLoading(false);
      });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
