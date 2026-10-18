import { AdminForm } from "@/components/admin/admin-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Card, PageHeader, inputCls, labelCls } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/money";
import { changePassword, createAdminUser, deleteAdminUser } from "../actions";

export default async function UsersPage() {
  const admin = await requireAdmin();
  const users = await db.adminUser.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <>
      <PageHeader title="Потребители" subtitle="Кой има достъп до администрацията. Редакторите не виждат настройките." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Екип</h2>
          <ul className="divide-y divide-line text-[14px]">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-3">
                <span>
                  <b>{u.name}</b> · {u.email}
                  <span className="block text-[12px] text-mute">
                    {u.role === "ADMIN" ? "Администратор" : "Редактор"} · последен вход {u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}
                  </span>
                </span>
                {admin.role === "ADMIN" && u.id !== admin.sub && (
                  <form action={deleteAdminUser.bind(null, u.id)}>
                    <ConfirmButton message={`Да премахна ли ${u.email}?`}>Премахни</ConfirmButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          {admin.role === "ADMIN" && (
            <Card>
              <h2 className="mb-4 font-semibold">Добави потребител</h2>
              <AdminForm action={createAdminUser} submitLabel="Добави" successText="Потребителят е добавен.">
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
                    <input name="password" type="password" required minLength={10} className={inputCls} />
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
            <AdminForm action={changePassword} submitLabel="Смени" successText="Паролата е сменена.">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Текуща парола</label>
                  <input name="current" type="password" required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Нова парола</label>
                  <input name="next" type="password" required minLength={10} className={inputCls} />
                </div>
              </div>
            </AdminForm>
          </Card>
        </div>
      </div>
    </>
  );
}
