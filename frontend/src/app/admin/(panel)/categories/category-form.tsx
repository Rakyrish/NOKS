"use client";

import { useActionState } from "react";

import { Card, Input, Label, Select, Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import type { AdminCategory } from "@/types/admin";

import type { FormState } from "./actions";

export function CategoryForm({
  category,
  categories,
  action,
}: {
  category?: AdminCategory;
  categories: AdminCategory[];
  action: (prev: FormState | undefined, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const otherCategories = categories.filter((c) => c.id !== category?.id);

  return (
    <form action={formAction}>
      <Card className="max-w-xl space-y-4 p-5">
        <div>
          <Label htmlFor="name" required>
            Name
          </Label>
          <Input id="name" name="name" required defaultValue={category?.name} />
        </div>
        <div>
          <Label htmlFor="parent">Parent category</Label>
          <Select id="parent" name="parent" defaultValue={category?.parent ?? ""}>
            <option value="">None (top level)</option>
            {otherCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={3} defaultValue={category?.description} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="icon">Icon (lucide name)</Label>
            <Input id="icon" name="icon" defaultValue={category?.icon} placeholder="e.g. beaker" />
          </div>
          <div>
            <Label htmlFor="order">Sort order</Label>
            <Input id="order" name="order" type="number" defaultValue={category?.order ?? 0} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={category?.is_published ?? true} />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_featured" defaultChecked={category?.is_featured ?? false} />
          Featured on homepage
        </label>
        <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="meta_title">SEO title</Label>
            <Input id="meta_title" name="meta_title" defaultValue={category?.meta_title} />
          </div>
          <div>
            <Label htmlFor="meta_description">SEO description</Label>
            <Input id="meta_description" name="meta_description" defaultValue={category?.meta_description} />
          </div>
        </div>
        {state?.error && <p className="text-sm font-medium text-rose-600">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : category ? "Save changes" : "Create category"}
        </Button>
      </Card>
    </form>
  );
}
