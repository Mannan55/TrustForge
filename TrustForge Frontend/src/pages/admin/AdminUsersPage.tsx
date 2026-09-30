import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Users, Search, ArrowLeft, Mail, Building2, Shield, Ban, UserCog } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Input, Select } from "@/components/common/Input";
import { PageSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/context/ToastContext";
import { adminService } from "@/services";
import { Table, userStatusTone, type Column } from "./shared";
import type { AdminUser, UserRole } from "@/types";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "Owner", label: "Owner" },
  { value: "Compliance Lead", label: "Compliance Lead" },
  { value: "Member", label: "Member" },
  { value: "Viewer", label: "Viewer" },
  { value: "AI Reviewer", label: "AI Reviewer" },
  { value: "Platform Admin", label: "Platform Admin" },
  { value: "Super Admin", label: "Super Admin" },
];

export function AdminUsersPage() {
  const navigate = useNavigate();
  const { data: users } = useAsync(() => adminService.users(), []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    if (!users) return [];
    return users.filter(
      (u) =>
        (status === "all" || u.status === status) &&
        (u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()) ||
          u.organization.toLowerCase().includes(query.toLowerCase())),
    );
  }, [users, query, status]);

  if (!users) return <PageSkeleton />;

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "User",
      render: (u) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-beige-light text-xs font-semibold text-emerald-deep font-display">
            {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </span>
          <div>
            <p className="font-medium text-ink">{u.name}</p>
            <p className="text-xs text-ink-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "organization", header: "Organization", hideOnMobile: true },
    { key: "role", header: "Role", render: (u) => <Badge tone="neutral">{u.role}</Badge> },
    { key: "status", header: "Status", render: (u) => <Badge tone={userStatusTone[u.status]}>{u.status}</Badge> },
    { key: "lastActive", header: "Last active", align: "right", hideOnMobile: true, render: (u) => <span className="text-ink-muted">{u.lastActive}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Tenants" title="Users" subtitle="People across all organizations, with their role and account status." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search name, email, or organization"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="sm:max-w-sm"
        />
        <Select
          options={[
            { value: "all", label: "All statuses" },
            { value: "Active", label: "Active" },
            { value: "Suspended", label: "Suspended" },
            { value: "Invited", label: "Invited" },
          ]}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:max-w-[200px]"
        />
        <span className="tabular text-sm text-ink-muted sm:ml-auto">{rows.length} of {users.length}</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No users match" description="Adjust your search or filter." />
      ) : (
        <Table columns={columns} rows={rows} onRowClick={(u) => navigate(`/admin/users/${u.id}`)} />
      )}
    </div>
  );
}

export function AdminUserDetailPage() {
  const { id } = useParams();
  const { notify } = useToast();
  const { data: user, loading } = useAsync(() => adminService.user(id!), [id]);

  if (loading) return <PageSkeleton />;
  if (!user)
    return (
      <EmptyState
        icon={<Users className="h-6 w-6" />}
        title="User not found"
        description="This account may have been removed."
        action={
          <Link to="/admin/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back to users
            </Button>
          </Link>
        }
      />
    );

  return (
    <div className="space-y-6">
      <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Users
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-deep text-lg font-semibold text-beige font-display">
            {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{user.name}</h1>
            <p className="flex items-center gap-1.5 text-sm text-ink-muted">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="neutral">{user.role}</Badge>
              <Badge tone={userStatusTone[user.status]}>{user.status}</Badge>
            </div>
          </div>
        </div>
        <Button
          variant={user.status === "Suspended" ? "primary" : "danger"}
          size="sm"
          onClick={() => notify(user.status === "Suspended" ? "User reinstated (mocked)." : "User suspended (mocked).", "warning")}
        >
          <Ban className="h-4 w-4" /> {user.status === "Suspended" ? "Reinstate" : "Suspend"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 text-ink-muted">
            <Building2 className="h-4 w-4" />
            <p className="text-sm">Organization</p>
          </div>
          <p className="mt-1.5 font-display text-lg font-semibold text-ink">{user.organization}</p>
          <p className="mt-0.5 text-sm text-ink-muted">Last active {user.lastActive}</p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-ink-muted">
            <UserCog className="h-4 w-4" />
            <p className="text-sm">Role</p>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <Select
              options={ROLE_OPTIONS}
              defaultValue={user.role}
              className="max-w-[220px]"
              onChange={() => notify("Role change is mocked in this demo.", "info")}
            />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
            <Shield className="h-3.5 w-3.5" /> Role changes are logged in the audit trail.
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent activity" eyebrow="Read-only" />
        <div className="mt-4 space-y-3">
          {["Signed in from Bengaluru, IN", "Viewed findings", "Exported an assessment report"].map((t, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-emerald-light" />
              <span className="flex-1 text-sm text-ink">{t}</span>
              <span className="text-xs text-ink-muted">{["2h ago", "1d ago", "4d ago"][i]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
