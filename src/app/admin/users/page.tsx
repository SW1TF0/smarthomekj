"use client";

import { AdminForm, str } from "@/components/admin/admin-form";
import { useAdmin } from "@/components/admin/admin-shell";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Card, Loading, PageHeader, inputCls, labelCls } from "@/components/admin/ui";
import { useState } from "react";
import { changeOwnPassword, createAdmin, listAdmins, removeAdmin, toDate, updateAdminAccess, useAdminData, type AdminProfile, type AdminRole } from "@/lib/admin-store";
import { formatDate } from "@/lib/money";
import { PERMISSIONS, permissionsOf, type Permission } from "@/lib/permissions";

const readPermissions = (f: FormData) => PERMISSIONS.map((p) => p.key).filter((k) => f.get(`perm_${k}`) === "on");

/** Role picker plus one checkbox per admin section; the checkboxes only matter for team members. */
function AccessFields({ role: initialRole = "EDITOR", permissions = [] }: { role?: AdminRole; permissions?: Permission[] }) {
  const [role, setRole] = useState<AdminRole>(initialRole);
  return (
    <div className="sm:col-span-2">
      <label className={labelCls}>Роля</label>
      <select name="role" value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className={inputCls}>
        <option value="EDITOR">Служител: вижда само избраното</option>
        <option value="ADMIN">Администратор: вижда и променя всичко</option>
      </select>
      {role === "EDITOR" && (
        <fieldset className="mt-3">
          <legend className={labelCls}>Какво може да вижда и променя</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PERMISSIONS.map((p) => (
              <label key={p.key} className="flex items-center gap-2 text-[14px]">
                <input type="checkbox" name={`perm_${p.key}`} defaultChecked={permissions.includes(p.key)} /> {p.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}

function roleText(u: AdminProfile) {
  if (u.role === "ADMIN") return "Администратор (всичко)";
  const labels = PERMISSIONS.filter((p) => permissionsOf(u).includes(p.key)).map((p) => p.label);
  return `Служител: ${labels.length ? labels.join(", ") : "нищо"}`;
}

export default function UsersPage() {
  const admin = useAdmin();
  const [editing, setEditing] = useState("");
  const { data: users, error, reload } = useAdminData(listAdmins);
  if (!users) return <Loading error={error} />;

  return (
    <>
      <PageHeader title="Потребители" subtitle="Кой има достъп до администрацията и какво може да вижда." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Екип</h2>
          <ul className="divide-y divide-line text-[14px]">
            {users.map((u) => (
              <li key={u.uid} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <b>{u.name}</b> · {u.email}
                    <span className="block text-[12px] text-mute">
                      {roleText(u)} · последен вход {u.lastLoginAt ? formatDate(toDate(u.lastLoginAt)) : "—"}
                    </span>
                  </span>
                  {admin.role === "ADMIN" && u.uid !== admin.uid && (
                    <span className="flex shrink-0 gap-2">
                      <button className="btn btn-sm bg-cloud" onClick={() => setEditing(editing === u.uid ? "" : u.uid)}>
                        {editing === u.uid ? "Затвори" : "Права"}
                      </button>
                      <ConfirmButton message={`Да спра ли достъпа на ${u.email}?`} onConfirm={async () => (await removeAdmin(u.uid), reload())}>
                        Премахни
                      </ConfirmButton>
                    </span>
                  )}
                </div>
                {editing === u.uid && (
                  <AdminForm
                    className="mt-3 space-y-4 rounded-2xl bg-cloud p-4"
                    submitLabel="Запази правата"
                    successText="Правата са сменени. Важат при следващото отваряне на админ панела."
                    onSubmit={async (f) => {
                      await updateAdminAccess(u.uid, str(f, "role") === "ADMIN" ? "ADMIN" : "EDITOR", readPermissions(f));
                      reload();
                    }}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <AccessFields role={u.role} permissions={permissionsOf(u)} />
                    </div>
                  </AdminForm>
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
                  await createAdmin(str(f, "name"), str(f, "email"), password, str(f, "role") === "ADMIN" ? "ADMIN" : "EDITOR", readPermissions(f));
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
                  <AccessFields />
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
