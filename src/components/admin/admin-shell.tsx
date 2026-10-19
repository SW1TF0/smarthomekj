"use client";

import { usePathname } from "next/navigation";
import { createContext, Suspense, useContext, useEffect, useState } from "react";
import { adminSignIn, adminSignOut, countWhere, createFirstAdmin, useAdminAuth, type AdminProfile } from "@/lib/admin-store";
import { firebaseConfigured } from "@/lib/firebase";
import { can, permissionForPath } from "@/lib/permissions";
import { LogoMark } from "../icons";
import { AdminForm, str } from "./admin-form";
import { AdminNav } from "./admin-nav";
import { inputCls, labelCls } from "./ui";

const ProfileContext = createContext<AdminProfile | null>(null);

export function useAdmin() {
  return useContext(ProfileContext)!;
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-sm rounded-[28px] bg-white p-8 shadow-xl ring-1 ring-black/5">
        <div className="mb-6 flex items-center gap-2 text-[19px] font-semibold">
          <LogoMark size={28} /> SmartHomeKJ Admin
        </div>
        {children}
      </div>
    </div>
  );
}

function Login() {
  return (
    <AdminForm onSubmit={(f) => adminSignIn(str(f, "email"), String(f.get("password")))} submitLabel="Вход" successText="">
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
  );
}

function FirstSetup() {
  return (
    <>
      <p className="mb-4 text-[14px] text-mute">Първо пускане. Създайте акаунта на собственика. Той ще може да добавя колеги.</p>
      <AdminForm
        submitLabel="Създай акаунт"
        successText=""
        onSubmit={async (f) => {
          const password = String(f.get("password"));
          if (password.length < 10) return "Паролата трябва да е поне 10 символа.";
          await createFirstAdmin(str(f, "name"), str(f, "email"), password);
        }}
      >
        <div>
          <label className={labelCls}>Име</label>
          <input name="name" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Имейл</label>
          <input name="email" type="email" required autoComplete="username" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Парола (мин. 10 символа)</label>
          <input name="password" type="password" required minLength={10} autoComplete="new-password" className={inputCls} />
        </div>
      </AdminForm>
    </>
  );
}

function useBadges(enabled: boolean) {
  const pathname = usePathname();
  const [badges, setBadges] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!enabled) return;
    Promise.all([
      countWhere("orders", "status", ["PENDING"]),
      countWhere("inquiries", "status", ["NEW"]),
      countWhere("chats", "unreadForAdmin", [true]),
      countWhere("privacyRequests", "status", ["OPEN"]),
      countWhere("withdrawals", "status", ["RECEIVED"]),
    ])
      .then(([orders, inquiries, chats, privacy, withdrawals]) => setBadges({ orders, inquiries, chats, requests: privacy + withdrawals }))
      .catch(() => {});
  }, [enabled, pathname]);
  return badges;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const auth = useAdminAuth();
  const pathname = usePathname();
  const badges = useBadges(auth.status === "admin");

  if (!firebaseConfigured) {
    return (
      <Screen>
        <p className="text-[15px]">Базата данни още не е свързана.</p>
        <p className="mt-2 text-[14px] text-mute">Добавете настройките на Firebase в GitHub (вижте README, стъпка „Firebase“) и сайтът ще се публикува отново.</p>
      </Screen>
    );
  }
  if (auth.status === "loading") return <Screen><p className="text-mute">Зареждане…</p></Screen>;
  if (auth.status === "signedOut") return <Screen>{auth.setupDone ? <Login /> : <FirstSetup />}</Screen>;
  if (auth.status === "noAccess") {
    return (
      <Screen>
        <p className="text-[15px]">Акаунтът {auth.user.email} няма достъп до администрацията.</p>
        <button className="btn btn-sm mt-4 bg-cloud" onClick={() => adminSignOut()}>
          Изход
        </button>
      </Screen>
    );
  }

  return (
    <ProfileContext.Provider value={auth.profile}>
      <div className="min-h-screen md:flex">
        <AdminNav user={auth.profile} badges={badges} />
        <main className="min-w-0 flex-1 p-5 md:p-10">
          {(() => {
            const needed = permissionForPath(pathname.endsWith("/") ? pathname : `${pathname}/`);
            if (needed && !can(auth.profile, needed)) {
              return <p className="rounded-2xl bg-white p-8 text-center text-[15px] text-mute">Нямате достъп до тази страница. Помолете администратора да ви го даде.</p>;
            }
            return <Suspense>{children}</Suspense>;
          })()}
        </main>
      </div>
    </ProfileContext.Provider>
  );
}
