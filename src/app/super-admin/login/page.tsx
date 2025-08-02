
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LockKeyhole, LogIn } from 'lucide-react';

const formSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// IMPORTANT: These are hardcoded for demonstration purposes only.
// In a real application, use a secure authentication system.
const SUPER_ADMIN_USERNAME = 'superadmin';
const SUPER_ADMIN_PASSWORD = 'password123';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  React.useEffect(() => {
    // If already logged in, redirect to settings
    if (localStorage.getItem('superAdminLoggedIn') === 'true') {
      router.replace('/super-admin/settings');
    }
  }, [router]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (
      values.username === SUPER_ADMIN_USERNAME &&
      values.password === SUPER_ADMIN_PASSWORD
    ) {
      // In a real app, you'd get a token from the server.
      // Here, we just set a flag in localStorage.
      localStorage.setItem('superAdminLoggedIn', 'true');
      toast({
        title: 'Login Successful',
        description: 'Redirecting to Super Admin Panel...',
      });
      router.push('/super-admin/settings');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid username or password.',
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
             <LockKeyhole /> Super Admin Login
          </CardTitle>
          <CardDescription>
            Enter your credentials to access the global configuration panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="superadmin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                <LogIn className="mr-2" />
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
             <p className="text-xs text-center text-muted-foreground">
                This is a simulated login for demonstration purposes. Do not use this method in a production environment.
             </p>
        </CardFooter>
      </Card>
    </div>
  );
}
