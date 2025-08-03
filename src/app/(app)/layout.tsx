
import { AppShell } from '@/components/app-shell';
import { AppDataProvider } from '@/hooks/use-app-data';
import { appConfigPromise } from '@/lib/config';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const appConfig = await appConfigPromise;
  return (
    <AppDataProvider initialConfig={appConfig}>
      <AppShell>{children}</AppShell>
    </AppDataProvider>
  );
}
