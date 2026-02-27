// src/app/career/CareerClient.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { API_URL, fetchWithTimeout, ensureUrl } from "../../lib/api";
import type { CareerApiResponse, CareerHeaderBlock, CareerSectionBlock, CareerJob } from "../../types/pages";
import { div } from "framer-motion/client";

function decodeHtmlEntities(text: string): string {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

function parseHtmlList(html: string): string[] {
  const items: string[] = [];
  if (!html) return items;

  // Try <li><p>...</p></li> pattern first
  const regex1 = /<li[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/li>/g;
  let match;
  while ((match = regex1.exec(html)) !== null) {
    const cleanText = match[1].replace(/<[^>]*>/g, '').trim();
    if (cleanText) items.push(decodeHtmlEntities(cleanText));
  }

  // Fallback: plain <li>...</li>
  if (items.length === 0) {
    const regex2 = /<li[^>]*>([\s\S]*?)<\/li>/g;
    while ((match = regex2.exec(html)) !== null) {
      const cleanText = match[1].replace(/<[^>]*>/g, '').trim();
      if (cleanText) items.push(decodeHtmlEntities(cleanText));
    }
  }

  // Ultimate fallback: line by line
  if (items.length === 0) {
    const lines = html.split(/[\n\r]+/);
    for (const line of lines) {
      const cleanLine = line.replace(/<[^>]*>/g, '').trim();
      if (cleanLine && cleanLine.length > 10) {
        items.push(decodeHtmlEntities(cleanLine));
      }
    }
  }

  return items;
}

interface JobSection {
  title: string;
  items: string[];
}

function parseJobDescription(longDescription: string): JobSection[] {
  const sections: JobSection[] = [];

  if (!longDescription || typeof longDescription !== 'string') {
    return sections;
  }

  try {
    // Case 1: Structured with <h5> headings
    if (longDescription.match(/<h5/i)) {
      const parts = longDescription.split(/<h5[^>]*>([^<]+)<\/h5>/i);

      for (let i = 1; i < parts.length; i += 2) {
        const title = (parts[i] || '').trim();
        const contentHtml = parts[i + 1] || '';

        const items = parseHtmlList(contentHtml);

        if (title && items.length > 0) {
          sections.push({ title, items });
        }
      }
    }
    // Case 2: Just list or unstructured text
    else {
      const items = parseHtmlList(longDescription);

      if (items.length > 0) {
        let defaultTitle = "Job Description";

        const firstItem = items[0]?.toLowerCase() || "";
        if (firstItem.includes("responsib") || firstItem.includes("duty") || firstItem.includes("task")) {
          defaultTitle = "Key Responsibilities";
        } else if (
          firstItem.includes("qualif") ||
          firstItem.includes("requir") ||
          firstItem.includes("skill") ||
          firstItem.includes("ideal") ||
          firstItem.includes("candidate")
        ) {
          defaultTitle = "Requirements & Qualifications";
        }

        sections.push({ title: defaultTitle, items });
      }
    }
  } catch (error) {
    console.error("Error parsing job description:", error);
    const fallbackItems = parseHtmlList(longDescription);
    if (fallbackItems.length > 0) {
      sections.push({ title: "Job Description", items: fallbackItems });
    }
  }

  return sections;
}

export default function CareerClient() {
  const [careerData, setCareerData] = useState<CareerApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    position: "",
    linkedin: "",
    degree: "",
    personalNote: "",
  });
  const [resume, setResume] = useState<File | null>(null);
  const [resumePreview, setResumePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchCareerData = async () => {
      try {
        setLoading(true);
        const response = await fetchWithTimeout(API_URL, {
          cache: "force-cache",
          next: { revalidate: 300 },
        });

        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        const apiResponse = await response.json();
        const pages = Array.isArray(apiResponse?.data) ? apiResponse.data : [];

        const careerPage = pages.find(
          (page: any) => page.type === "career" || page.slug === "career"
        );

        if (!careerPage) throw new Error("Career page not found");
        setCareerData(careerPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load career data");
      } finally {
        setLoading(false);
      }
    };

    fetchCareerData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setResume(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => setResumePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setResumePreview(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "linkedin") submitData.append("linkedin_url", value);
        else if (key === "personalNote") submitData.append("personal_note", value);
        else submitData.append(key.replace(/([A-Z])/g, "_$1").toLowerCase(), value);
      });
      if (resume) submitData.append("resume", resume);

      const res = await fetch("https://panel.vgcadvisors.com/api/v1/resume-form", {
        method: "POST",
        body: submitData,
      });

      if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
      setSubmitSuccess(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        city: "",
        position: "",
        linkedin: "",
        degree: "",
        personalNote: "",
      });
      setResume(null);
      setResumePreview(null);

      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJobPdfDownload = (job: CareerJob) => {
    if (job.job_description_doc) {
      const pdfUrl = `https://panel.vgcadvisors.com/storage/${job.job_description_doc.replace(/^\/+/, "")}`;
      if (pdfUrl.endsWith(".pdf")) {
        window.open(pdfUrl, "_blank");
      }
    } else {
      document.getElementById(`job-${job.id}`)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) return <div className="container" style={{ textAlign: "center", padding: "50px 0" }}><h2>Loading...</h2></div>;
  if (error || !careerData) return <div className="container" style={{ textAlign: "center", padding: "50px 0" }}><h2>Error: {error || "Failed to load"}</h2></div>;

  const headerBlock = careerData.blocks.find((b) => b.type === "career_header") as CareerHeaderBlock;
  const sectionBlock = careerData.blocks.find((b) => b.type === "career_section") as CareerSectionBlock;

  if (!headerBlock || !sectionBlock) return <div className="container"><h2>Invalid data structure</h2></div>;

  const headerData = headerBlock.data;
  const sectionData = sectionBlock.data;

  const activeJobs = sectionData.jobs?.filter(
    (job: CareerJob) => job.status?.toLowerCase() === "active"
  ) ?? [];

  const sortJobs = (a: CareerJob, b: CareerJob) => {
    const order = ["senior", "lead", "manager", "junior", "associate", "trainee"];
    const aIndex = order.findIndex((k) => a.title.toLowerCase().includes(k));
    const bIndex = order.findIndex((k) => b.title.toLowerCase().includes(k));
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  };

  function getShortText(html: string, max = 180) {
    const text = html.replace(/<[^>]*>/g, "").trim();
    return text.length > max ? text.slice(0, max) + "..." : text;
  }




  // Add this inside the if (formElement) block after scrollTo
  setTimeout(() => {
    const firstInput = document.querySelector('input[name="firstName"]') as HTMLInputElement;
    firstInput?.focus();
  }, 700);



  return (
    <>
      <div className="business-banner dd">
        <div className="container-fluid">
          <div className="row">
            <div className="col-xl-5 col-lg-6 col-md-12 offset-xl-1" data-aos="fade-right" data-aos-duration="1200">
              <nav>
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="/">Home</a>
                  </li>
                  <li className="breadcrumb-item active">Career</li>
                </ol>
              </nav>
              <h1>{headerData.left_title}</h1>
              <p>{headerData.left_description}</p>
            </div>

            <div className="col-xl-6 col-lg-6 col-md-12">
              <Image
                className="w-100"
                src={ensureUrl(headerData.right_image_main)}
                alt="career-banner"
                width={800}
                height={600}
                loading="eager"
                quality={85}
                style={{ width: "100%", height: "auto" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="contact-sec dd">
        <div className="container">
          <div className="row">
            <div className="col-xl-10 col-lg-12 col-md-12 offset-xl-1">
              <div className="cont-form">
                <h3>Ready to make an impact?</h3>
                <h2>Join Our Team</h2>

                {submitSuccess && (
                  <div className="alert alert-success">
                    Thank you for your application! We'll get back to you soon.
                  </div>
                )}
                {submitError && (
                  <div className="alert alert-danger">{submitError}</div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-lg-3 col-md-4">
                      <div className="in-box">
                        <label>First Name</label>
                        <input
                          className="box"
                          type="text"
                          name="firstName"
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-4">
                      <div className="in-box">
                        <label>Last Name</label>
                        <input
                          className="box"
                          type="text"
                          name="lastName"
                          placeholder="Last Name"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-4">
                      <div className="in-box">
                        <label>Email</label>
                        <input
                          className="box"
                          type="email"
                          name="email"
                          placeholder="Email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-4">
                      <div className="in-box">
                        <label>Phone</label>
                        <input
                          className="box"
                          type="tel"
                          name="phone"
                          placeholder="Phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-4">
                      <div className="in-box">
                        <label>City</label>
                        <input
                          className="box"
                          type="text"
                          name="city"
                          placeholder="City"
                          value={formData.city}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-4">
                      <div className="in-box">
                        <label>Position</label>
                        <select
                          className="box"
                          name="position"
                          value={formData.position}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Position</option>
                          {sectionData.jobs?.map((job) => (
                            <option key={job.id} value={job.title}>
                              {job.title}
                            </option>
                          ))}
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-4">
                      <div className="in-box">
                        <label>LinkedIn Profile URL</label>
                        <input
                          className="box"
                          type="url"
                          name="linkedin"
                          placeholder="https://linkedin.com/in/username"
                          value={formData.linkedin}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-4">
                      <div className="in-box">
                        <label>Bachelor's Degree</label>
                        <select
                          className="box"
                          name="degree"
                          value={formData.degree}
                          onChange={handleChange}
                        >
                          <option value="">Select Degree</option>
                          <option value="commerce">Commerce</option>
                          <option value="accounting">Accounting</option>
                          <option value="finance">Finance</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-12">
                      <div className="in-box">
                        <label>Upload Resume</label>
                        <input
                          className="box"
                          type="file"
                          name="resume"
                          accept=".pdf,.doc,.docx,.txt,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                          onChange={handleFileChange}
                        />
                        {resumePreview && (
                          <div className="mt-2">
                            <small>Selected file: {resume?.name}</small>
                            {resume?.type.startsWith("image/") && (
                              <img
                                src={resumePreview}
                                alt="Resume preview"
                                style={{ maxWidth: "200px", maxHeight: "200px" }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="in-box">
                    <label>Personal Note</label>
                    <textarea
                      className="box"
                      name="personalNote"
                      placeholder="Tell us why you're interested in joining our team..."
                      rows={5}
                      value={formData.personalNote}
                      onChange={handleChange}
                    />
                  </div>

                  <input
                    type="submit"
                    className="call-btn"
                    value={submitting ? "Submitting..." : "Submit Application →"}
                    disabled={submitting}
                  />
                </form>
              </div>
            </div>


            <div className="col-12 mt-5">
              {activeJobs.length > 0 ? (
                <>
                  <div className="text-center mb-5 py-4">
                    <h2
                      className="fw-bold text-white position-relative d-inline-block px-4"
                      style={{
                        fontSize: "2.4rem",
                        fontFamily: "'Poppins', 'Segoe UI', sans-serif",
                        letterSpacing: "1px"
                      }}
                    >
                      Current Openings
                      <span
                        style={{
                          position: "absolute",
                          left: "50%",
                          bottom: "-12px",
                          transform: "translateX(-50%)",
                          width: "70px",
                          height: "4px",
                          background: "linear-gradient(90deg, #20c997, #0d6efd)",
                          borderRadius: "10px"
                        }}
                      ></span>
                    </h2>
                  </div>

                  <div className="row g-4">
                    {activeJobs.sort(sortJobs).map((job: CareerJob) => {
                      const sections = parseJobDescription(job.long_description);

                      return (
                        <div key={job.id} className="col-lg-6 col-md-12 mb-4">
                          <div
                            className="card shadow-sm border-0 h-100"
                            style={{ borderRadius: "16px", overflow: "hidden" }}
                          >

                            <div className="card-body p-4 p-lg-5 d-flex flex-column" style={{ height: "650px" }}>

                              {/* 1. HEADER: flex-shrink-0 keeps it from squishing */}
                              <div className="flex-shrink-0 border-bottom pb-3 mb-4">
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                                  <div>
                                    <h4 className="card-title mb-1 fw-bold text-dark">{job.title}</h4>
                                    {job.roles && job.roles !== job.title && (
                                      <p className="text-muted mb-0 small">{job.roles}</p>
                                    )}
                                  </div>

                                  <div className="d-flex gap-2">
                                    {job.job_description_doc && (
                                      <button
                                        className="btn btn-outline-primary btn-sm rounded-pill px-3"
                                        onClick={() => handleJobPdfDownload(job)}
                                      >
                                        <i className="bi bi-file-pdf me-1"></i> JD
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm"
                                      onClick={() => {
                                        setFormData((prev) => ({ ...prev, position: job.title }));
                                        const formElement = document.querySelector('.cont-form');
                                        if (formElement) {
                                          const HEADER_OFFSET = 100;
                                          const elementPosition = formElement.getBoundingClientRect().top;
                                          const offsetPosition = elementPosition + window.scrollY - HEADER_OFFSET;
                                          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                                        }
                                      }}
                                    >
                                      Apply Now
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* 2. SCROLLABLE BODY: flex-grow-1 takes all available middle space */}
                              <div
                                className="flex-grow-1 overflow-auto pe-3"
                                style={{
                                  scrollbarWidth: 'thin',
                                  scrollbarColor: '#0d6efd #f8f9fa'
                                }}
                              >
                                {/* Short description */}
                                {job.short_description && (
                                  <div className="alert alert-primary bg-primary-subtle border-0 p-3 mb-4 rounded-3">
                                    <p className="mb-0 text-dark small">
                                      <i className="bi bi-info-circle-fill me-2"></i>
                                      {getShortText(job.short_description, 240)}
                                    </p>
                                  </div>
                                )}

                                {/* Structured sections */}
                                {sections.length > 0 ? (
                                  sections.map((section, idx) => (
                                    <div key={idx} className="mb-4">
                                      <h6 className="fw-bold text-primary text-uppercase small mb-3 border-bottom pb-2" style={{ letterSpacing: '0.5px' }}>
                                        {section.title}
                                      </h6>
                                      <ul className="list-unstyled ps-0">
                                        {section.items.map((item, i) => (
                                          <li key={i} className="mb-2 d-flex align-items-start small text-secondary">
                                            <i className="bi bi-check-circle-fill text-primary me-2 mt-1" style={{ fontSize: '0.85rem' }}></i>
                                            <span>{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-5 text-muted fst-italic small">
                                    Detailed description available in the Job Description PDF
                                  </div>
                                )}
                              </div>

                              {/* 3. FOOTER: flex-shrink-0 stays at the bottom */}
                              <div className="flex-shrink-0 mt-3 pt-3 border-top small text-muted">
                                <div className="d-flex justify-content-between align-items-center">
                                  <span>
                                    <i className="bi bi-calendar3 me-2"></i>
                                    Posted: {new Date(job.created_at).toLocaleDateString("en-IN")}
                                  </span>
                                  <span className="badge rounded-pill bg-light text-primary border">
                                    <i className="bi bi-briefcase me-1"></i> Full Time
                                  </span>
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-5 my-5">
                  <div className="display-6 text-muted mb-3"><i className="bi bi-search"></i></div>
                  <h4 className="text-muted">No active openings right now</h4>
                  <p className="text-muted">Please check back later!</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
