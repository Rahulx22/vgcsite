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
      { cache: "force-cache", next: { revalidate: 300 } }
    );

    if (!res.ok) return null;

    const json = await res.json();
    console.log("Fetched Pages Data:", json);
    const page = json?.data?.find((p) => p?.slug === "blog");


    // console.log("Fetched Page SEO Data:", page);
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
      { cache: "force-cache", next: { revalidate: 300 } }
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
function formatDate(dateStr) {
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
export default async function BlogPage({ searchParams }) {
  const pageRequested = Number(searchParams?.page || 1);

  const pageSEO = await getPageSEO();
  const blogsData = await getBlogs();

  const allBlogs = blogsData
    .filter((b) => !b.status || ["active", "Active", "ACTIVE"].includes(b.status.trim()))
    .map((b) => ({
      id: b.id,
      title: b.title,
      excerpt: stripHtml(b.short_description),
      image: ensureUrl(b.featured_image || b.cover_image),
      date: formatDate(b.created_at),
      slug: b.slug,
    }));

  const totalBlogs = allBlogs.length;
  const totalPages = Math.max(0, Math.ceil(totalBlogs / PER_PAGE));

  // Clamp requested page to valid range
  const page = Math.max(1, Math.min(pageRequested || 1, totalPages || 1));
  const start = (page - 1) * PER_PAGE;
  const paginatedBlogs = allBlogs.slice(start, start + PER_PAGE);

  const breadcrumb = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
  ];

  console.log("Rendered Blog Page:", { page, pageSEO, totalPages });


  return (
    <>
      {/* =============================
            DYNAMIC SEO META TAGS
        ============================= */}
      <Head>
        <title>{pageSEO?.title || "Our Blog"}</title>
        <link rel="canonical" href="https://vgcadvisors.com/blog" />
        <meta name="robots" content="index, follow" />
      </Head>

      {/* =============================
            BANNER FROM PAGE API
        ============================= */}
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

          {/* =============================
                PAGINATION (NO RELOAD)
            ============================= */}

          {totalPages > 1 && (
            <div className="pagination mt-5 d-flex justify-content-center gap-2">
              {page > 1 && (
                <a href={`/blog?page=${page - 1}`} className="btn btn-outline-primary">
                  Prev
                </a>
              )}

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNumber = i + 1;
                return (
                  <a
                    key={i}
                    href={`/blog?page=${pageNumber}`}
                    className={`btn ${pageNumber === page ? "btn-primary" : "btn-outline-primary"}`}
                    aria-current={pageNumber === page ? 'page' : undefined}
                  >
                    {pageNumber}
                  </a>
                );
              })}

              {page < totalPages && (
                <Link href={`/blog?page=${page + 1}`} className="btn btn-outline-primary">
                  Next
                </Link>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
