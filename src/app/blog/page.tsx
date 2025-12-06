import InnerBanner from "../components/InnerBanner";
import BlogCard from "../components/BlogCard";
import { fetchWithTimeout, ensureUrl, stripHtml } from "../../lib/api";
import Link from "next/link";
import Head from "next/head";

// =============================
// Dynamic Settings
// =============================
export const dynamic = "force-dynamic";
export const revalidate = 300;

const PER_PAGE = 3;

// =============================
// Fetch Page SEO + Banner from API
// =============================
async function getPageSEO() {
  try {
    const res = await fetchWithTimeout(
      "https://vgc.psofttechnologies.in/api/v1/pages",
      {
        cache: "force-cache",
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const page = json?.data?.find((p) => p?.slug === "blog");

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
// Fetch Blogs
// =============================
async function getBlogs() {
  try {
    const res = await fetchWithTimeout(
      "https://vgc.psofttechnologies.in/api/v1/blogs",
      {
        cache: "force-cache",
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) return [];

    const json = await res.json();
    return json?.data ?? [];
  } catch {
    return [];
  }
}

// =============================
// Format Date
// =============================
function formatDate(dateStr: string) {
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
export default async function BlogPage({ searchParams }: any) {
  const page = Number(searchParams?.page || 1);

  const pageSEO = await getPageSEO();
  const blogsData = await getBlogs();

  const allBlogs = blogsData
    .filter(
      (b: any) =>
        !b.status ||
        ["active", "Active", "ACTIVE"].includes(b.status.trim())
    )
    .map((b: any) => ({
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
      {/* =============================
          DYNAMIC SEO META TAGS
      ============================= */}
      <Head>
        <title>{pageSEO?.title || "Our Blog"}</title>
        <meta name="description" content={pageSEO?.description || ""} />
        <meta name="keywords" content={pageSEO?.keywords || ""} />
        <link rel="canonical" href="https://vgcadvisors.com/blog" />
        <meta name="robots" content="index, follow" />
      </Head>

      {/* =============================
          BANNER
      ============================= */}
      <InnerBanner
        title={pageSEO?.title || "Our Blog"}
        breadcrumb={breadcrumb}
        image={pageSEO?.banner || "/images/service-banner.webp"}
        alt={pageSEO?.alt || "Blog Banner"}
      />

      <div className="blog-sec dd">
        <h2 data-aos="fade-up" data-aos-duration="1200">
          Our Blog
        </h2>

        <div className="container">
          <div className="row">
            {paginatedBlogs.map((blog: any) => (
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

          {/* =============================
              PAGINATION
          ============================= */}
          <div className="pagination mt-5 d-flex justify-content-center gap-2">
            {/* Prev Button */}
            {page > 1 && (
              <Link
                href={`?page=${page - 1}`}
                className="btn btn-outline-primary"
              >
                Prev
              </Link>
            )}

            {/* Page Numbers */}
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

            {/* Next Button */}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}`}
                className="btn btn-outline-primary"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
