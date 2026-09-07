export interface Paginated<T> {
  count: number;
  num_pages: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  noindex: boolean;
  og_image: string | null;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  order: number;
}

export interface ProductDocument {
  id: number;
  doc_type: string;
  doc_type_display: string;
  title: string;
  file: string;
  is_public: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image: string | null;
  parent: number | null;
  is_featured: boolean;
  order: number;
  product_count?: number;
  children?: Category[];
  seo?: SEOData;
}

export interface Industry {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  icon: string;
  image: string | null;
  accent_color: string;
  applications: string[];
  is_featured: boolean;
  order: number;
  product_count?: number;
  seo?: SEOData;
}

export interface Manufacturer {
  id: number;
  name: string;
  slug: string;
  country: string;
  website: string;
  logo: string | null;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  chemical_formula: string;
  cas_number: string;
  short_description: string;
  grade: string;
  grade_display: string;
  purity: string;
  category_name: string;
  category_slug: string;
  manufacturer_name: string;
  availability: string;
  availability_display: string;
  unit: string;
  lead_time: string;
  price_on_request: boolean;
  indicative_price: string | null;
  currency: string;
  is_featured: boolean;
  is_bestseller: boolean;
  image: string | null;
  industry_slugs: string[];
}

export interface ProductDetail extends Product {
  description: string;
  applications: string[];
  benefits: string[];
  specifications: Record<string, string>;
  packaging_options: string[];
  faqs: { question: string; answer: string }[];
  storage_handling: string;
  safety_information: string;
  hazard_class: string;
  hs_code: string;
  synonyms: string;
  min_order_quantity: number;
  images: ProductImage[];
  documents: ProductDocument[];
  industries: Industry[];
  manufacturer: Manufacturer | null;
  category: Category;
  related: Product[];
  bought_together: Product[];
  package_sizes: string[];
  seo: SEOData;
  updated_at: string;
}

export interface Stat {
  id: number;
  label: string;
  value: number;
  suffix: string;
  icon: string;
  order: number;
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  summary: string;
  description: string;
  icon: string;
  image: string | null;
  highlights: string[];
  order: number;
}

export interface ValueProp {
  id: number;
  title: string;
  description: string;
  icon: string;
  order: number;
}

export interface ProcessStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  duration: string;
  order: number;
}

export interface Milestone {
  id: number;
  year: string;
  title: string;
  description: string;
  order: number;
}

export interface Testimonial {
  id: number;
  author: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
  avatar: string | null;
  logo: string | null;
  source: string;
  order: number;
}

export interface ClientLogo {
  id: number;
  name: string;
  logo: string | null;
  website: string;
  order: number;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  page: string;
  order: number;
}

export interface Certification {
  id: number;
  name: string;
  issuer: string;
  description: string;
  badge: string | null;
  order: number;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  photo: string | null;
  linkedin: string;
  order: number;
}

export interface PostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  cover_alt: string;
  category_name: string;
  category_slug: string;
  author_name: string;
  tag_list: string[];
  published_at: string;
  reading_minutes: number;
  is_featured: boolean;
}

export interface PostFAQ {
  id: number;
  question: string;
  answer: string;
  order: number;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  post_count?: number;
  seo?: SEOData;
}

export interface Author {
  id: number;
  name: string;
  slug: string;
  role: string;
  bio: string;
  photo: string | null;
  linkedin: string;
}

export interface PostDetail extends PostSummary {
  body: string;
  author: Author | null;
  category: BlogCategory;
  faqs: PostFAQ[];
  suggested_products: Product[];
  related: PostSummary[];
  seo: SEOData;
  updated_at: string;
}

export interface FacetItem {
  value?: string;
  label: string;
  count: number;
}

export interface Facets {
  grades: { grade: string; count: number }[];
  availability: { availability: string; count: number }[];
  categories: FacetItem[];
  industries: FacetItem[];
  manufacturers: FacetItem[];
  package_sizes: FacetItem[];
  total: number;
}

export interface HomepageData {
  stats: Stat[];
  industries: Industry[];
  categories: Category[];
  featured_products: Product[];
  value_props: ValueProp[];
  services: Service[];
  process: ProcessStep[];
  testimonials: Testimonial[];
  clients: ClientLogo[];
  certifications: Certification[];
  faqs: FAQ[];
  latest_posts: PostSummary[];
}

export interface QuoteItemInput {
  product_slug?: string;
  product_name?: string;
  quantity: number | string;
  unit: string;
  packaging?: string;
  notes?: string;
}
