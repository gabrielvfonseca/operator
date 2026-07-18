"use client";

import { PageHeader } from "@/components/page.tsx";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@operator/design-system";

export default function NewSessionPage() {
  return (
    <div>
      <PageHeader title="New Session" description="Start a new conversation or agent run." />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal">Goal</Label>
            <Input id="goal" placeholder="What should the agent do?" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent">Agent</Label>
            <Input id="agent" placeholder="default" />
          </div>
          <Button>Create session</Button>
        </CardContent>
      </Card>
    </div>
  );
}
