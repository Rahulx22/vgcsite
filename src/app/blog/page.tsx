import InnerBanner from "../components/InnerBanner";
import BlogCard from "../components/BlogCard";
import { fetchWithTimeout, ensureUrl, stripHtml } from "../../lib/api";

import Head from "next/head";

// ==========================
// Dynamic Settings
// ==========================
export const dynamic = "force-dynamic";
export const revalidate = 300;

// ==========================
// Pagination Settings
// ==========================
const PER_PAGE = 3; // ✅ Show only 3 blogs per page

// ==========================
// Fetch Blogs API
// ==========================
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

// ==========================
// Helper
// ==========================
function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ==========================
// PAGE COMPONENT
// ==========================
export default async function BlogPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const page = Number(searchParams?.page || 1);

  const blogsData = await getBlogs();

  // Filter & prepare blogs
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

  // Pagination Logic
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


    <Head><link rel="canonical" href="https://vgcadvisors.com/contact-us" />
    <meta name="robots" content="index, follow"></meta>
    </Head>




      <InnerBanner
        title="Our Blog"
        breadcrumb={breadcrumb}
        image="/default-banner.jpg"
        alt="Blog banner"
      />

      <div className="blog-sec dd">
        <h2 data-aos="fade-up" data-aos-duration="1200">
          Our Blog
        </h2>

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

          {/* ======================
                PAGINATION UI
              ====================== */}
          <div className="pagination mt-5 d-flex justify-content-center gap-2">
            {/* Prev Button */}
            {page > 1 && (
              <a href={`?page=${page - 1}`} className="btn btn-outline-primary">
                Prev
              </a>
            )}

            {/* Page Numbers */}
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNumber = i + 1;
              return (
                <a
                  key={i}
                  href={`?page=${pageNumber}`}
                  className={`btn ${
                    pageNumber === page ? "btn-primary" : "btn-outline-primary"
                  }`}
                >
                  {pageNumber}
                </a>
              );
            })}

            {/* Next Button */}
            {page < totalPages && (
              <a href={`?page=${page + 1}`} className="btn btn-outline-primary">
                Next
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
