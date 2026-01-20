"use client";
/*
import { useMemo, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { userService } from "@/services/user-service"
import { useToast } from "@/components/ui/use-toast"
import { getTextSize } from "@/lib/text-sizes"
import { Shield, Building, Users, Mail, User, Sparkles, KeyRound, ShieldCheck, Lock } from "lucide-react"

export default function AccountPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const roleLabel = useMemo(() => {
    if (!user?.role) return "Member"
    return user.role
      .replace(/ROLE_/g, "")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }, [user?.role])

  const primaryCompanyName = useMemo(() => {
    if (user?.companyName) {
      return user.companyName
    }
    if (Array.isArray(user?.companies) && user.companies.length > 0) {
      return user.companies[0].name ?? "Worldwide"
    }
    return "Worldwide"
  }, [user?.companyName, user?.companies])

  const primaryClientName = useMemo(() => {
    const metadata = user?.metadata ?? {}
    if (typeof metadata === "object" && metadata) {
      const typedMetadata = metadata as Record<string, unknown>
      const clientName =
        (typedMetadata.clientName as string | undefined) ??
        (typedMetadata.client_name as string | undefined) ??
        (typedMetadata.client?.name as string | undefined)
      if (clientName) {
        return clientName
      }
    }
    return "All clients"
  }, [user?.metadata])

  const detailItems = [
    { label: "Username", value: user?.username ?? "-", icon: User },
    { label: "Email", value: user?.email ?? "Not provided", icon: Mail },
    { label: "Role", value: roleLabel, icon: Shield },
    {
      label: "Primary company",
      value: primaryCompanyName,
      icon: Building,
    },
    {
      label: "Assigned client",
      value: primaryClientName,
      icon: Users,
    },
  ]

  const quickStats = [
    {
      label: "Sessions this week",
      value: "18",
      accent: "from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-300",
    },
    {
      label: "APIs used",
      value: "6 integrations",
      accent: "from-purple-500/20 to-purple-500/5 text-purple-600 dark:text-purple-300",
    },
    {
      label: "Last login",
      value: new Date().toLocaleString(),
      accent: "from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-300",
    },
  ]

  const securityChecklist = [
    { label: "Two-factor enabled", status: true },
    { label: "Password updated recently", status: false },
    { label: "Device verification", status: true },
  ]

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (!oldPassword || !newPassword || !confirmPassword) {
      setFormError("Please fill in all password fields.")
      return
    }

    if (newPassword !== confirmPassword) {
      setFormError("New password and confirmation do not match.")
      return
    }

    setIsSubmitting(true)
    try {
      await userService.updatePassword({
        oldPassword,
        newPassword,
      })
      toast({
        title: "Password updated",
        description: "Your password was changed successfully.",
      })
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update password. Please try again."
      setFormError(message)
      toast({
        title: "Password update failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900/80 dark:to-gray-900 min-h-screen">
      <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white/50">
                <AvatarFallback className="bg-white/10 text-white text-2xl">
                  {user?.username?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-semibold">{user?.username ?? "User"}</h1>
                  <Badge className="bg-white/20 text-white hover:bg-white/30">
                    {roleLabel}
                  </Badge>
                </div>
                <p className="text-sm text-white/80">
                  {primaryCompanyName} • {primaryClientName}
                </p>
              </div>
            </div>
            <div className="flex-1 max-w-lg">
              <div className="flex items-center justify-between text-sm text-white/80 mb-2">
                <span>Profile completeness</span>
                <span>82%</span>
              </div>
              <Progress value={82} className="h-2 bg-white/20" />
              <p className="mt-2 text-xs text-white/80 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Keep your profile updated to unlock advanced
                personalization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickStats.map((stat) => (
          <Card
            key={stat.label}
            className={`border-none shadow-sm bg-gradient-to-br ${stat.accent}`}
          >
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</p>
              <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-md border border-gray-100 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className={getTextSize("formTitle")}>Account overview</CardTitle>
              <CardDescription>Session data pulled from your active context</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Live sync
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {detailItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {item.label}
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-md border border-gray-100 dark:border-gray-800">
            <CardHeader>
              <CardTitle className={getTextSize("formTitle")}>Update password</CardTitle>
              <CardDescription>Enhance account security regularly.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={oldPassword}
                    onChange={(event) => setOldPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>
                {formError && (
                  <Badge variant="destructive" className="w-full justify-center whitespace-normal">
                    {formError}
                  </Badge>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Save secure password"}
                </Button>
              </form>
              <Separator className="my-4" />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <KeyRound className="h-4 w-4" />
                Password changes require your current credentials for verification.
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border border-gray-100 dark:border-gray-800">
            <CardHeader>
              <CardTitle className={getTextSize("formTitle")}>Security status</CardTitle>
              <CardDescription>Stay on top of best practices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {securityChecklist.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {item.status ? (
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Lock className="h-5 w-5 text-amber-500" />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </span>
                  </div>
                  <Badge variant={item.status ? "secondary" : "outline"}>
                    {item.status ? "Enabled" : "Pending"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}*/
export default function accountpage() {
  return (
    <>
      <h1>accounts page</h1>
    </>
  );
}
