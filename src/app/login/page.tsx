import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

async function authenticate(formData: FormData) {
  "use server";

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/stock",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=CredentialsSignin");
    }
    throw error;
  }
}

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const hasError = searchParams.error === "CredentialsSignin";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-neutral-900">たべごろ</h1>
        <p className="mb-6 text-sm text-neutral-500">ログインしてください</p>

        {hasError && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            メールアドレスまたはパスワードが正しくありません
          </p>
        )}

        <form action={authenticate} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            メールアドレス
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="rounded-md border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            パスワード
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="rounded-md border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-500"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
