'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    User,
    Phone,
    MapPin,
    FileText,
    Save,
    Loader2,
    Sprout,
} from 'lucide-react';
import { PageHeader } from '@cashflow/ui';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

export default function NewFarmerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const createFarmer = trpc.farmerOps.create.useMutation();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        idNumber: '',
        phone: '',
        email: '',
        address: '',
        location: '',
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Generate a human-friendly farmer code
            const farmerCode = `FARM-${Math.floor(100000 + Math.random() * 900000)}`;

            await createFarmer.mutateAsync({
                code: farmerCode,
                name: formData.name,
                phoneE164: formData.phone,
                email: formData.email || undefined,
                address: formData.address || undefined,
                location: formData.location,
                idNumber: formData.idNumber || undefined,
            });

            toast.success('Farmer registered successfully');
            router.push('/dashboard/farmers');
            router.refresh();
        } catch (error) {
            console.error('Failed to register farmer:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to register farmer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-8">
            {/* Page Header */}
            <PageHeader
                subtitle="Farmer Directory"
                title="Add New Farmer"
                description="Register a new farmer to the cooperative system and initialize their profile."
            >
                <Link
                    href="/dashboard/farmers"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground font-medium text-sm shadow-sm hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Directory
                </Link>
            </PageHeader>

            {/* Registration Form */}
            {renderform(handleSubmit, formData, handleChange, loading)}
        </div>
    );
}

function renderform(
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>,
    formData: {
        name: string;
        idNumber: string;
        phone: string;
        email: string;
        address: string;
        location: string;
    },
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
    loading: boolean
) {
    return <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal & Identity Information */}
        <div className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-foreground font-semibold border-b border-border pb-3">
                <User className="h-5 w-5 text-primary" />
                <h2>Personal &amp; Identity Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-xs font-semibold uppercase text-muted-foreground">
                        Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="e.g. John Kamau Mwangi"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div className="space-y-2">
                    <label htmlFor="idNumber" className="text-xs font-semibold uppercase text-muted-foreground">
                        National ID / Passport Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            id="idNumber"
                            name="idNumber"
                            type="text"
                            required
                            placeholder="e.g. 12345678"
                            value={formData.idNumber}
                            onChange={handleChange}
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="phone" className="text-xs font-semibold uppercase text-muted-foreground">
                        Phone Number (M-PESA / E.164) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            required
                            placeholder="+254712345678"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-semibold uppercase text-muted-foreground">
                        Email Address (Optional)
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="farmer@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
            </div>
        </div>

        {/* Section 2: Farm & Location Details */}
        <div className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-foreground font-semibold border-b border-border pb-3">
                <Sprout className="h-5 w-5 text-primary" />
                <h2>Farm &amp; Agricultural Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label htmlFor="location" className="text-xs font-semibold uppercase text-muted-foreground">
                        County / Region <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            id="location"
                            name="location"
                            type="text"
                            required
                            placeholder="e.g. Kiambu, Nyeri"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                </div>

            </div>
        </div>

        {/* Form Controls */}
        <div className="flex items-center justify-end gap-3 pt-4">
            <Link
                href="/dashboard/farmers"
                className="px-5 py-2.5 rounded-lg border border-border bg-background text-foreground font-semibold text-sm hover:bg-muted transition-colors"
            >
                Cancel
            </Link>
            <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Registering...
                    </>
                ) : (
                    <>
                        <Save className="h-4 w-4" />
                        Save &amp; Register
                    </>
                )}
            </button>
        </div>
    </form>;
}
