
"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useAppData } from "@/hooks/use-app-data";

const formSchema = z.object({
  appName: z.string().min(1, "App name is required"),
  logoUrl: z.string().url("Must be a valid URL.").or(z.literal("")),
  theme: z.enum(["default", "ocean", "sunset"]),
});

export function AppSettings() {
  const { toast } = useToast();
  const { appConfig } = useAppData();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appName: appConfig?.title || "",
      logoUrl: appConfig?.logo || "",
      theme: appConfig?.theme || "default",
    },
  });

  React.useEffect(() => {
      if (appConfig) {
          form.reset({
            appName: appConfig.title,
            logoUrl: appConfig.logo,
            theme: appConfig.theme as any,
          })
      }
  }, [appConfig, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real application, you would save these settings to a backend.
    // For this demo, we'll just show a toast notification and log to console.
    // This functionality is handled in the Super Admin panel.
    toast({
      title: "Settings Changed (Demo)",
      description: (
        <>
        <p>These settings are for demonstration. To persist changes, use the Super Admin panel.</p>
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
        </>
      ),
    });
    console.log("Simulating save for:", values);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold font-headline mb-4">App Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Global Configuration</CardTitle>
          <CardDescription>
            Change the name, logo, and color scheme of your application.
            <br />
            <span className="text-xs text-destructive">
              Note: Changes here are not saved. Use the Super Admin panel for persistent settings.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

              <Button type="submit">Save Settings (Demo)</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
