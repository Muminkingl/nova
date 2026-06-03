"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getUsersAction,
  inviteUserAction,
  updateUserRoleAction,
  setUserActiveAction
} from "@/app/actions/users";
import { UserDirectoryEntry } from "@/lib/supabase/users";
import {
  Users,
  PlusCircle,
  Mail,
  UserCheck,
  Shield,
  Loader2,
  X,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  Trash2
} from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<UserDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // User Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<'admin' | 'staff'>("staff");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsersAction();
      if (res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error("Failed to load user directory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (!username.trim() || !fullName.trim() || !password.trim()) {
      setFormError("All fields are required.");
      return;
    }

    if (username.includes(" ") || username.includes("@")) {
      setFormError("Username cannot contain spaces or '@' symbols.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    const constructedEmail = `${username.toLowerCase().trim()}@nova.local`;

    startTransition(async () => {
      const res = await inviteUserAction(constructedEmail, fullName.trim(), role, password);
      if (!res.success) {
        setFormError(res.error || "Failed to create user account.");
      } else {
        setSuccessMsg(`User account '${username}' created successfully.`);
        setUsername("");
        setFullName("");
        setPassword("");
        setRole("staff");
        loadUsers();
        setTimeout(() => {
          setShowModal(false);
          setSuccessMsg("");
        }, 2000);
      }
    });
  };

  const handleToggleRole = async (userId: string, currentRole: 'admin' | 'staff', label: string) => {
    const nextRole = currentRole === "admin" ? "staff" : "admin";
    if (confirm(`Are you sure you want to change the role of ${label} to ${nextRole.toUpperCase()}?`)) {
      const res = await updateUserRoleAction(userId, nextRole, label);
      if (res.success) {
        loadUsers();
      } else {
        alert(res.error || "Failed to change user role.");
      }
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean, label: string) => {
    const nextActive = !currentActive;
    const actionName = nextActive ? "activate" : "deactivate";
    if (confirm(`Are you sure you want to ${actionName} ${label}?`)) {
      const res = await setUserActiveAction(userId, nextActive, label);
      if (res.success) {
        loadUsers();
      } else {
        alert(res.error || "Failed to change account status.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 overflow-y-auto pb-10 max-h-[calc(100vh-4rem)] px-8 py-6">
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage team access permissions. Invite new users, update access roles, or suspend profiles.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-95"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Invite User
        </button>
      </div>

      {/* Users table list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="h-48 flex items-center justify-center space-x-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-medium">Loading user directory...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground space-y-2 select-none">
            <Users className="w-8 h-8 opacity-45" />
            <p className="text-xs font-medium">No user records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px] select-none">
                  <th className="px-6 py-3.5">Full Name</th>
                  <th className="px-6 py-3.5">Username / Email</th>
                  <th className="px-6 py-3.5">Access Role</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {users.map((row) => (
                  <tr key={row.id} className={`hover:bg-secondary/15 transition-colors ${!row.is_active ? "opacity-60" : ""}`}>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-foreground">{row.full_name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Joined: {new Date(row.created_at).toLocaleDateString()}</div>
                    </td>
                     <td className="px-6 py-3.5 font-medium text-foreground">
                      {row.email.endsWith("@nova.local") ? (
                        <span className="font-mono bg-secondary/80 px-2 py-0.5 rounded border border-border/40 text-[11px] font-bold text-foreground">
                          {row.email.split("@")[0]}
                        </span>
                      ) : (
                        row.email
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wider select-none ${
                        row.role === "admin" 
                          ? "bg-primary/10 border-primary/20 text-foreground" 
                          : "bg-secondary border-border text-muted-foreground"
                      }`}>
                        {row.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wider select-none ${
                        row.is_active 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                          : "bg-destructive/10 border-destructive/20 text-destructive"
                      }`}>
                        {row.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-2.5">
                      {/* Change Role Button */}
                      <button
                        onClick={() => handleToggleRole(row.id, row.role, row.full_name)}
                        className="inline-flex items-center px-2 py-1 rounded bg-secondary hover:bg-secondary/80 border border-border text-[10px] font-semibold transition-all cursor-pointer shadow-sm text-foreground"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Toggle Role
                      </button>

                      {/* Deactivate/Activate Button */}
                      <button
                        onClick={() => handleToggleActive(row.id, row.is_active, row.full_name)}
                        className={`inline-flex items-center px-2 py-1 rounded border text-[10px] font-semibold transition-all cursor-pointer shadow-sm ${
                          row.is_active 
                            ? "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive hover:text-white" 
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                        }`}
                      >
                        {row.is_active ? (
                          <>
                            <Lock className="w-3 h-3 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3 mr-1" />
                            Activate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            {/* Modal Header */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-border bg-secondary/30">
              <div className="flex items-center space-x-2">
                <Users className="w-4.5 h-4.5 text-primary" />
                <span className="font-bold text-foreground text-sm uppercase tracking-tight">Create User Account</span>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormError("");
                  setSuccessMsg("");
                }}
                className="p-1 rounded-lg hover:bg-secondary border border-transparent hover:border-border transition-all cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleInvite} className="p-6 space-y-4 flex-1">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-500 rounded-lg text-xs font-medium flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 rounded-lg text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. ahmed"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Account Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              {/* Role selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-sans">Permissions Role</label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="staff">Staff Account (Restricted Access)</option>
                  <option value="admin">Administrator (Unrestricted Access)</option>
                </select>
              </div>

              {/* Submit Actions */}
              <div className="flex space-x-3 pt-2 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormError("");
                    setSuccessMsg("");
                  }}
                  className="flex-1 h-9 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-semibold transition-colors cursor-pointer select-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !username || !fullName || !password}
                  className="flex-1 h-9 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all shadow-md cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 inline-flex items-center justify-center"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
