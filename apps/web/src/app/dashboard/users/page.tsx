// app/dashboard/users/page.tsx
import {
  UserCheck,
  UserPlus,
  Shield,
  ShieldCheck,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  KeyRound,
} from 'lucide-react';

import { DataTableFilterBar } from '@/components/tables/data-table-filter-bar';
import { FilterSelect } from '@/components/tables/filter-select';
import { KPI, PageHeader } from '@cashflow/ui';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'FIELD_AGENT' | 'COOP_MANAGER' | 'AUDITOR';
  assignedRegion: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  twoFactorEnabled: boolean;
  lastActive: string;
}

const mockUsers: SystemUser[] = [
  {
    id: '1',
    name: 'David Ochieng',
    email: 'david.o@cashflow.ag',
    role: 'FIELD_AGENT',
    assignedRegion: 'Nyeri Sector 4',
    status: 'ACTIVE',
    twoFactorEnabled: true,
    lastActive: '5 mins ago',
  },
  {
    id: '2',
    name: 'Sarah Hassan',
    email: 'sarah.h@cashflow.ag',
    role: 'FIELD_AGENT',
    assignedRegion: 'Murang\'a Zone 2',
    status: 'ACTIVE',
    twoFactorEnabled: true,
    lastActive: '1 hour ago',
  },
  {
    id: '3',
    name: 'Grace Kimani',
    email: 'grace.k@cashflow.ag',
    role: 'COOP_MANAGER',
    assignedRegion: 'Central Province Branch',
    status: 'ACTIVE',
    twoFactorEnabled: true,
    lastActive: '23 mins ago',
  },
  {
    id: '4',
    name: 'Andrew Ndung\'u',
    email: 'andrew.n@external-audit.com',
    role: 'AUDITOR',
    assignedRegion: 'All Operations (Read-Only)',
    status: 'INVITED',
    twoFactorEnabled: false,
    lastActive: 'Pending Invite',
  },
  {
    id: '5',
    name: 'Kevin Maina',
    email: 'kevin.m@cashflow.ag',
    role: 'ADMIN',
    assignedRegion: 'Global System',
    status: 'ACTIVE',
    twoFactorEnabled: true,
    lastActive: 'Just now',
  },
];

export default function UsersPage() {
  const kpis = [
    {
      label: 'Total Team',
      value: '24 Users',
      sub: '18 field staff, 6 administrators',
      accent: 'hsl(var(--agri-leaf))',
      icon: <UserCheck className="h-4 w-4" />,
    },
    {
      label: 'Field Agents',
      value: '14 Active',
      sub: 'Log produce across 8 centers',
      accent: 'hsl(var(--agri-lime))',
      icon: <MapPin className="h-4 w-4" />,
    },
    {
      label: '2FA Compliance',
      value: '95.8%',
      sub: '23/24 accounts secured',
      accent: 'hsl(var(--agri-leaf))',
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      label: 'Pending Invites',
      value: '1 Invite',
      sub: 'Awaiting registration sign-off',
      accent: 'hsl(var(--agri-harvest))',
      icon: <Clock className="h-4 w-4" />,
    },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
      {/* Page Header */}
      <PageHeader
        subtitle="User & Team Management"
        title="Team Access"
        description="Manage administrative access, assign field agents to collection regions, and audit roles."
      >
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:bg-primary/90 transition-colors">
          <UserPlus className="h-4 w-4" />
          Invite Team Member
        </button>
      </PageHeader>

      {/* KPI Cards */}
      <KPI kpis={kpis} />

      {/* Search & Role Filter Toolbar */}
      <DataTableFilterBar placeholder="Search team member by name or email...">
        <FilterSelect
          paramKey="role"
          options={[
            { label: 'All System Roles', value: 'ALL' },
            { label: 'Admin', value: 'ADMIN' },
            { label: 'Coop Manager', value: 'COOP_MANAGER' },
            { label: 'Field Agent', value: 'FIELD_AGENT' },
            { label: 'Auditor', value: 'AUDITOR' },
          ]}
        />
        <FilterSelect
          paramKey="status"
          options={[
            { label: 'All Account Statuses', value: 'ALL' },
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Invited', value: 'INVITED' },
            { label: 'Suspended', value: 'SUSPENDED' },
          ]}
        />
      </DataTableFilterBar>

      {/* Users & Access Data Table */}
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">User Profile</th>
                <th className="px-6 py-3.5">System Role</th>
                <th className="px-6 py-3.5">Assigned Location</th>
                <th className="px-6 py-3.5">Security & 2FA</th>
                <th className="px-6 py-3.5">Account Status</th>
                <th className="px-6 py-3.5">Last Active</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground">{user.name}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4 text-foreground font-medium">
                    <div className="flex items-center gap-1.5 text-xs">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {user.assignedRegion}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.twoFactorEnabled ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                        2FA Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <KeyRound className="h-3.5 w-3.5" />
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <UserStatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {user.lastActive}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: SystemUser['role'] }) {
  switch (role) {
    case 'ADMIN':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
          <Shield className="h-3 w-3" /> Admin
        </span>
      );
    case 'COOP_MANAGER':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          Coop Manager
        </span>
      );
    case 'FIELD_AGENT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          Field Agent
        </span>
      );
    case 'AUDITOR':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
          Auditor (Read-Only)
        </span>
      );
  }
}

function UserStatusBadge({ status }: { status: SystemUser['status'] }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" /> Active
        </span>
      );
    case 'INVITED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="h-3 w-3" /> Invited
        </span>
      );
    case 'SUSPENDED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle className="h-3 w-3" /> Suspended
        </span>
      );
  }
}