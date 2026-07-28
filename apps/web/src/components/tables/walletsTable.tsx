import {
  ArrowUpRight,
  ArrowDownLeft,
  Phone,
  Landmark,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { TableShell } from '@cashflow/ui';
export interface WalletAccount {
  id: string;
  farmerName: string;
  farmerCode: string;
  phoneNumber: string;
  accountType: 'MOBILE_MONEY' | 'BANK_ACCOUNT';
  availableBalance: number;
  pendingBalance: number;
  lastTransaction: {
    type: 'PRODUCE_PAYOUT' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT' | 'WITHDRAWAL';
    amount: number;
    date: string;
  };
  status: 'ACTIVE' | 'FROZEN' | 'FLAGGED';
}

interface WalletsDataTableProps {
    wallets: WalletAccount[];
}
function WalletStatusBadge({ status }: { status: WalletAccount['status'] }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </span>
      );
    case 'FLAGGED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="h-3 w-3" />
          Flagged
        </span>
      );
    case 'FROZEN':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="h-3 w-3" />
          Frozen
        </span>
      );
  }
}

function TransactionTypeBadge({ type, amount }: { type: WalletAccount['lastTransaction']['type']; amount: number }) {
  const isPositive = amount > 0;
  const formattedAmount = `${isPositive ? '+' : ''}$${amount.toFixed(2)}`;

  switch (type) {
    case 'PRODUCE_PAYOUT':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
          <ArrowDownLeft className="h-3 w-3" /> Crop Payout ({formattedAmount})
        </span>
      );
    case 'LOAN_DISBURSEMENT':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
          <ArrowDownLeft className="h-3 w-3" /> Advance Disbursed ({formattedAmount})
        </span>
      );
    case 'LOAN_REPAYMENT':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700">
          <ArrowUpRight className="h-3 w-3" /> Loan Recovery ({formattedAmount})
        </span>
      );
    case 'WITHDRAWAL':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
          <ArrowUpRight className="h-3 w-3" /> Cash Out ({formattedAmount})
        </span>
      );
  }
}

export default function WalletsDataTable(props: WalletsDataTableProps) {
    return (
        <TableShell
            summary={
                <p className="text-xs text-muted-foreground">{props.wallets.length} wallet{props.wallets.length === 1 ? '' : 's'} in the directory</p>
            }>
            <table className="w-full text-left text-sm">
                <thead className="bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-3.5">Farmer & Code</th>
                        <th className="px-6 py-3.5">Payout Channel</th>
                        <th className="px-6 py-3.5 text-right">Available Balance</th>
                        <th className="px-6 py-3.5 text-right">Pending / Reserve</th>
                        <th className="px-6 py-3.5">Recent Activity</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {props.wallets.map((wallet) => (
                        <tr key={wallet.id} className="hover:bg-muted/40 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-semibold text-foreground">{wallet.farmerName}</div>
                                <div className="text-xs font-mono text-muted-foreground">{wallet.farmerCode}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5 font-medium text-foreground">
                                    {wallet.accountType === 'MOBILE_MONEY' ? (
                                        <>
                                            <Phone className="h-3.5 w-3.5 text-emerald-600" />
                                            <span>Mobile Money</span>
                                        </>
                                    ) : (
                                        <>
                                            <Landmark className="h-3.5 w-3.5 text-blue-600" />
                                            <span>Bank Wire</span>
                                        </>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground">{wallet.phoneNumber}</div>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-foreground">
                                ${wallet.availableBalance.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right font-medium">
                                {wallet.pendingBalance > 0 ? (
                                    <span className="text-amber-600">${wallet.pendingBalance.toFixed(2)}</span>
                                ) : (
                                    <span className="text-muted-foreground">$0.00</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <TransactionTypeBadge type={wallet.lastTransaction.type} amount={wallet.lastTransaction.amount} />
                                <div className="text-xs text-muted-foreground mt-0.5">{wallet.lastTransaction.date}</div>
                            </td>
                            <td className="px-6 py-4">
                                <WalletStatusBadge status={wallet.status} />
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                                    View Ledger
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableShell>
    );
}