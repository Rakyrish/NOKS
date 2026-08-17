"use client";

import { Sparkles } from "lucide-react";
import { useActionState, useState, useTransition } from "react";

import { Badge, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import type { AdminManufacturer, AdminProduct } from "@/types/admin";
import type { Category, Industry } from "@/types";

import { generateDraft, type FormState } from "./actions";
import { AVAILABILITY_CHOICES, GRADE_CHOICES } from "./choices";
import { ImageUrlField } from "./image-url-field";

type Draftable = {
  chemical_formula: string;
  synonyms: string;
  grade: string;
  purity: string;
  short_description: string;
  description: string;
  applications: string; // newline-joined in the form
  benefits: string;
  specifications: string; // "Key: Value" per line
  packaging_options: string;
  meta_title: string;
  meta_description: string;
};

function toDraftable(product?: AdminProduct): Draftable {
  return {
    chemical_formula: product?.chemical_formula ?? "",
    synonyms: product?.synonyms ?? "",
    grade: product?.grade ?? "industrial",
    purity: product?.purity ?? "",
    short_description: product?.short_description ?? "",
    description: product?.description ?? "",
    applications: (product?.applications ?? []).join("\n"),
    benefits: (product?.benefits ?? []).join("\n"),
    specifications: Object.entries(product?.specifications ?? {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
    packaging_options: (product?.packaging_options ?? []).join("\n"),
    meta_title: product?.meta_title ?? "",
    meta_description: product?.meta_description ?? "",
  };
}

function AiDraftPanel({
  name,
  categoryId,
  imageUrl,
  onImageUrlChange,
  onNameChange,
  onDraft,
}: {
  name: string;
  categoryId: number | null;
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  onNameChange: (name: string) => void;
  onDraft: (draft: Draftable, confidenceNote: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const [cas, setCas] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    if (!name.trim() && !imageUrl.trim()) {
      setError("Enter a product name or paste a photo URL — the AI needs at least one to work from.");
      return;
    }
    setError(null);
    const hadNoName = !name.trim();
    startTransition(async () => {
      try {
        const draft = await generateDraft({
          name: name || undefined,
          cas_number: cas || undefined,
          category_id: categoryId ?? undefined,
          notes: notes || undefined,
          image_url: imageUrl || undefined,
        });
        if (hadNoName && draft.suggested_name) {
          onNameChange(draft.suggested_name);
        }
        onDraft(
          {
            chemical_formula: draft.chemical_formula,
            synonyms: draft.synonyms,
            grade: draft.grade,
            purity: draft.purity,
            short_description: draft.short_description,
            description: draft.description,
            applications: draft.applications.join("\n"),
            benefits: draft.benefits.join("\n"),
            specifications: Object.entries(draft.specifications)
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n"),
            packaging_options: draft.packaging_options.join("\n"),
            meta_title: draft.meta_title,
            meta_description: draft.meta_description,
          },
          draft.confidence_note,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "AI drafting failed.");
      }
    });
  };

  return (
    <Card className="border-dashed border-brand-200 bg-brand-50/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-[var(--brand-primary)]" />
        <h3 className="font-display text-sm font-bold text-ink">Generate with AI</h3>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-muted-fg">
        Drafts description, applications, benefits, reference specifications and SEO title/
        description — from the product name, a photo, or both. Paste a photo URL and it becomes
        vision input as well as the product&apos;s actual photo once saved: the AI reads whatever
        it can off the label (product name if you haven&apos;t typed one yet, grade, net weight,
        appearance). It never writes GHS hazard class, hazard statements, UN number or
        storage/handling, even if visible on the label — enter those yourself from the
        supplier&apos;s SDS. Review every field before publishing.
      </p>

      <div className="mb-3">
        <Label htmlFor="image_url">Product photo URL (optional, used for the photo and for AI vision)</Label>
        <ImageUrlField name="image_url" defaultValue={imageUrl} onValueChange={onImageUrlChange} />
        <p className="mt-1 text-xs text-muted-fg">
          Fetched and stored on our own media storage when you save the product — not
          hot-linked from the source.
        </p>
      </div>

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="ai-cas">CAS number (optional, improves accuracy)</Label>
          <Input id="ai-cas" value={cas} onChange={(e) => setCas(e.target.value)} placeholder="e.g. 10043-52-4" />
        </div>
        <div>
          <Label htmlFor="ai-notes">Notes for the AI (optional)</Label>
          <Input
            id="ai-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. focus on water treatment use"
          />
        </div>
      </div>
      {error && <p className="mb-3 text-xs font-medium text-rose-600">{error}</p>}
      <Button type="button" variant="outline" size="sm" onClick={run} disabled={pending}>
        {pending ? (imageUrl ? "Reading photo & drafting…" : "Drafting…") : "Generate draft"}
      </Button>
    </Card>
  );
}

export function ProductForm({
  product,
  categories,
  industries,
  manufacturers,
  action,
}: {
  product?: AdminProduct;
  categories: Category[];
  industries: Industry[];
  manufacturers: AdminManufacturer[];
  action: (prev: FormState | undefined, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState<number | null>(product?.category ?? null);
  const [imageUrl, setImageUrl] = useState("");
  const [draft, setDraft] = useState<Draftable>(toDraftable(product));
  const [confidenceNote, setConfidenceNote] = useState("");
  const [fromAi, setFromAi] = useState(false);

  const flatCategories = categories.flatMap((c) => [c, ...(c.children ?? [])]);

  return (
    <form action={formAction} className="space-y-6">
      {!product && (
        <AiDraftPanel
          name={name}
          categoryId={categoryId}
          imageUrl={imageUrl}
          onImageUrlChange={setImageUrl}
          onNameChange={setName}
          onDraft={(d, note) => {
            setDraft(d);
            setConfidenceNote(note);
            setFromAi(true);
          }}
        />
      )}
      {fromAi && <input type="hidden" name="_from_ai_draft" value="on" />}
      {confidenceNote && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>AI note:</strong> {confidenceNote}
        </p>
      )}

      <Card className="space-y-4 p-5">
        <h3 className="font-display text-sm font-bold text-ink">Identity</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name" required>
              Product name
            </Label>
            <Input
              id="name"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="category" required>
              Category
            </Label>
            <Select
              id="category"
              name="category"
              required
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Select a category</option>
              {flatCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Select id="manufacturer" name="manufacturer" defaultValue={product?.manufacturer ?? ""}>
              <option value="">Not specified</option>
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="cas_number">CAS number</Label>
            <Input id="cas_number" name="cas_number" defaultValue={product?.cas_number} />
          </div>
          <div>
            <Label htmlFor="hs_code">HS code</Label>
            <Input id="hs_code" name="hs_code" defaultValue={product?.hs_code} />
          </div>
        </div>
        <div>
          <Label>Industries</Label>
          <div className="flex flex-wrap gap-2">
            {industries.map((i) => (
              <label
                key={i.id}
                className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[13px] has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50"
              >
                <input
                  type="checkbox"
                  name="industries"
                  value={i.id}
                  defaultChecked={product?.industries.includes(i.id)}
                  className="size-3.5"
                />
                {i.name}
              </label>
            ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="font-display text-sm font-bold text-ink">Chemistry</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="chemical_formula">Chemical formula</Label>
            <Input
              id="chemical_formula"
              name="chemical_formula"
              value={draft.chemical_formula}
              onChange={(e) => setDraft({ ...draft, chemical_formula: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="synonyms">Synonyms</Label>
            <Input
              id="synonyms"
              name="synonyms"
              value={draft.synonyms}
              onChange={(e) => setDraft({ ...draft, synonyms: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="grade">Grade</Label>
            <Select
              id="grade"
              name="grade"
              value={draft.grade}
              onChange={(e) => setDraft({ ...draft, grade: e.target.value })}
            >
              {GRADE_CHOICES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="purity">Purity</Label>
            <Input
              id="purity"
              name="purity"
              placeholder="e.g. ≥ 98%"
              value={draft.purity}
              onChange={(e) => setDraft({ ...draft, purity: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="specifications">Specifications (one &quot;Name: Value&quot; per line)</Label>
          <Textarea
            id="specifications"
            name="specifications"
            rows={4}
            value={draft.specifications}
            onChange={(e) => setDraft({ ...draft, specifications: e.target.value })}
          />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="font-display text-sm font-bold text-ink">Content</h3>
        <div>
          <Label htmlFor="short_description" required>
            Short description (catalog card, ~1 sentence)
          </Label>
          <Input
            id="short_description"
            name="short_description"
            required
            maxLength={300}
            value={draft.short_description}
            onChange={(e) => setDraft({ ...draft, short_description: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="description">Full description</Label>
          <Textarea
            id="description"
            name="description"
            rows={6}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="applications">Applications (one per line)</Label>
            <Textarea
              id="applications"
              name="applications"
              rows={5}
              value={draft.applications}
              onChange={(e) => setDraft({ ...draft, applications: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="benefits">Benefits (one per line)</Label>
            <Textarea
              id="benefits"
              name="benefits"
              rows={5}
              value={draft.benefits}
              onChange={(e) => setDraft({ ...draft, benefits: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="packaging_options">Packaging options (one per line)</Label>
          <Textarea
            id="packaging_options"
            name="packaging_options"
            rows={3}
            value={draft.packaging_options}
            onChange={(e) => setDraft({ ...draft, packaging_options: e.target.value })}
          />
        </div>
      </Card>

      <Card className="space-y-4 border-rose-100 bg-rose-50/40 p-5">
        <div>
          <h3 className="font-display text-sm font-bold text-ink">Safety — manual entry only</h3>
          <p className="mt-1 text-xs text-muted-fg">
            Enter this directly from the supplier&apos;s Safety Data Sheet. AI drafting never
            fills these fields.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="hazard_class">GHS hazard class</Label>
            <Input id="hazard_class" name="hazard_class" defaultValue={product?.hazard_class} />
          </div>
        </div>
        <div>
          <Label htmlFor="safety_information">Hazard statements / safety information</Label>
          <Textarea
            id="safety_information"
            name="safety_information"
            rows={3}
            defaultValue={product?.safety_information}
          />
        </div>
        <div>
          <Label htmlFor="storage_handling">Storage &amp; handling</Label>
          <Textarea
            id="storage_handling"
            name="storage_handling"
            rows={3}
            defaultValue={product?.storage_handling}
          />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="font-display text-sm font-bold text-ink">Commercial &amp; availability</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="availability">Availability</Label>
            <Select id="availability" name="availability" defaultValue={product?.availability ?? "in_stock"}>
              {AVAILABILITY_CHOICES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" name="unit" defaultValue={product?.unit ?? "kg"} />
          </div>
          <div>
            <Label htmlFor="min_order_quantity">Min. order quantity</Label>
            <Input
              id="min_order_quantity"
              name="min_order_quantity"
              type="number"
              min={1}
              defaultValue={product?.min_order_quantity ?? 1}
            />
          </div>
          <div>
            <Label htmlFor="lead_time">Lead time</Label>
            <Input id="lead_time" name="lead_time" placeholder="e.g. 2–5 working days" defaultValue={product?.lead_time} />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" name="currency" defaultValue={product?.currency ?? "KES"} />
          </div>
          <div>
            <Label htmlFor="indicative_price">Indicative price (optional)</Label>
            <Input id="indicative_price" name="indicative_price" type="number" step="0.01" defaultValue={product?.indicative_price ?? ""} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="price_on_request" defaultChecked={product?.price_on_request ?? true} />
          Price on request (no price shown publicly)
        </label>
      </Card>

      <Card className="space-y-3 p-5">
        <h3 className="font-display text-sm font-bold text-ink">Publication</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={product?.is_published ?? false} />
          Published (visible on the public site)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured ?? false} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_bestseller" defaultChecked={product?.is_bestseller ?? false} />
          Bestseller
        </label>
        {product?.ai_generated && (
          <Badge variant="outline" size="sm">
            Originally created from an AI draft
          </Badge>
        )}
        <div className="grid gap-4 pt-2 sm:grid-cols-2">
          <div>
            <Label htmlFor="meta_title">SEO title (optional, ~50-60 characters)</Label>
            <Input
              id="meta_title"
              name="meta_title"
              maxLength={180}
              value={draft.meta_title}
              onChange={(e) => setDraft({ ...draft, meta_title: e.target.value })}
            />
            <p className="mt-1 text-xs text-muted-fg">{draft.meta_title.length} characters</p>
          </div>
          <div>
            <Label htmlFor="meta_description">SEO description (optional, ~140-160 characters)</Label>
            <Input
              id="meta_description"
              name="meta_description"
              maxLength={320}
              value={draft.meta_description}
              onChange={(e) => setDraft({ ...draft, meta_description: e.target.value })}
            />
            <p className="mt-1 text-xs text-muted-fg">{draft.meta_description.length} characters</p>
          </div>
        </div>
      </Card>

      {state?.error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {state.success}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
