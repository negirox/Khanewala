
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
import { saveAppSettings, uploadLogo } from "@/app/actions";
import { getAppConfig, type AppConfigData } from "@/services/config-service";

const formSchema = z.object({
  title: z.string().min(1, "App name is required"),
  logo: z.string().optional(),
  theme: z.enum(["default", "ocean", "sunset", "mint", "plum"]),
  font: z.enum(["pt-sans", "roboto-slab"]),
  dataSource: z.enum(["csv", "firebase"]),
  enabledAdminSections: z.object({
    dashboard: z.boolean(),
    menu: z.boolean(),
    staff: z.boolean(),
    customers: z.boolean(),
    settings: z.boolean(),
  }),
  gstNumber: z.string().optional(),
  currency: z.string().min(1, "Currency symbol is required"),
  maxDiscount: z.coerce.number().min(0, "Max discount cannot be negative.").max(100, "Max discount cannot be over 100."),
  loyalty: z.object({
      pointsPerCurrencyUnit: z.coerce.number().min(0, "Value must be positive."),
      currencyUnitPerPoint: z.coerce.number().min(0, "Value must be positive."),
  }),
});


export function SuperAdminSettings() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      // Fetching on the server side during initial load is fine
      // But direct import for client-side usage is not.
      // This async defaultValues pattern correctly handles this.
      return getAppConfig();
    }
  });

  const { formState } = form;

  React.useEffect(() => {
    const isLoggedIn = localStorage.getItem("superAdminLoggedIn");
    if (isLoggedIn !== "true") {
      router.replace("/super-admin/login");
    }
  }, [router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    // Construct the AppConfigData object from form values
    const settingsToSave: AppConfigData = {
        ...values,
        // Assuming some defaults for fields not in the form but in the type
        archiveFileLimit: (await getAppConfig()).archiveFileLimit, 
    };

    const result = await saveAppSettings(settingsToSave);
    setIsSaving(false);

    if (result.success) {
      toast({
        title: "Settings Saved!",
        description: "Your changes have been saved. They will be applied on the next page load.",
      });
      // Optionally, force a reload to see changes immediately
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: result.error,
      });
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('logo', file);

    const result = await uploadLogo(formData);
    setIsUploading(false);

    if (result.success && result.filePath) {
      form.setValue('logo', result.filePath);
      toast({
        title: "Logo Uploaded!",
        description: "The new logo has been uploaded. Save settings to apply it.",
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: result.error,
      });
    }
  };


  const handleLogout = () => {
    localStorage.removeItem("superAdminLoggedIn");
    router.replace("/super-admin/login");
  };

  if (formState.isLoading) {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold font-headline mb-4">Super Admin Panel</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Global Application Configuration</CardTitle>
                    <CardDescription>Loading settings...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="h-10 bg-muted rounded-md animate-pulse" />
                        <div className="h-24 bg-muted rounded-md animate-pulse" />
                        <div className="h-24 bg-muted rounded-md animate-pulse" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

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
            These settings affect the entire application. Changes saved here will be reflected globally after a page refresh.
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
                        name="title"
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
                            <Input
                              type="file"
                              className="hidden"
                              ref={fileInputRef}
                              onChange={handleLogoUpload}
                              accept="image/png, image/jpeg, image/svg+xml"
                            />
                            <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                <Upload className="mr-2 h-4 w-4" />
                                {isUploading ? "Uploading..." : "Upload"}
                            </Button>
                        </div>
                        <FormDescription>Upload a logo for your restaurant. Recommended size: 128x128px.</FormDescription>
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
                  <h3 className="text-lg font-medium mb-4">Data &amp; Financials</h3>
                  <div className="space-y-4">
                      <FormField
                          control={form.control}
                          name="dataSource"
                          render={({ field }) => (
                              <FormItem className="space-y-3">
                                  <FormLabel>Data Source</FormLabel>
                                  <FormControl>
                                      <RadioGroup
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                          className="flex flex-col space-y-1"
                                      >
                                          <FormItem className="flex items-center space-x-3 space-y-0">
                                              <FormControl><RadioGroupItem value="csv" /></FormControl>
                                              <FormLabel className="font-normal">CSV Files (Local Development Only)</FormLabel>
                                          </FormItem>
                                          <FormItem className="flex items-center space-x-3 space-y-0">
                                              <FormControl><RadioGroupItem value="firebase" /></FormControl>
                                              <FormLabel className="font-normal">Firebase (Cloud)</FormLabel>
                                          </FormItem>
                                      </RadioGroup>
                                  </FormControl>
                                  <FormDescription>
                                      Choose where the application data is stored. Firebase is required for deployed environments.
                                  </FormDescription>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
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
                          name="currency"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Currency Symbol</FormLabel>
                                  <FormControl>
                                      <Input placeholder="e.g. Rs." {...field} />
                                  </FormControl>
                                  <FormDescription>
                                      The currency symbol to be used across the application (e.g. $, €, Rs.).
                                  </FormDescription>
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
                <h3 className="text-lg font-medium mb-4">Loyalty Program</h3>
                <div className="space-y-4">
                     <FormField
                        control={form.control}
                        name="loyalty.pointsPerCurrencyUnit"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Points per Currency Unit</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} />
                            </FormControl>
                             <FormDescription>
                                How many points are earned for each unit of currency spent? (e.g., 0.01 for 1 point per 100).
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="loyalty.currencyUnitPerPoint"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Currency Value of One Point</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormDescription>
                                How much is one loyalty point worth when redeemed? (e.g., 1 for Rs. 1 per point).
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
                  {Object.keys(form.getValues('enabledAdminSections')).map((key) => (
                    <FormField
                      key={key}
                      control={form.control}
                      name={`enabledAdminSections.${key as keyof AppConfigData['enabledAdminSections']}`}
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


              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save All Settings"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
