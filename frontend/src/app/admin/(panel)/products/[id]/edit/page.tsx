import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Card } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { AdminApiError, adminApi, publicCategoriesFlat, publicIndustries } from "@/lib/admin/api";

import { AddImageForms } from "../../add-image-form";
import {
  deleteDocument,
  deleteImage,
  deleteProduct,
  makePrimaryImage,
  updateProduct,
  uploadDocument,
  uploadImage,
} from "../../actions";
import { ProductForm } from "../../product-form";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);

  let product;
  try {
    [product] = await Promise.all([adminApi.products.get(productId)]);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }

  const [categories, industries, manufacturers] = await Promise.all([
    publicCategoriesFlat(),
    publicIndustries(),
    adminApi.manufacturers.list(),
  ]);

  const boundUpdate = updateProduct.bind(null, productId);
  const boundUploadImage = uploadImage.bind(null, productId);
  const boundUploadDocument = uploadDocument.bind(null, productId);
  const boundDeleteProduct = deleteProduct.bind(null, productId);

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{product.name}</h1>
          <p className="mt-1 text-sm text-muted-fg">
            /products/{product.slug} · SKU {product.sku}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {product.is_published && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/products/${product.slug}`} target="_blank">
                View live
              </Link>
            </Button>
          )}
          <form action={boundDeleteProduct}>
            <Button type="submit" variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50">
              Delete product
            </Button>
          </form>
        </div>
      </div>

      <Card className="space-y-4 p-5">
        <h3 className="font-display text-sm font-bold text-ink">Images</h3>
        <div className="flex flex-wrap gap-4">
          {product.images.map((img) => (
            <div key={img.id} className="relative w-32 shrink-0">
              <div className="relative aspect-square overflow-hidden rounded-xl border border-line">
                <Image src={img.image} alt={img.alt_text} fill sizes="128px" className="object-cover" />
              </div>
              {img.order === 0 && (
                <Badge variant="brand" size="sm" className="absolute left-1 top-1">
                  Primary
                </Badge>
              )}
              <div className="mt-1.5 flex justify-between gap-1">
                {img.order !== 0 && (
                  <form action={makePrimaryImage.bind(null, productId, img.id)}>
                    <button type="submit" className="text-[11px] font-semibold text-[var(--brand-primary)]">
                      Make primary
                    </button>
                  </form>
                )}
                <form action={deleteImage.bind(null, productId, img.id)} className="ml-auto">
                  <button type="submit" className="text-[11px] font-semibold text-rose-600">
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
        <AddImageForms productId={productId} uploadFileAction={boundUploadImage} />
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="font-display text-sm font-bold text-ink">Documents (SDS, TDS, COA…)</h3>
        <ul className="divide-y divide-line">
          {product.documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                <span className="font-semibold text-ink">{doc.doc_type_display}</span> — {doc.title}
              </span>
              <div className="flex items-center gap-3">
                <a href={doc.file} target="_blank" className="text-[var(--brand-primary)]" rel="noreferrer">
                  Open
                </a>
                <form action={deleteDocument.bind(null, productId, doc.id)}>
                  <button type="submit" className="font-semibold text-rose-600">
                    Remove
                  </button>
                </form>
              </div>
            </li>
          ))}
          {product.documents.length === 0 && (
            <li className="py-2 text-sm text-muted-fg">No documents uploaded yet.</li>
          )}
        </ul>
        <form action={boundUploadDocument} className="flex flex-wrap items-end gap-3 border-t border-line pt-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-navy-900" htmlFor="doc_type">
              Type
            </label>
            <select id="doc_type" name="doc_type" className="h-11 rounded-xl border border-line px-3 text-sm">
              <option value="sds">Safety datasheet (SDS)</option>
              <option value="tds">Technical datasheet</option>
              <option value="coa">Certificate of analysis</option>
              <option value="spec">Specification sheet</option>
              <option value="brochure">Brochure</option>
            </select>
          </div>
          <input
            type="text"
            name="title"
            placeholder="Document title"
            required
            className="h-11 rounded-xl border border-line px-4 text-sm"
          />
          <input type="file" name="file" required accept="application/pdf" className="text-sm" />
          <Button type="submit" variant="outline" size="sm">
            Upload
          </Button>
        </form>
      </Card>

      <ProductForm
        product={product}
        categories={categories}
        industries={industries}
        manufacturers={manufacturers}
        action={boundUpdate}
      />
    </div>
  );
}
