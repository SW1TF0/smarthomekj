import { redirect } from "next/navigation";
import { AdminForm } from "@/components/admin/admin-form";
import { inputCls, labelCls } from "@/components/admin/ui";
import { LogoMark } from "@/components/icons";
import { getAdmin } from "@/lib/auth";
import { login } from "../actions";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-sm rounded-[28px] bg-white p-8 shadow-xl ring-1 ring-black/5">
        <div className="mb-6 flex items-center gap-2 text-[19px] font-semibold">
          <LogoMark size={28} /> SmartHomeKJ Admin
        </div>
        <AdminForm action={login} submitLabel="Вход">
          <div>
            <label className={labelCls} htmlFor="email">
              Имейл
            </label>
            <input id="email" name="email" type="email" required autoComplete="username" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="password">
              Парола
            </label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className={inputCls} />
          </div>
        </AdminForm>
      </div>
    </div>
  );
}
