import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userTab, setUserTab] = useState<"login" | "signup">("login");
  const [adminTab, setAdminTab] = useState<"login" | "signup">("login");

  const handleUserAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    try {
      if (userTab === "signup") {
        const validation = signupSchema.safeParse({ email, password, name });
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setLoading(false);
          return;
        }
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { name }
          }
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Email already registered. Please login instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created! You can now login.");
          setUserTab("login");
        }
      } else {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          toast.error(error.message);
        } else {
          navigate("/");
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("admin-email") as string;
    const password = formData.get("admin-password") as string;
    const name = formData.get("admin-name") as string;

    try {
      if (adminTab === "signup") {
        const validation = signupSchema.safeParse({ email, password, name });
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setLoading(false);
          return;
        }
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { name, role: 'admin' }
          }
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Email already registered. Please login instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Admin account created! You can now login.");
          setAdminTab("login");
        }
      } else {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          toast.error(error.message);
        } else if (data.user) {
          // Check if user is admin
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

          if (profile?.role === "admin") {
            navigate("/");
          } else {
            await supabase.auth.signOut();
            toast.error("Access denied. Admin credentials required.");
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-2">
            <BookOpen className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">ARKV</h1>
          </div>
          <p className="text-muted-foreground">Library Management System</p>
        </div>

        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="user">User Login</TabsTrigger>
            <TabsTrigger value="admin">Admin Login</TabsTrigger>
          </TabsList>

          <TabsContent value="user">
            <Card>
              <CardHeader>
                <CardTitle>{userTab === "login" ? "Welcome Back" : "Create Account"}</CardTitle>
                <CardDescription>
                  {userTab === "login" 
                    ? "Login to access your library account" 
                    : "Sign up to start using ARKV"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={userTab} onValueChange={(v) => setUserTab(v as "login" | "signup")}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <form onSubmit={handleUserAuth} className="space-y-4">
                    {userTab === "signup" && (
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" placeholder="John Doe" required />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="student@example.com" required />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" name="password" type="password" placeholder="••••••••" required />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {userTab === "login" ? "Login" : "Sign Up"}
                    </Button>
                  </form>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>{adminTab === "login" ? "Admin Access" : "Create Admin Account"}</CardTitle>
                <CardDescription>
                  {adminTab === "login" 
                    ? "Login with your admin credentials" 
                    : "Sign up as an administrator"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={adminTab} onValueChange={(v) => setAdminTab(v as "login" | "signup")}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <form onSubmit={handleAdminAuth} className="space-y-4">
                    {adminTab === "signup" && (
                      <div className="space-y-2">
                        <Label htmlFor="admin-name">Name</Label>
                        <Input id="admin-name" name="admin-name" placeholder="Admin Name" required />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email</Label>
                      <Input id="admin-email" name="admin-email" type="email" placeholder="admin@arkv.com" required />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Password</Label>
                      <Input id="admin-password" name="admin-password" type="password" placeholder="••••••••" required />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {adminTab === "login" ? "Admin Login" : "Create Admin Account"}
                    </Button>
                  </form>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
