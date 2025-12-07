import InnerBanner from "../components/InnerBanner";
import BlogCard from "../components/BlogCard";
import { fetchWithTimeout, ensureUrl, stripHtml } from "../../lib/api";
import Link from "next/link";

// =============================
// Settings
// =============================
export const dynamic = "force-dynamic"; // Ensures dynamic rendering
export const revalidate = 0;

const PER_PAGE = 3;

// =============================
// Fetch Page SEO + Banner
// =============================
async function getPageSEO() {
  try {
    const res = await fetchWithTimeout(
      "https://vgc.psofttechnologies.in/api/v1/pages",
      { cache: "no-store", next: { revalidate: 0 } } // FIX
    );

    if (!res.ok) return null;

    const json = await res.json();
    const page = json?.data?.find((p) => p.slug === "blog");

    if (!page) return null;

    return {
      title: page.meta_title || "Our Blog",
      description: page.meta_description || "",
      keywords: page.meta_keywords || "",
      banner: ensureUrl(page.banner_image),
      alt: page.banner_alt || "Blog Banner",
    };
  } catch {
    return null;
  }
}

// =============================
// Dynamic Metadata
// =============================
export async function generateMetadata() {
  const seo = await getPageSEO();

  return {
    title: seo?.title || "Our Blog",
    description: seo?.description || "",
    keywords: seo?.keywords || "",
    robots: "index, follow",
    alternates: {
      canonical: "https://vgcadvisors.com/blog",
    },
  };
}

// =============================
// Fetch Blogs (with FIXED caching)
// =============================
async function getBlogs() {
  try {
    const res = await fetchWithTimeout(
      "https://vgc.psofttechnologies.in/api/v1/blogs",
      {
        cache: "no-store",      // IMPORTANT FIX
        next: { revalidate: 0 } // IMPORTANT FIX
      }
    );

    if (!res.ok) return [];

    const json = await res.json();
    return json?.data || [];
  } catch {
    return [];
  }
}

// =============================
// Format Date
// =============================
function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// =============================
// Main Blog Page
// =============================
export default async function BlogPage({ searchParams }) {
  const page = Number(searchParams?.page || 1);

  const pageSEO = await getPageSEO();
  const blogsData = await getBlogs();

  const allBlogs = blogsData
    .filter(
      (b) =>
        !b.status || ["active", "Active", "ACTIVE"].includes(b.status.trim())
    )
    .map((b) => ({
      id: b.id,
      title: b.title,
      excerpt: stripHtml(b.short_description),
      image: ensureUrl(b.featured_image || b.cover_image),
      date: formatDate(b.created_at),
      slug: b.slug,
    }));

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
      {/* Banner */}
      <InnerBanner
        title={pageSEO?.title || "Our Blog"}
        breadcrumb={breadcrumb}
        image={pageSEO?.banner || "/images/service-banner.webp"}
        alt={pageSEO?.alt || "Blog Banner"}
      />

      <div className="blog-sec dd">
        <h2 data-aos="fade-up" data-aos-duration="1200">Our Blog</h2>

        <div className="container">
          <div className="row">
            {paginatedBlogs.map((blog) => (
              <BlogCard
                key={blog.id}
                id={String(blog.id)}
                title={blog.title}
                excerpt={blog.excerpt}
                image={blog.image}
                date={blog.date}
                slug={blog.slug}
              />
            ))}

            {paginatedBlogs.length === 0 && (
              <div className="col-12">
                <p>No blog posts available.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="pagination mt-5 d-flex justify-content-center gap-2">
            {page > 1 && (
              <Link href={`?page=${page - 1}`} className="btn btn-outline-primary">
                Prev
              </Link>
            )}

            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNumber = i + 1;
              return (
                <Link
                  key={i}
                  href={`?page=${pageNumber}`}
                  className={`btn ${
                    pageNumber === page ? "btn-primary" : "btn-outline-primary"
                  }`}
                >
                  {pageNumber}
                </Link>
              );
            })}

            {page < totalPages && (
              <Link href={`?page=${page + 1}`} className="btn btn-outline-primary">
                Next
              </Link>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
