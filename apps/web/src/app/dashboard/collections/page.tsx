import { Scale, TrendingUp, Clock, Leaf } from 'lucide-react';
import {
  CommodityType,
  CommodityGrade,
  MeasurementUnit,
  CollectionStatus,
} from '@cashflow/database';
import { listCollections } from '@cashflow/collections';
import { getCurrentUser } from '@/lib/auth/session';

import { Collection } from '@/components/tables/collectionsTable';
import CollectionsPageClient from '@/components/dashboard/collections/collections-client';

export type { CommodityType, CommodityGrade, MeasurementUnit, CollectionStatus };

function formatKES(amount: number) {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
}

export default async function CollectionsPage({ searchParams }: PageProps) {
  const { q, status } = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: rawCollections } = await listCollections(user.tenantId, {
    search: q,
    status: status as CollectionStatus,
    limit: 100,
    ...(user.role === 'COLLECTION_AGENT' ? { agentId: user.id } : {}),
    ...(user.role === 'VIEWER' ? { viewerEmail: user.email, viewerPhone: user.phone } : {}),
  });

  const collections: Collection[] = rawCollections.map((item: any) => ({
    id: item.id,
    tenantId: item.tenantId,
    farmerId: item.farmerId,
    farmerName: item.farmer.name,
    farmerCode: item.farmer.code,
    centerId: item.centerId,
    centerName: item.center?.name ?? null,
    agentId: item.agentId,
    agentName: item.agent?.name ?? null,
    priceBookId: item.priceBookId,
    commodity: item.commodity,
    grade: item.grade,
    quantity: item.quantity.toNumber(),
    unit: item.unit,
    pricePerUnit: item.pricePerUnit.toNumber(),
    currency: item.currency,
    grossAmount: item.grossAmount.toNumber(),
    deductions: item.deductions.toNumber(),
    netAmount: item.netAmount.toNumber(),
    date: item.date.toISOString(),
    photoUrl: item.photoUrl,
    gpsLocation: item.gpsLocation,
    notes: item.notes,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    deletedAt: item.deletedAt ? item.deletedAt.toISOString() : null,
  }));

  const totalVolume = collections.reduce((a: number, c: { quantity: number }) => a + c.quantity, 0);
  const totalGrossValue = collections.reduce((a: number, c: { grossAmount: number }) => a + c.grossAmount, 0);
  const totalNetValue = collections.reduce((a: number, c: { netAmount: number }) => a + c.netAmount, 0);
  const verifiedCount = collections.filter(
    (c) => c.status === CollectionStatus.VALUATED
  ).length;
  const pendingCount = collections.filter(
    (c) => c.status === CollectionStatus.PENDING
  ).length;

  const kpis = [
    {
      label: 'Total intake',
      value: `${totalVolume.toLocaleString('en-KE', { maximumFractionDigits: 1 })} units`,
      sub: `${collections.length} batches this period`,
      icon: <Scale className="h-4 w-4" />,
      accent: 'hsl(var(--agri-leaf))',
    },
    {
      label: 'Gross value',
      value: `KES ${formatKES(totalGrossValue)}`,
      sub: 'Before deductions',
      icon: <TrendingUp className="h-4 w-4" />,
      accent: 'hsl(var(--agri-harvest))',
    },
    {
      label: 'Net payable',
      value: `KES ${formatKES(totalNetValue)}`,
      sub: `KES ${formatKES(totalGrossValue - totalNetValue)} total deductions`,
      icon: <Leaf className="h-4 w-4" />,
      accent: 'hsl(var(--agri-lime))',
    },
    {
      label: 'Pending QA',
      value: `${pendingCount} batches`,
      sub: `${verifiedCount} valuated and cleared`,
      icon: <Clock className="h-4 w-4" />,
      accent: pendingCount > 0 ? 'hsl(var(--agri-harvest))' : 'hsl(var(--agri-leaf))',
    },
  ];

  return <CollectionsPageClient collections={collections} kpis={kpis} />;
}