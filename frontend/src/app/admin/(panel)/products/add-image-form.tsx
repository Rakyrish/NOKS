"use client";

import { useActionState, useState } from "react";

import { Input } from "@/components/ui";
import { Button } from "@/components/ui/button";

import { uploadImageFromUrl, type ImageUrlFormState } from "./actions";
import { ImageUrlField } from "./image-url-field";

const initialState: ImageUrlFormState = {};

export function AddImageForms({
  productId,
  uploadFileAction,
}: {
  productId: number;
  uploadFileAction: (formData: FormData) => void | Promise<void>;
}) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [state, formAction, pending] = useActionState(
    uploadImageFromUrl.bind(null, productId),
    initialState,
  );

  return (
    <div className="border-t border-line pt-4">
      <div className="mb-3 inline-flex rounded-full border border-line bg-white p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`rounded-full px-3 py-1.5 ${mode === "upload" ? "bg-brand-600 text-white" : "text-muted-fg"}`}
        >
          Upload file
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`rounded-full px-3 py-1.5 ${mode === "url" ? "bg-brand-600 text-white" : "text-muted-fg"}`}
        >
          Paste image URL
        </button>
      </div>

      {mode === "upload" ? (
        <form action={uploadFileAction} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-navy-900" htmlFor="image">
              Image file
            </label>
            <input type="file" name="image" id="image" accept="image/*" required className="text-sm" />
          </div>
          <Input type="text" name="alt_text" placeholder="Alt text (for accessibility & SEO)" className="max-w-xs" />
          <Button type="submit" variant="outline" size="sm">
            Upload
          </Button>
        </form>
      ) : (
        <form action={formAction} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-navy-900" htmlFor="url">
              Image URL
            </label>
            <ImageUrlField name="url" />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Input type="text" name="alt_text" placeholder="Alt text (for accessibility & SEO)" className="max-w-xs" />
            <Button type="submit" variant="outline" size="sm" disabled={pending}>
              {pending ? "Fetching…" : "Add image"}
            </Button>
          </div>
          {state?.error && <p className="text-xs font-medium text-rose-600">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
