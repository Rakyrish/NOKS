/** Emits a JSON-LD block. Server component — no client cost. */
export const JsonLd = ({ id, data }: { id: string; data: object }) => (
  <script
    type="application/ld+json"
    id={`ld-${id}`}
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);
