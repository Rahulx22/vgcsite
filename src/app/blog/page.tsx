import InnerBanner from "../components/InnerBanner";
import BlogSlider from "./BlogSlider";
import { fetchWithTimeout, ensureUrl, stripHtml } from "../../lib/api";
import type { Metadata } from "next";

type PageSEO = {
  title?: string;
  description?: string;
  keywords?: string;
  banner?: string | null;
  alt?: string | null;
};

type ApiPage = {
  slug?: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  banner_image?: string | null;
  banner_alt?: string | null;
};

type ApiBlog = {
  id?: number | string;
  title?: string | null;
  short_description?: string | null;
  featured_image?: string | null;
  cover_image?: string | null;
  featured_image_alt?: string | null;
  cover_image_alt?: string | null;
  created_at?: string | null;
  slug?: string | null;
  status?: string | null;
};

type BlogCardData = {
  id: number | string;
  title: string;
  excerpt: string;
  image: string;
  alt?: string;
  date: string;
  slug: string;
};

type BlogSection = {
  title?: string;
  subtitle?: string | null;
  blog_ids?: (number | string)[];
  show_latest?: boolean;
};

// Note: we'll use `generateMetadata` (App Router) for per-page dynamic meta tags

// =============================
// Dynamic Settings
// =============================
export const dynamic = "force-dynamic";
export const revalidate = 300;

const PER_PAGE = 3;

// =============================
// Fetch Page Data from API
// =============================
async function getPageData(): Promise<ApiPage | null> {
  try {
    const res = await fetchWithTimeout(
      "https://panel.vgcadvisors.com/api/v1/pages",
      { cache: "force-cache", next: { revalidate: 300 } }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const page = (json?.data as ApiPage[] | undefined)?.find((p) => p?.slug === "blog");

    return page || null;
  } catch {
    return null;
  }
}

// =============================
// Fetch Blog Section from Page Builder
// =============================
async function getBlogSection(): Promise<BlogSection | null> {
  try {
    const res = await fetchWithTimeout(
      "https://panel.vgcadvisors.com/api/v1/pages",
      { cache: "force-cache", next: { revalidate: 300 } }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const page = (json?.data as any[] | undefined)?.find((p) => p?.slug === "blog");

    if (!page || !page.sections) return null;

    // Find blog_section type in page sections
    const blogSection = (page.sections as any[]).find((s) => s.type === "blog_section");
    return blogSection?.data || null;
  } catch {
    return null;
  }
}

// =============================
// Get Page SEO from API Page Data
// =============================
async function getPageSEO(): Promise<PageSEO | null> {
  const page = await getPageData();
  if (!page) return null;

  return {
    title: page.meta_title || "Our Blog",
    description: page.meta_description || "",
    keywords: page.meta_keywords || "",
    banner: ensureUrl(page.banner_image),
    alt: page.banner_alt || "Blog Banner",
  };
}

// ----------------------------
// Next metadata generation
// ----------------------------
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSEO();
  if (!seo) return {};

  const siteUrl = "https://vgcadvisors.com/blog";

  return {
    title: seo.title || "Our Blog",
    description: seo.description || "",
    keywords: seo.keywords || "",
    
    alternates: { 
      canonical: siteUrl 
    },
    openGraph: {
      title: seo.title || "Our Blog",
      description: seo.description || "",
      url: siteUrl,
      images: seo.banner ? [{ url: seo.banner, alt: seo.alt || "Blog Banner" }] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// =============================
// Fetch Blogs
// =============================
async function getBlogs(): Promise<ApiBlog[]> {
  try {
    const res = await fetchWithTimeout(
      "https://panel.vgcadvisors.com/api/v1/blogs",
      { cache: "force-cache", next: { revalidate: 300 } }
    );
    if (!res.ok) return [];

    const json = await res.json();
    console.log("Raw blogs data:", json);
    return (json?.data as ApiBlog[]) ?? [];
  } catch {
    return [];
  }
}

// =============================
// Format Date
// =============================
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// =============================
// PAGE COMPONENT
// =============================
export default async function BlogPage({ searchParams }: { searchParams?: { page?: string | number } }) {
  const rawPage = Array.isArray(searchParams?.page) ? searchParams?.page[0] : searchParams?.page;
  const page = Number(rawPage || 1);

  const pageSEO = await getPageSEO();
  const blogSection = await getBlogSection();
  const blogsData = await getBlogs();
  console.log("Fetched blogs:", blogsData.length);


  const allBlogs: BlogCardData[] = blogsData
    .filter((b) => !b.status || ["active", "Active", "ACTIVE"].includes((b.status || "").trim()))
    .map((b, i) => ({
      id: b.id ?? `${b.slug ?? 'blog'}-${i}`,
      title: b.title || "",
      excerpt: stripHtml(b.short_description || ""),
      image: ensureUrl(b.featured_image || b.cover_image),
      alt:
        b.featured_image_alt ||
        b.cover_image_alt ||
        b.title ||
        "",
      date: formatDate(b.created_at),
      slug: b.slug || "",
    }));

  // Filter blogs based on blog_ids if provided, otherwise show latest if enabled
  const filteredBlogs = blogSection?.blog_ids && blogSection.blog_ids.length > 0
    ? allBlogs.filter((b) => blogSection.blog_ids?.includes(b.id))
    : blogSection?.show_latest !== false
      ? allBlogs
      : [];

  const totalBlogs = allBlogs.length;
  const totalPages = Math.ceil(totalBlogs / PER_PAGE);
  const start = (page - 1) * PER_PAGE;
  const paginatedBlogs = allBlogs.slice(start, start + PER_PAGE);

  const breadcrumb = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
  ];



  return (
    <>
      {/* =============================
            BANNER FROM PAGE API (UI title fixed — metadata still generated for head)
        ============================= */}
      <InnerBanner
        title={stripHtml("Our Blog")}
        breadcrumb={breadcrumb}
        image={pageSEO?.banner || "/images/service-banner.webp"}
        alt={pageSEO?.alt || "Blog Banner"}
      />

      <div className="blog-sec dd">
        {blogSection?.subtitle && <p className="subtitle">{blogSection.subtitle}</p>}
        {/* <h2 data-aos="fade-up" data-aos-duration="1200">{stripHtml(blogSection?.title || pageSEO?.title || "Our Blog")}</h2> */}

        <div className="container">
          <div className="row">
            {/* Render slider (client component) showing 3 items per slide */}
            <BlogSlider blogs={filteredBlogs} itemsPerSlide={3} />
          </div>

        </div>
      </div>
    </>
  );
}
