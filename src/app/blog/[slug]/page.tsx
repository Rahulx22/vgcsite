import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchWithTimeout, ensureUrl, stripHtml } from "../../../lib/api";
import type { Metadata, ResolvingMetadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 300;
export const dynamicParams = true;

interface BlogSingleProps {
  // `params` can be a promise in some Next.js resolver contexts — allow both.
  params: { slug: string } | Promise<{ slug: string }>;
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  long_description?: string;
  content?: string;
  featured_image?: string;
  cover_image?: string;
  created_at: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
}

// ---------------------------
// Decode escaped HTML
// ---------------------------
function decodeHtml(html: string) {
  if (!html) return "";
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// ---------------------------
function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------
// Fetch All Blogs
// ---------------------------
async function getAllBlogs(): Promise<BlogPost[]> {
  try {
    const res = await fetchWithTimeout(
      "https://vgc.psofttechnologies.in/api/v1/blogs",
      { cache: "no-store" }
    );

    if (!res.ok) return [];

    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

// ---------------------------
async function getBlogPost(slug: string) {
  const blogs = await getAllBlogs();
  return blogs.find((b) => b.slug === slug) || null;
}

// ---------------------------
// Dynamic Metadata
// ---------------------------
export async function generateMetadata(
  { params }: { params: { slug: string } | Promise<{ slug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = (await params) as { slug: string };
  const blog = await getBlogPost(resolvedParams.slug);

  if (!blog) {
    return {
      title: "Blog Not Found | VGC Consulting",
      description: "Requested blog could not be found.",
    };
  }

  return {
    title: blog.meta_title || `${blog.title} | VGC Consulting`,
    description:
      blog.meta_description ||
      stripHtml(blog.short_description || "") ||
      blog.title,
    keywords: blog.meta_keywords || blog.title,
  };
}

// ---------------------------
// MAIN PAGE
// ---------------------------
export default async function BlogSinglePage({ params }: BlogSingleProps) {
  const resolvedParams = (await params) as { slug: string };
  const blog = await getBlogPost(resolvedParams.slug);

  if (!blog) return notFound();

  const image = ensureUrl(blog.featured_image || blog.cover_image);
  const date = formatDate(blog.created_at);

  // decode long description
  const htmlContent = decodeHtml(blog.long_description || blog.content || "");

  return (
    <div className="blog-txt py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">

            {image && (
              <Image
                src={image}
                alt={blog.title}
                className="w-100 rounded"
                width={1200}
                height={500}
                loading="lazy"
              />
            )}

            <h1 className="mt-4">{blog.title}</h1>
            <p className="text-muted mb-4">{date}</p>

            {/* BLOG CONTENT */}
            <div className="blog-wrapper">
              <style>
                {`
                  /* Ensure blog content is readable regardless of global theme */
                  .blog-wrapper {
                    color: #222 !important;
                    background: #fff !important;
                    font-size: 1.1rem;
                    line-height: 1.7;
                    padding: 12px 16px;
                    border-radius: 4px;
                  }

                  /* Force all child elements to inherit the readable color */
                  .blog-wrapper, .blog-wrapper * {
                    color: inherit !important;
                    background: transparent !important;
                    box-shadow: none !important;
                  }

                  .blog-wrapper img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 20px 0;
                  }

                  .blog-wrapper p {
                    margin-bottom: 1rem;
                  }

                  .blog-wrapper h2,
                  .blog-wrapper h3,
                  .blog-wrapper h4 {
                    margin-top: 1.5rem;
                    margin-bottom: 1rem;
                  }

                  .blog-wrapper ul, .blog-wrapper ol {
                    padding-left: 20px;
                    margin-bottom: 1rem;
                  }
                `}
              </style>

              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------
// STATIC PARAMS
// ---------------------------
export async function generateStaticParams() {
  const blogs = await getAllBlogs();
  return blogs.map((blog) => ({ slug: blog.slug }));
}
