"use client";

import { useActionState } from "react";

import { Card, Input, Label, Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import type { AdminIndustry } from "@/types/admin";

import type { FormState } from "./actions";

export function IndustryForm({
  industry,
  action,
}: {
  industry?: AdminIndustry;
  action: (prev: FormState | undefined, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);

  return (
    <form action={formAction}>
      <Card className="max-w-xl space-y-4 p-5">
        <div>
          <Label htmlFor="name" required>
            Name
          </Label>
          <Input id="name" name="name" required defaultValue={industry?.name} />
        </div>
        <div>
          <Label htmlFor="tagline">Tagline</Label>
          <Input id="tagline" name="tagline" defaultValue={industry?.tagline} />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={3} defaultValue={industry?.description} />
        </div>
        <div>
          <Label htmlFor="applications">Typical applications (one per line)</Label>
          <Textarea
            id="applications"
            name="applications"
            rows={4}
            defaultValue={(industry?.applications ?? []).join("\n")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="icon">Icon (lucide name)</Label>
            <Input id="icon" name="icon" defaultValue={industry?.icon} placeholder="e.g. droplets" />
          </div>
          <div>
            <Label htmlFor="accent_color">Accent colour</Label>
            <Input id="accent_color" name="accent_color" defaultValue={industry?.accent_color} placeholder="#0C48E6" />
          </div>
          <div>
            <Label htmlFor="order">Sort order</Label>
            <Input id="order" name="order" type="number" defaultValue={industry?.order ?? 0} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={industry?.is_published ?? true} />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_featured" defaultChecked={industry?.is_featured ?? true} />
          Featured
        </label>
        <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="meta_title">SEO title</Label>
            <Input id="meta_title" name="meta_title" defaultValue={industry?.meta_title} />
          </div>
          <div>
            <Label htmlFor="meta_description">SEO description</Label>
            <Input id="meta_description" name="meta_description" defaultValue={industry?.meta_description} />
          </div>
        </div>
        {state?.error && <p className="text-sm font-medium text-rose-600">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : industry ? "Save changes" : "Create industry"}
        </Button>
      </Card>
    </form>
  );
}
