import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchWithTimeout, ensureUrl, stripHtml } from "../../../lib/api";
import type { Metadata, ResolvingMetadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 300;
export const dynamicParams = true;

interface BlogSingleProps {
  params: { slug: string };
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
// Helper: Decode Escaped HTML
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
// Format Date
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
      { cache: "force-cache", next: { revalidate: 300 } }
    );

    if (!res.ok) return [];

    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

// ---------------------------
// Fetch Single Blog
// ---------------------------
async function getBlogPost(slug: string) {
  const blogs = await getAllBlogs();
  return blogs.find((b) => b.slug === slug) || null;
}

// ---------------------------
// Dynamic Metadata
// ---------------------------
export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const blog = await getBlogPost(params.slug);

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
// MAIN PAGE COMPONENT
// ---------------------------
export default async function BlogSinglePage({ params }: BlogSingleProps) {
  const blog = await getBlogPost(params.slug);

  if (!blog) return notFound();

  const image = ensureUrl(blog.featured_image || blog.cover_image);
  const date = formatDate(blog.created_at);

  // FIX: Decode HTML so it renders correctly
  const htmlContent = decodeHtml(blog.long_description || blog.content || "");

  return (
    <div className="blog-txt">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">

            {image && (
              <Image
                className="w-100"
                src={image}
                alt={blog.title}
                width={1920}
                height={500}
                loading="lazy"
              />
            )}

            <h1 className="mt-4">{blog.title}</h1>
            <h5 className="mb-4">{date}</h5>

            <div className="blog-wrapper">
  <style>
    {`
      .blog-wrapper * {
        color: black !important;
      }
    `}
  </style>

  <div
    className="blog-content"
    dangerouslySetInnerHTML={{ __html: htmlContent }}
  />
</div>

            {/* {htmlContent} */}
            {/* <div className="blog-content" style={{ color: "black" }} dangerouslySetInnerHTML={{ __html: htmlContent }} /> */}


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
