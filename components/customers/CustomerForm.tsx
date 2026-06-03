"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Customer } from "@/types";
import { createCustomerAction, updateCustomerAction } from "@/app/actions/customers";
import {
  Save,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Building
} from "lucide-react";
import Link from "next/link";

const TYPES = ["hospital", "clinic", "pharmacy", "other"];

export default function CustomerForm({ customer }: { customer?: Customer }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(customer?.name || "");
  const [type, setType] = useState<Customer["type"]>(customer?.type || "hospital");
  const [contactPerson, setContactPerson] = useState(customer?.contact_person || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [address, setAddress] = useState(customer?.address || "");
  const [notes, setNotes] = useState(customer?.notes || "");

  const isEditMode = !!customer;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Customer Name is required.");
      return;
    }

    const payload = {
      name: name.trim(),
      type,
      contact_person: contactPerson.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    };

    startTransition(async () => {
      try {
        if (isEditMode) {
          const { error: err } = await updateCustomerAction(customer.id, payload);
          if (err) {
            setError(err.message || "Failed to update customer.");
          } else {
            router.push("/dashboard/customers");
          }
        } else {
          const { error: err } = await createCustomerAction(payload);
          if (err) {
            setError(err.message || "Failed to create customer.");
          } else {
            router.push("/dashboard/customers");
          }
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="max-w-2xl bg-card border border-border rounded-xl shadow-md p-6 sm:p-8 select-none">
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">
          {isEditMode ? `Edit Profile: ${customer.name}` : "Add New Customer"}
        </h2>
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to list
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Customer Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground" htmlFor="customer-name">
            Customer Name / Facility Title <span className="text-red-500">*</span>
          </label>
          <input
            id="customer-name"
            type="text"
            required
            placeholder="e.g. Erbil Royal Hospital"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm placeholder:text-muted-foreground/75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground transition-colors disabled:opacity-50"
          />
        </div>

        {/* 2. Customer Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground" htmlFor="customer-type">
            Buyer Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select
              id="customer-type"
              value={type}
              onChange={(e) => setType(e.target.value as Customer["type"])}
              disabled={isPending}
              className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-8 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground cursor-pointer capitalize"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Contact Person & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="contact-person">
              Contact Person
            </label>
            <input
              id="contact-person"
              type="text"
              placeholder="e.g. Dr. Mohammed Kamal"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              disabled={isPending}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm placeholder:text-muted-foreground/75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground transition-colors disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="phone">
              Phone Number
            </label>
            <input
              id="phone"
              type="text"
              placeholder="e.g. +964 750 987 6543"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isPending}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm placeholder:text-muted-foreground/75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground transition-colors disabled:opacity-50 font-mono"
            />
          </div>
        </div>

        {/* 4. Address */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground" htmlFor="address">
            Facility Address
          </label>
          <input
            id="address"
            type="text"
            placeholder="e.g. Bakhtiyari District, Erbil, Iraq"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isPending}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm placeholder:text-muted-foreground/75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground transition-colors disabled:opacity-50"
          />
        </div>

        {/* 5. Notes */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground" htmlFor="notes">
            Internal Notes / Contract terms
          </label>
          <textarea
            id="notes"
            rows={4}
            placeholder="Record general delivery agreements, discount schemes, or debt limit thresholds..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isPending}
            className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm placeholder:text-muted-foreground/75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground transition-colors disabled:opacity-50 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-border flex justify-end gap-3 select-none">
          <Link
            href="/dashboard/customers"
            className="inline-flex items-center justify-center h-10 px-4 py-2 font-medium text-sm rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center h-10 px-4 py-2 font-medium text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 cursor-pointer shadow-md select-none active:scale-[0.98]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditMode ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditMode ? "Save Customer" : "Create Customer"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
