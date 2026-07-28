import { CollectionStatus, CommodityGrade, CommodityType, MeasurementUnit } from "@cashflow/database";
import { AlertCircle, CheckCircle2, Clock, Leaf, MapPin, MoreVertical, TrendingUp, User, XCircle } from "lucide-react";
import { TableShell } from '@cashflow/ui';

function getCommodityMeta(type: string) {
    return COMMODITY_META[type] ?? { label: type, unit: 'u', accent: '#888' };
}

function formatKES(amount: number) {
    return new Intl.NumberFormat('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}
export interface Collection {
    id: string;
    tenantId: string;
    farmerId: string;
    farmerName: string;
    farmerCode: string;
    centerId?: string | null;
    centerName?: string | null;
    agentId?: string | null;
    agentName?: string | null;
    priceBookId?: string | null;
    commodity: CommodityType;
    grade: CommodityGrade;
    quantity: number;
    unit: MeasurementUnit;
    pricePerUnit: number;
    currency: string;
    grossAmount: number;
    deductions: number;
    netAmount: number;
    date: string;
    photoUrl?: string | null;
    gpsLocation?: string | null;
    notes?: string | null;
    status: CollectionStatus;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}

// ─── Commodity display metadata ───────────────────────────────────────────────
const COMMODITY_META: Record<
    string,
    { label: string; unit: string; accent: string }
> = {
    MILK: { label: 'Milk', unit: 'L', accent: '#1A7BB4' },
    COFFEE: { label: 'Coffee', unit: 'kg', accent: '#6B3E26' },
    TEA: { label: 'Tea', unit: 'kg', accent: '#2D6A4F' },
    AVOCADO: { label: 'Avocado', unit: 'kg', accent: '#40916C' },
    MACADAMIA: { label: 'Macadamia', unit: 'kg', accent: '#B5835A' },
    MAIZE: { label: 'Maize', unit: 'kg', accent: '#E9C46A' },
};

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: CollectionStatus }) {
    const cfg = {
        [CollectionStatus.VALUATED]: {
            icon: <CheckCircle2 className="h-3 w-3" />,
            label: 'Valuated',
            cls: 'bg-[#E8F5EE] text-[#1A6B3C] border-[#B3DEC4]',
        },
        [CollectionStatus.PENDING]: {
            icon: <Clock className="h-3 w-3" />,
            label: 'Pending QA',
            cls: 'bg-[#FEF6E4] text-[#8B5E0A] border-[#F5D68A]',
        },
        [CollectionStatus.PAID]: {
            icon: <TrendingUp className="h-3 w-3" />,
            label: 'Paid',
            cls: 'bg-[#EAF2FB] text-[#1A4E8B] border-[#B3CFF0]',
        },
        [CollectionStatus.CANCELLED]: {
            icon: <XCircle className="h-3 w-3" />,
            label: 'Cancelled',
            cls: 'bg-[#FEF0EE] text-[#8B2210] border-[#F5C4BC]',
        },
    };

    const s = cfg[status] ?? {
        icon: <AlertCircle className="h-3 w-3" />,
        label: status,
        cls: 'bg-gray-100 text-gray-600 border-gray-200',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide border ${s.cls}`}
            style={{ letterSpacing: '0.04em' }}
        >
            {s.icon}
            {s.label}
        </span>
    );
}

// ─── Grade pill ────────────────────────────────────────────────────────────────
function GradePill({ grade }: { grade: string }) {
    const gradeMap: Record<string, string> = {
        GRADE_A: 'A',
        GRADE_B: 'B',
        GRADE_C: 'C',
        PREMIUM: 'P',
        STANDARD: 'S',
        REJECT: 'R',
    };
    const gradeColor: Record<string, string> = {
        GRADE_A: '#1A6B3C',
        PREMIUM: '#1A6B3C',
        GRADE_B: '#8B5E0A',
        STANDARD: '#8B5E0A',
        GRADE_C: '#8B2210',
        REJECT: '#8B2210',
    };
    const label = gradeMap[grade] ?? grade.slice(0, 2);
    const color = gradeColor[grade] ?? '#555';

    return (
        <span
            className="inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-black border"
            style={{
                color,
                borderColor: color + '55',
                backgroundColor: color + '12',
            }}
        >
            {label}
        </span>
    );
}

const renderNoCollections = <tr>
    <td
        colSpan={11}
        className="px-6 py-16 text-center"
        style={{ color: '#9AADA0' }}
    >
        <Leaf className="h-8 w-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">No collections logged yet</p>
        <p className="text-xs mt-1">
            Field agents can submit intakes from the mobile app.
        </p>
    </td>
</tr>;


interface Iprops {
    collections: Collection[],
}

export default function CollectionsTable({ collections }: Iprops) {
    return (
        <TableShell
              summary={
                <p className="text-xs text-muted-foreground">{collections.length} collection{collections.length === 1 ? '' : 's'} in the directory</p>
                }>
<table className="w-full text-left text-sm">
                    <thead>
                        <tr style={{ borderBottom: '1px solid #D4DDD5' }}>
                            {[
                                { label: 'Farmer', align: 'left' },
                                { label: 'Commodity', align: 'left' },
                                { label: 'Date', align: 'left' },
                                { label: 'Quantity', align: 'right' },
                                { label: 'Rate / unit', align: 'right' },
                                { label: 'Gross', align: 'right' },
                                { label: 'Deductions', align: 'right' },
                                { label: 'Net payable', align: 'right' },
                                { label: 'Agent', align: 'left' },
                                { label: 'Status', align: 'left' },
                                { label: '', align: 'right' },
                            ].map((col) => (
                                <th
                                    key={col.label}
                                    className={`px-5 py-3 font-semibold text-[10px] tracking-[0.1em] uppercase ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                                    style={{ color: '#7A8C7D' }}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {collections.length === 0 ? (
                            renderNoCollections
                        ) : (
                            collections.map((col: any, idx: number) => {
                                const meta = getCommodityMeta(col.commodity);
                                return (
                                    <tr
                                        key={col.id}
                                        style={{
                                            borderBottom: idx < collections.length - 1 ? '1px solid #EAE8E2' : 'none',
                                        }}
                                        className="transition-colors hover:bg-[#F5F2EB]/70 group"
                                    >
                                        {/* Farmer */}
                                        <td className="px-5 py-4">
                                            <p
                                                className="font-semibold text-sm leading-tight"
                                                style={{ color: '#1A2B1E' }}
                                            >
                                                {col.farmerName}
                                            </p>
                                            <p
                                                className="text-[11px] mt-0.5 font-mono"
                                                style={{ color: '#9AADA0' }}
                                            >
                                                {col.farmerCode}
                                            </p>
                                        </td>

                                        {/* Commodity + grade */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: meta.accent }}
                                                />
                                                <span
                                                    className="font-medium text-sm"
                                                    style={{ color: '#1A2B1E' }}
                                                >
                                                    {meta.label}
                                                </span>
                                                <GradePill grade={col.grade} />
                                            </div>
                                            {col.centerName && (
                                                <div
                                                    className="flex items-center gap-1 mt-0.5 text-[11px]"
                                                    style={{ color: '#9AADA0' }}
                                                >
                                                    <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                                                    {col.centerName}
                                                </div>
                                            )}
                                        </td>

                                        {/* Date */}
                                        <td
                                            className="px-5 py-4 text-sm"
                                            style={{
                                                color: '#5A6E5E',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}
                                        >
                                            {formatDate(col.date)}
                                        </td>

                                        {/* Quantity */}
                                        <td
                                            className="px-5 py-4 text-right font-bold text-sm"
                                            style={{
                                                color: '#1A2B1E',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}
                                        >
                                            {col.quantity.toLocaleString('en-KE', {
                                                maximumFractionDigits: 2,
                                            })}
                                            <span
                                                className="text-[10px] font-normal ml-1"
                                                style={{ color: '#9AADA0' }}
                                            >
                                                {col.unit}
                                            </span>
                                        </td>

                                        {/* Rate */}
                                        <td
                                            className="px-5 py-4 text-right text-sm"
                                            style={{
                                                color: '#5A6E5E',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}
                                        >
                                            {formatKES(col.pricePerUnit)}
                                        </td>

                                        {/* Gross */}
                                        <td
                                            className="px-5 py-4 text-right text-sm font-medium"
                                            style={{
                                                color: '#1A2B1E',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}
                                        >
                                            {formatKES(col.grossAmount)}
                                        </td>

                                        {/* Deductions */}
                                        <td
                                            className="px-5 py-4 text-right text-sm"
                                            style={{ fontVariantNumeric: 'tabular-nums' }}
                                        >
                                            {col.deductions > 0 ? (
                                                <span style={{ color: '#B55E0A' }}>
                                                    − {formatKES(col.deductions)}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#C5C9C6' }}>—</span>
                                            )}
                                        </td>

                                        {/* Net payable */}
                                        <td
                                            className="px-5 py-4 text-right font-bold text-sm"
                                            style={{
                                                color: '#1A6B3C',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}
                                        >
                                            KES {formatKES(col.netAmount)}
                                        </td>

                                        {/* Agent */}
                                        <td className="px-5 py-4">
                                            <div
                                                className="flex items-center gap-1.5 text-sm"
                                                style={{ color: '#5A6E5E' }}
                                            >
                                                <User className="h-3.5 w-3.5 flex-shrink-0" />
                                                {col.agentName ?? 'Direct'}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-4">
                                            <StatusBadge status={col.status} />
                                        </td>

                                        {/* Action */}
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ color: '#7A8C7D' }}
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                </TableShell>

    );
}