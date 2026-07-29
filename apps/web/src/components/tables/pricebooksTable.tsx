import { CommodityType, CommodityGrade, MeasurementUnit } from "@cashflow/database";
import { Calendar, FileText, Star, Clock, CheckCircle2, AlertCircle, MoreVertical, Copy, Trash2 } from "lucide-react";
import { TableShell } from '@cashflow/ui';

interface PriceBookLine {
  id: string;
  grade: CommodityGrade;
  unit: MeasurementUnit;
  pricePerUnit: { toString: () => string };
  currency: string;
}

interface PriceBook {
  id: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  name: string;
  deletedAt: string | null;
  commodity: CommodityType;
  isDefault: boolean;
  validFrom: string;
  validTo: string | null;
  lines: PriceBookLine[];
}

interface PriceBooksDataTableProps {
  pricebooks: PriceBook[];
  onViewLines: (id: string) => void;
  onEdit: (id: string) => void;
  onSetDefault: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function getStatusBadge(priceBook: PriceBook) {
  const now = new Date();
  const validFrom = new Date(priceBook.validFrom);
  const validTo = priceBook.validTo ? new Date(priceBook.validTo) : null;

  if (validTo && validTo < now) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <AlertCircle className="h-3 w-3" />
        Expired
      </span>
    );
  }

  if (validFrom > now) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
        <Clock className="h-3 w-3" />
        Scheduled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
      <CheckCircle2 className="h-3 w-3" />
      Active
    </span>
  );
}

function getCommodityBadgeColor(commodity: CommodityType) {
  const colors: Record<string, string> = {
    MILK: "bg-blue-100 text-blue-800 border-blue-200",
    MAIZE: "bg-yellow-100 text-yellow-800 border-yellow-200",
    COFFEE: "bg-amber-100 text-amber-800 border-amber-200",
    AVOCADO: "bg-green-100 text-green-800 border-green-200",
    MACADAMIA: "bg-purple-100 text-purple-800 border-purple-200",
    TEA: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return colors[commodity] || "bg-slate-100 text-slate-800 border-slate-200";
}

function formatDate(date: string | Date | null) {
  if (!date) return "Indefinite";
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPrice(price: { toString: () => string }) {
  const num = parseFloat(price.toString());
  return num.toFixed(4);
}

export default function PriceBookDataTable(props: PriceBooksDataTableProps) {
  return (
    <TableShell
      summary={
        <p className="text-xs text-muted-foreground">{props.pricebooks.length} price book{props.pricebooks.length === 1 ? '' : 's'} in the directory</p>
      }>
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <tr>
            <th className="px-6 py-3.5">Book Name & Status</th>
            <th className="px-6 py-3.5">Commodity</th>
            <th className="px-6 py-3.5">Line Items Preview</th>
            <th className="px-6 py-3.5">Validity Window</th>
            <th className="px-6 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {props.pricebooks.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                No price books recorded yet.
              </td>
            </tr>
          ) : props.pricebooks.map((priceBook: PriceBook) => (
            <tr key={priceBook.id} className="hover:bg-muted/40 transition-colors">
              <td className="px-6 py-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{priceBook.name}</span>
                    {priceBook.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                        <Star className="h-3 w-3 fill-current" />
                        Default
                      </span>
                    )}
                  </div>
                  {getStatusBadge(priceBook)}
                </div>
              </td>

              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${getCommodityBadgeColor(priceBook.commodity)}`}>
                  {priceBook.commodity}
                </span>
              </td>

              <td className="px-6 py-4">
                <div className="space-y-1">
                  {priceBook.lines.slice(0, 3).map((line: PriceBookLine, idx: number) => (
                    <div key={idx} className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{line.grade}</span>
                      <span className="mx-1">({line.unit})</span>
                      <span className="font-semibold text-foreground">
                        KES {formatPrice(line.pricePerUnit)}
                      </span>
                    </div>
                  ))}
                  {priceBook.lines.length > 3 && (
                    <div className="text-xs text-muted-foreground italic">
                      +{priceBook.lines.length - 3} more lines
                    </div>
                  )}
                </div>
              </td>

              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-foreground font-medium">{formatDate(priceBook.validFrom)}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-foreground font-medium">{formatDate(priceBook.validTo)}</span>
                </div>
              </td>

              <td className="px-6 py-4 text-right">
                <div className="relative inline-block">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                      dropdown.classList.toggle('hidden');
                    }}
                    className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  <div className="hidden absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => props.onViewLines(priceBook.id)}
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Lines / Details
                    </button>
                    <button
                      onClick={() => props.onEdit(priceBook.id)}
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Edit Price Book
                    </button>
                    {!priceBook.isDefault && (
                      <button
                        onClick={() => props.onSetDefault(priceBook.id)}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                      >
                        <Star className="h-4 w-4" />
                        Set as Default
                      </button>
                    )}
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => props.onDuplicate(priceBook.id)}
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate as New Version
                    </button>
                    <button
                      onClick={() => props.onDelete(priceBook.id)}
                      className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete / Archive
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}