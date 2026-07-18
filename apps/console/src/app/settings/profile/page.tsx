"use client";

import { PageHeader, LoadingState, ErrorState } from "@/components/page.tsx";
import { useGatewayRequest } from "@/lib/gateway-client.tsx";
import { Card, CardContent, CardHeader, CardTitle, Input, Label } from "@operator/design-system";

export default function ProfilePage() {
  const { data, error, loading } = useGatewayRequest<{
    displayName?: string;
    handle?: string;
    email?: string;
  }>("config.get", { scope: "profile" });

  return (
    <div>
      <PageHeader title="Profile" description="Operator identity and contact details." />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Operator profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" defaultValue={data?.displayName ?? ""} placeholder="Operator" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="handle">Handle</Label>
            <Input id="handle" defaultValue={data?.handle ?? ""} placeholder="@operator" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={data?.email ?? ""} placeholder="you@example.com" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
