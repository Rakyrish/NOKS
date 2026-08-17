"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui";

/** Text input for an image URL with an immediate client-side preview —
 * the browser just tries to load the pasted URL directly, no round trip.
 * The actual product image still gets fetched and stored server-side on
 * submit (see apps.catalog.url_fetch.fetch_image_bytes) so the live site
 * never hotlinks it. */
export function ImageUrlField({
  name,
  defaultValue = "",
  placeholder = "https://example.com/product-photo.jpg",
  onValueChange,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  /** Reports every keystroke upward — e.g. so a sibling "Generate with AI"
   * panel can use the same URL as vision input without a second field. */
  onValueChange?: (url: string) => void;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <Input
          name={name}
          type="url"
          placeholder={placeholder}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setFailed(false);
            onValueChange?.(e.target.value);
          }}
        />
      </div>
      {url && (
        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-muted">
          {failed ? (
            <ImageOff className="size-4 text-muted-fg" />
          ) : (
            // Arbitrary external preview URL — not run through next/image's
            // domain allowlist on purpose, this never reaches the public site.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt=""
              className="size-full object-cover"
              onError={() => setFailed(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}
