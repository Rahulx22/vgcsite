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
  content?: string; // fallback
  featured_image?: string;
  cover_image?: string;
  created_at: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
}

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------
// API Calls
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

async function getBlogPost(slug: string) {
  const blogs = await getAllBlogs();
  return blogs.find((b) => b.slug === slug) || null;
}

// ---------------------------
// Metadata
// ---------------------------
export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const blog = await getBlogPost(params.slug);
  if (!blog) {
    return { title: "Blog Not Found | VGC Consulting", description: "Requested blog could not be found." };
  }

  return {
    title: blog.meta_title || `${blog.title} | VGC Consulting`,
    description: blog.meta_description || stripHtml(blog.short_description || "") || blog.title,
    keywords: blog.meta_keywords || blog.title,
  };
}

// ---------------------------
// Page Component
// ---------------------------
export default async function BlogSinglePage({ params }: BlogSingleProps) {
  const blog = await getBlogPost(params.slug);
  if (!blog) return notFound();

  const image = ensureUrl(blog.featured_image || blog.cover_image);
  const date = formatDate(blog.created_at);

  // Use long_description or fallback to content
  const htmlContent = blog.long_description || blog.content || "";
  console.log("Rendering blog:", htmlContent,blog.title); 





  

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


            {htmlContent}

            {/* Render the entire HTML content */}
            {/* <div dangerouslySetInnerHTML={{ __html: htmlContent }} /> */}
            
            {/* <div className="blog-content" dangerouslySetInnerHTML={{ __html: htmlContent }} /> */}


          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------
// Static Params
// ---------------------------
export async function generateStaticParams() {
  const blogs = await getAllBlogs();
  return blogs.map((blog) => ({ slug: blog.slug }));
}
