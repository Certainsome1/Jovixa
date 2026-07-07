import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/login-form";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams?: {
    redirectTo?: string;
    error?: string;
  };
};

function safeRedirectPath(path?: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <LoginForm
      authError={searchParams?.error}
      redirectTo={safeRedirectPath(searchParams?.redirectTo)}
    />
  );
}
