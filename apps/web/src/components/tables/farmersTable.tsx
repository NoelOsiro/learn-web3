import {
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MoreVertical,
  Wallet,
} from 'lucide-react';
import { TableShell } from '@cashflow/ui';

export type KYCStatus = 'VERIFIED' | 'PENDING' | 'SUSPENDED';

export interface FarmerUI {
  id: string;
  farmerCode: string;
  name: string;
  phone: string;
  location: string;
  primaryCrop: string;
  acreage: number;
  walletBalance: number;
  activeLoan: number;
  kycStatus: KYCStatus;
  joinedDate: string;
}

export interface FarmersTableProps {
  farmers: FarmerUI[];
}

export function FarmersTable({ farmers }: FarmersTableProps) {
  return (
    <TableShell
      summary={
        <p className="text-xs text-muted-foreground">{farmers.length} farmer{farmers.length === 1 ? '' : 's'} in the directory</p>
        }>
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <tr>
            <th className="px-6 py-3.5">Farmer Profile</th>
            <th className="px-6 py-3.5">Contact &amp; Location</th>
            <th className="px-6 py-3.5">Joined</th>
            <th className="px-6 py-3.5 text-right">Wallet Balance</th>
            <th className="px-6 py-3.5 text-right">Active Loan</th>
            <th className="px-6 py-3.5">KYC Status</th>
            <th className="px-6 py-3.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {farmers.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                No registered farmers found.
              </td>
            </tr>
          ) : (
            farmers.map((farmer) => (
              <tr key={farmer.id} className="hover:bg-muted/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-foreground">{farmer.name}</div>
                  <div className="text-xs font-mono text-muted-foreground">{farmer.farmerCode}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-foreground">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {farmer.phone}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    {farmer.location}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-muted-foreground">
                  {farmer.joinedDate}
                </td>
                <td className="px-6 py-4 text-right font-semibold text-foreground">
                  <div className="flex items-center justify-end gap-1">
                    <Wallet className="h-3.5 w-3.5 text-primary" />
                    KES {farmer.walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-semibold">
                  {farmer.activeLoan > 0 ? (
                    <span className="text-amber-600">
                      KES {farmer.activeLoan.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">KES 0.00</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <KYCBadge status={farmer.kycStatus} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableShell>
  );
}

function KYCBadge({ status }: { status: KYCStatus }) {
  switch (status) {
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" />
          Verified
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    case 'SUSPENDED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="h-3 w-3" />
          Suspended
        </span>
      );
  }
}
