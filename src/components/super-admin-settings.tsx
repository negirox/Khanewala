
"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { appConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Switch } from "./ui/switch";
import { useRouter } from "next/navigation";
import { Separator } from "./ui/separator";

const formSchema = z.object({
  appName: z.string().min(1, "App name is required"),
  logoUrl: z.string().url("Must be a valid URL.").or(z.literal("")),
  theme: z.enum(["default", "ocean", "sunset"]),
  gstNumber: z.string().optional(),
  maxDiscount: z.coerce.number().min(0, "Max discount cannot be negative.").max(100, "Max discount cannot be over 100."),
  enabledAdminSections: z.object({
    dashboard: z.boolean(),
    menu: z.boolean(),
    staff: z.boolean(),
    customers: z.boolean(),
    settings: z.boolean(),
  }),
});

export function SuperAdminSettings() {
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    const isLoggedIn = localStorage.getItem("superAdminLoggedIn");
    if (isLoggedIn !== "true") {
      router.replace("/super-admin/login");
    }
  }, [router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appName: appConfig.title,
      logoUrl: "", // Assuming logo is a component, so URL is for display only
      theme: "default",
      gstNumber: appConfig.gstNumber || "",
      maxDiscount: appConfig.maxDiscount,
      enabledAdminSections: appConfig.enabledAdminSections,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real application, you would save these settings to a backend.
    // For this demo, we'll just show a toast notification.
    toast({
      title: "Settings Saved!",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    });
    console.log("Simulating save for:", values);
  }

  const handleLogout = () => {
    localStorage.removeItem("superAdminLoggedIn");
    router.replace("/super-admin/login");
  };

  return (
    <div className="max-w-4xl mx-auto">
       <div className="flex justify-between items-center mb-4">
         <h1 className="text-3xl font-bold font-headline">Super Admin Panel</h1>
         <Button variant="outline" onClick={handleLogout}>Logout</Button>
       </div>
      <Card>
        <CardHeader>
          <CardTitle>Global Application Configuration</CardTitle>
          <CardDescription>
            These settings affect the entire application. Changes saved here will be reflected globally.
            <br />
            <span className="text-xs text-destructive">
              Note: This is a UI demonstration. Changes are not persisted across restarts.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Branding Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Branding & Appearance</h3>
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="appName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Restaurant Name</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g. KhaneWala" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Logo URL</FormLabel>
                            <FormControl>
                            <Input
                                placeholder="https://example.com/logo.png"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="theme"
                        render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Color Theme</FormLabel>
                            <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                            >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                    <RadioGroupItem value="default" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                    Default (Yellow, Red, Green)
                                </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                    <RadioGroupItem value="ocean" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                    Oceanic Blues
                                </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                    <RadioGroupItem value="sunset" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                    Sunset Oranges
                                </FormLabel>
                                </FormItem>
                            </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
              </div>

              <Separator />

              {/* Financial Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Financial Settings</h3>
                <div className="space-y-4">
                     <FormField
                        control={form.control}
                        name="gstNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>GST Number</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. 27ABCDE1234F1Z5" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="maxDiscount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Maximum Discount (%)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g. 25" {...field} />
                            </FormControl>
                            <FormDescription>
                                The highest discount percentage that can be applied to an order.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
              </div>
              
              <Separator />

              {/* Admin Menu Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Admin Menu Sections</h3>
                <div className="space-y-4 p-4 border rounded-lg">
                  {Object.keys(appConfig.enabledAdminSections).map((key) => (
                    <FormField
                      key={key}
                      control={form.control}
                      name={`enabledAdminSections.${key as keyof typeof appConfig.enabledAdminSections}`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>{key.charAt(0).toUpperCase() + key.slice(1)}</FormLabel>
                            <FormDescription>
                              Enable or disable the {key} section in the admin panel.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>


              <Button type="submit">Save All Settings</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
