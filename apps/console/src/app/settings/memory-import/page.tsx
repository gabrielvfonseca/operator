"use client";

import { PageHeader } from "@/components/page.tsx";
import { Button, Textarea, Label, Card, CardContent, CardHeader, CardTitle } from "@operator/design-system";

export default function MemoryImportPage() {
  return (
    <div>
      <PageHeader title="Memory Import" description="Import memory from a file or paste." />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Import</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="memory">Memory content</Label>
            <Textarea id="memory" rows={8} placeholder="Paste memory entries here…" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">Choose file</Button>
            <Button>Import memory</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
