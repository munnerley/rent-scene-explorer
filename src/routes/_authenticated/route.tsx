import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    if (!data.user.email?.toLowerCase().endsWith("@asu.edu")) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth", search: { denied: 1 } as never });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
