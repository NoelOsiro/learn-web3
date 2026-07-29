import { CreditStatus } from "@prisma/client";
import { Calendar, FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { TableShell } from '@cashflow/ui';

interface LoansDataTableProps {
  loans: {
    id: string;
    loanNumber: string;
    borrowerName: string;
    borrowerCode: string;
    loanType: string;
    principalAmount: number;
    outstandingBalance: number;
    interestRate: number;
    collateralCoverage: number;
    status: CreditStatus;
    dueDate: string;
  }[];
}
function LoanStatusBadge({ status }: { status: CreditStatus }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <CheckCircle2 className="h-3 w-3" />
          Approved
        </span>
      );
    case 'DEFAULTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="h-3 w-3" />
          Defaulted
        </span>
      );
    case 'PAID':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
          <CheckCircle2 className="h-3 w-3" />
          Fully Paid
        </span>
      );
  }
}

export default function LoansDataTable(props: LoansDataTableProps) {
  return (
    <TableShell
      summary={
        <p className="text-xs text-muted-foreground">{props.loans.length} loan{props.loans.length === 1 ? '' : 's'} in the directory</p>
      }>
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <tr>
            <th className="px-6 py-3.5">Loan ID</th>
            <th className="px-6 py-3.5">Borrower Details</th>
            <th className="px-6 py-3.5">Facility Purpose</th>
            <th className="px-6 py-3.5 text-right">Balance / Principal</th>
            <th className="px-6 py-3.5 text-center">Collateral Coverage</th>
            <th className="px-6 py-3.5">Status</th>
            <th className="px-6 py-3.5">Due Date</th>
            <th className="px-6 py-3.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {props.loans.length === 0 ? <tr>
            <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
              No loan facilities recorded yet.
            </td>
          </tr> : props.loans.map(loan => <tr key={loan.id} className="hover:bg-muted/40 transition-colors">
            <td className="px-6 py-4 font-mono font-medium text-foreground">
              {loan.loanNumber}
            </td>
            <td className="px-6 py-4">
              <div className="font-semibold text-foreground">{loan.borrowerName}</div>
              <div className="text-xs text-muted-foreground">{loan.borrowerCode}</div>
            </td>
            <td className="px-6 py-4 text-foreground font-medium">
              {loan.loanType}
              <div className="text-xs text-muted-foreground">{loan.interestRate}% Interest</div>
            </td>
            <td className="px-6 py-4 text-right">
              <div className="font-semibold text-foreground">
                KES {loan.outstandingBalance.toLocaleString('en-US', {
                  minimumFractionDigits: 2
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                of KES {loan.principalAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2
                })}
              </div>
            </td>
            <td className="px-6 py-4 text-center">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${loan.collateralCoverage >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {loan.collateralCoverage}% Covered
              </span>
            </td>
            <td className="px-6 py-4">
              <LoanStatusBadge status={loan.status} />
            </td>
            <td className="px-6 py-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {loan.dueDate}
              </div>
            </td>
            <td className="px-6 py-4 text-right">
              <button className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                <FileText className="h-3.5 w-3.5" /> Details
              </button>
            </td>
          </tr>)}
        </tbody>
      </table>
    </TableShell>
  );
}