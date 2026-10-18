"use client";

import { AdminForm, str } from "@/components/admin/admin-form";
import { useAdmin } from "@/components/admin/admin-shell";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Card, Loading, PageHeader, inputCls, labelCls } from "@/components/admin/ui";
import { changeOwnPassword, createAdmin, listAdmins, removeAdmin, toDate, useAdminData } from "@/lib/admin-store";
import { formatDate } from "@/lib/money";

export default function UsersPage() {
  const admin = useAdmin();
  const { data: users, error, reload } = useAdminData(listAdmins);
  if (!users) return <Loading error={error} />;

  return (
    <>
      <PageHeader title="Потребители" subtitle="Кой има достъп до администрацията. Редакторите не виждат настройките." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Екип</h2>
          <ul className="divide-y divide-line text-[14px]">
            {users.map((u) => (
              <li key={u.uid} className="flex items-center justify-between py-3">
                <span>
                  <b>{u.name}</b> · {u.email}
                  <span className="block text-[12px] text-mute">
                    {u.role === "ADMIN" ? "Администратор" : "Редактор"} · последен вход {u.lastLoginAt ? formatDate(toDate(u.lastLoginAt)) : "—"}
                  </span>
                </span>
                {admin.role === "ADMIN" && u.uid !== admin.uid && (
                  <ConfirmButton message={`Да спра ли достъпа на ${u.email}?`} onConfirm={async () => (await removeAdmin(u.uid), reload())}>
                    Премахни
                  </ConfirmButton>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          {admin.role === "ADMIN" && (
            <Card>
              <h2 className="mb-4 font-semibold">Добави потребител</h2>
              <AdminForm
                submitLabel="Добави"
                successText="Потребителят е добавен. Дайте му имейла и паролата."
                resetOnSuccess
                onSubmit={async (f) => {
                  const password = String(f.get("password"));
                  if (password.length < 10) return "Паролата трябва да е поне 10 символа.";
                  await createAdmin(str(f, "name"), str(f, "email"), password, str(f, "role") === "ADMIN" ? "ADMIN" : "EDITOR");
                  reload();
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Име</label>
                    <input name="name" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Имейл</label>
                    <input name="email" type="email" required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Парола (мин. 10 символа)</label>
                    <input name="password" type="password" required minLength={10} autoComplete="new-password" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Роля</label>
                    <select name="role" className={inputCls}>
                      <option value="EDITOR">Редактор</option>
                      <option value="ADMIN">Администратор</option>
                    </select>
                  </div>
                </div>
              </AdminForm>
            </Card>
          )}
          <Card>
            <h2 className="mb-4 font-semibold">Смени моята парола</h2>
            <AdminForm
              submitLabel="Смени"
              successText="Паролата е сменена."
              resetOnSuccess
              onSubmit={async (f) => {
                const next = String(f.get("next"));
                if (next.length < 10) return "Новата парола трябва да е поне 10 символа.";
                await changeOwnPassword(String(f.get("current")), next);
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Текуща парола</label>
                  <input name="current" type="password" required autoComplete="current-password" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Нова парола</label>
                  <input name="next" type="password" required minLength={10} autoComplete="new-password" className={inputCls} />
                </div>
              </div>
            </AdminForm>
          </Card>
        </div>
      </div>
    </>
  );
}
