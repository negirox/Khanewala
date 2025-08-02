import { AppShell } from '@/components/app-shell';
import { AppDataProvider } from '@/hooks/use-app-data';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppDataProvider>
      <AppShell>{children}</AppShell>
    </AppDataProvider>
  );
}
