"use client";

import { useEffect, useState, useTransition } from "react";
import { getSettingsAction, updateSettingsAction } from "@/app/actions/settings";
import { Settings } from "@/types";
import {
  Settings as SettingsIcon,
  Building,
  MapPin,
  Phone,
  Coins,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("IQD");

  // Notifications
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await getSettingsAction();
      if (res.data) {
        setSettings(res.data);
        setCompanyName(res.data.company_name);
        setAddress(res.data.address || "");
        setPhone(res.data.phone || "");
        setCurrency(res.data.currency || "IQD");
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!companyName.trim()) {
      setErrorMsg("Company Name is required.");
      return;
    }

    startTransition(async () => {
      const res = await updateSettingsAction({
        company_name: companyName.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        currency: currency.trim() || "IQD",
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to update configuration settings.");
      } else {
        setSuccessMsg("Settings updated successfully.");
        if (res.data) {
          setSettings(res.data);
        }
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 overflow-y-auto pb-10 max-h-[calc(100vh-4rem)] px-8 py-6">
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure default company metadata printed on customer invoice sheets.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center space-x-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-xs font-medium">Loading settings...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main settings form */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider mb-6 flex items-center">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Company Details Configuration
            </h2>

            <form onSubmit={handleSave} className="space-y-5">
              {errorMsg && (
                <div className="p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-lg text-xs font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 rounded-lg text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Company Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Nova Medical"
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              {/* Company Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Erbil, Kurdistan Region, Iraq"
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Company Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Support Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0750-XXX-XXXX"
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* System Currency */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Default Currency
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Coins className="w-4 h-4" />
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="IQD">Iraqi Dinar (IQD)</option>
                    <option value="USD">US Dollar (USD)</option>
                  </select>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-border/60">
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-9 px-6 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all shadow-md cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 inline-flex items-center"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    "Save Configurations"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right sidebar info */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5 select-none text-xs text-muted-foreground space-y-3 shadow-sm">
              <h3 className="font-bold text-foreground text-[10px] uppercase tracking-wider">Configuration Metadata</h3>
              <p>The company name, address, and support phone will populate dynamically on printed invoices and PDF statements generated by both admins and staff members.</p>
              <p>All pricing fields, debt metrics, and transaction summaries utilize the default currency label configured here.</p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/40 border border-border/60 text-xs text-muted-foreground flex items-center space-x-3 select-none">
              <Info className="w-4.5 h-4.5 text-primary shrink-0 animate-pulse" />
              <span>
                Settings updates are logged to the Activity Log for compliance audits.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
