
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
import { Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const formSchema = z.object({
  appName: z.string().min(1, "App name is required"),
  theme: z.enum(["default", "ocean", "sunset", "mint", "plum"]),
  font: z.enum(["pt-sans", "roboto-slab"]),
  enabledAdminSections: z.object({
    dashboard: z.boolean(),
    menu: z.boolean(),
    staff: z.boolean(),
    customers: z.boolean(),
    settings: z.boolean(),
  }),
  gstNumber: z.string().optional(),
  maxDiscount: z.coerce.number().min(0, "Max discount cannot be negative.").max(100, "Max discount cannot be over 100."),
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
      theme: "default",
      font: "pt-sans",
      enabledAdminSections: appConfig.enabledAdminSections,
      gstNumber: appConfig.gstNumber || "",
      maxDiscount: appConfig.maxDiscount,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
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
                    
                    <FormItem>
                        <FormLabel>Logo</FormLabel>
                        <div className="flex items-center gap-2">
                            <Input type="file" className="flex-1" disabled/>
                            <Button variant="outline" type="button" disabled>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload
                            </Button>
                        </div>
                        <FormDescription>Upload a logo for your restaurant. Image uploads are not implemented in this demo.</FormDescription>
                    </FormItem>

                    <FormField
                      control={form.control}
                      name="font"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Application Font</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a font" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pt-sans">PT Sans (Sans-serif)</SelectItem>
                              <SelectItem value="roboto-slab">Roboto Slab (Serif)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            This will change the main font used throughout the application.
                          </FormDescription>
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
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl><RadioGroupItem value="default" /></FormControl>
                                  <FormLabel className="font-normal">Default (Yellow, Red, Green)</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl><RadioGroupItem value="ocean" /></FormControl>
                                  <FormLabel className="font-normal">Oceanic Blues</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl><RadioGroupItem value="sunset" /></FormControl>
                                  <FormLabel className="font-normal">Sunset Oranges</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl><RadioGroupItem value="mint" /></FormControl>
                                  <FormLabel className="font-normal">Cool Mint</FormLabel>
                                </FormItem>
                                 <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl><RadioGroupItem value="plum" /></FormControl>
                                  <FormLabel className="font-normal">Royal Plum</FormLabel>
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
