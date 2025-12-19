// src/app/career/CareerClient.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Head from "next/head";
import { API_URL, fetchWithTimeout, ensureUrl } from "../../lib/api";
import type { CareerApiResponse, CareerHeaderBlock, CareerSectionBlock, CareerJob } from "../../types/pages";

function decodeHtmlEntities(text: string): string {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

function parseHtmlList(html: string): string[] {
  const items: string[] = [];
  if (!html) return items;

  const regex1 = /<li[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/li>/g;
  let match1;
  while ((match1 = regex1.exec(html)) !== null) {
    const cleanText = match1[1].replace(/<[^>]*>/g, '').trim();
    if (cleanText) items.push(decodeHtmlEntities(cleanText));
  }

  if (items.length === 0) {
    const regex2 = /<li[^>]*>([\s\S]*?)<\/li>/g;
    let match2;
    while ((match2 = regex2.exec(html)) !== null) {
      const cleanText = match2[1].replace(/<[^>]*>/g, '').trim();
      if (cleanText) items.push(decodeHtmlEntities(cleanText));
    }
  }

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

function parseJobDescription(longDescription: string) {
  const responsibilities: string[] = [];
  const idealFor: string[] = [];

  if (!longDescription || typeof longDescription !== 'string') {
    return { responsibilities, idealFor };
  }

  try {
    if (longDescription.includes('<h5')) {
      const sections = longDescription.split(/<h5[^>]*>([^<]+)<\/h5>/i);
      for (let i = 1; i < sections.length; i += 2) {
        const title = sections[i]?.trim() || '';
        const content = sections[i + 1] || '';
        const items = parseHtmlList(content);

        if (title.toLowerCase().includes('responsibilit')) {
          responsibilities.push(...items);
        } else if (title.toLowerCase().includes('ideal')) {
          idealFor.push(...items);
        }
      }
    } else {
      const items = parseHtmlList(longDescription);
      const responsibilityKeywords = ['responsible', 'responsibility', 'task', 'duty', 'handle', 'manage'];
      const idealKeywords = ['ideal', 'candidate', 'qualification', 'requirement', 'skill', 'experience'];

      const hasResp = items.some(item => responsibilityKeywords.some(kw => item.toLowerCase().includes(kw)));
      const hasIdeal = items.some(item => idealKeywords.some(kw => item.toLowerCase().includes(kw)));

      if (hasResp || (!hasIdeal && items.length > 2)) {
        responsibilities.push(...items);
      } else if (hasIdeal) {
        idealFor.push(...items);
      } else {
        responsibilities.push(...items);
      }
    }
  } catch (error) {
    console.error('Error parsing job description:', error);
    const fallback = parseHtmlList(longDescription);
    responsibilities.push(...fallback);
  }

  return { responsibilities, idealFor };
}

export default function CareerClient() {
  const [careerData, setCareerData] = useState<CareerApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "", city: "",
    position: "", linkedin: "", degree: "", personalNote: ""
  });
  const [resume, setResume] = useState<File | null>(null);
  const [resumePreview, setResumePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchCareerData = async () => {
      try {
        setLoading(true);
        const response = await fetchWithTimeout(API_URL, {
          cache: 'force-cache',
          next: { revalidate: 300 }
        });

        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        const apiResponse = await response.json();
        const pages = Array.isArray(apiResponse?.data) ? apiResponse.data : [];

        const careerPage = pages.find((page: any) =>
          page.type === 'career' || page.slug === 'career'
        );

        if (!careerPage) throw new Error('Career page not found');
        setCareerData(careerPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load career data');
      } finally {
        setLoading(false);
      }
    };

    fetchCareerData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setResume(file);
      if (file.type.startsWith('image/')) {
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
        if (key === 'linkedin') submitData.append('linkedin_url', value);
        else if (key === 'personalNote') submitData.append('personal_note', value);
        else submitData.append(key.replace(/([A-Z])/g, '_$1').toLowerCase(), value);
      });
      if (resume) submitData.append('resume', resume);

      const res = await fetch("https://vgc.psofttechnologies.in/api/v1/resume-form", {
        method: "POST",
        body: submitData,
      });

      if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
      setSubmitSuccess(true);
      setFormData({
        firstName: "", lastName: "", email: "", phone: "", city: "",
        position: "", linkedin: "", degree: "", personalNote: ""
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
      const pdfUrl = `https://vgc.psofttechnologies.in/storage/${job.job_description_doc.replace(/^\/+/, '')}`;
      if (pdfUrl.endsWith('.pdf')) {
        window.open(pdfUrl, '_blank');
      }
    } else {
      document.getElementById(`job-${job.id}`)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}><h2>Loading...</h2></div>;
  if (error || !careerData) return <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}><h2>Error: {error || 'Failed to load'}</h2></div>;

  const headerBlock = careerData.blocks.find(b => b.type === 'career_header') as CareerHeaderBlock;
  const sectionBlock = careerData.blocks.find(b => b.type === 'career_section') as CareerSectionBlock;

  if (!headerBlock || !sectionBlock) return <div className="container"><h2>Invalid data structure</h2></div>;

  const headerData = headerBlock.data;
  const sectionData = sectionBlock.data;

  const activeJobs = sectionData.jobs?.filter(job =>
    ['active', 'Active', 'ACTIVE'].includes(job.status)
  ) || [];

  return (
    <>
      <Head>
        <link rel="canonical" href="https://vgcadvisors.com/career" />
      </Head>

      {/* Your full JSX from the original return statement goes here unchanged */}
      {/* ... (all the HTML/JSX you had in the return() ) ... */}

      <div className="business-banner dd">
        <div className="container-fluid">
          <div className="row">
            <div className="col-xl-5 col-lg-6 col-md-12 offset-xl-1" data-aos="fade-right" data-aos-duration="1200">
              <nav>
                <ol className="breadcrumb">
                  <li className="breadcrumb-item"><a href="/">Home</a></li>
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
                priority
                quality={85}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rest of your JSX (form, job listings, etc.) remains exactly the same */}
      {/* I'll skip pasting the full long JSX here to save space, but keep it all as-is inside this return */}
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
                  <div className="alert alert-danger">
                    {submitError}
                  </div>
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
                        <select className="box" name="position" value={formData.position} onChange={handleChange} required>
                          <option value="">Select Position</option>
                          {sectionData.jobs && sectionData.jobs.map((job) => (
                            <option key={job.id} value={job.title}>{job.title}</option>
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
                        <label>Bachelor&apos;s Degree</label>
                        <select className="box" name="degree" value={formData.degree} onChange={handleChange}>
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
                            {resume?.type.startsWith('image/') && (
                              <img src={resumePreview} alt="Resume preview" style={{ maxWidth: '200px', maxHeight: '200px' }} />
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

            <div className="col-xl-12 col-lg-12 col-md-12">
              <Image className="filter-img" src="/images/filter.png" alt="filter" width={1200} height={200} loading="eager" quality={80} />
            </div>

            <div className="col-xl-6 col-lg-6 col-md-12">
              {sectionData.left_section.map((section, index) => (
                <div key={index} className="career-box career-box-top-spacing">
                  <h3>{section.title}</h3>
                  <div dangerouslySetInnerHTML={{ __html: section.description }} />
                </div>
              ))}
            </div>

            <div className="col-xl-6 col-lg-6 col-md-12">
              {/* Show job openings if available */}
              {sectionData.jobs && sectionData.jobs.length > 0 && (
                <div className="career-box career-box-top-spacing">
                  <h3>Current Openings</h3>

                  {/* Scrollable container for job listings */}
                  <div className="job-listings-scroll">
                    {/* Show only active jobs without filtering */}
                    {activeJobs
                      .sort((a: CareerJob, b: CareerJob) => {
                        // Define custom order - more specific matching
                        const getOrder = (title: string) => {
                          const lowerTitle = title.toLowerCase();
                          if (lowerTitle.includes('senior consultant')) return 0;
                          if (lowerTitle.includes('developer') && !lowerTitle.includes('senior consultant')) return 1;
                          return 2; // All other jobs
                        };

                        return getOrder(a.title) - getOrder(b.title);
                      })
                      .map((job: CareerJob, index: number) => {
                        const parsedJob = parseJobDescription(job.long_description);
                        return (
                          <div key={job.id} id={`job-${job.id}`} style={{ marginBottom: '20px' }}>
                            <h4>
                              {job.title}
                              <button
                                className="call-btn"
                                onClick={() => handleJobPdfDownload(job)}
                                style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--main-color)' }}
                              >
                                {job.job_description_doc ? 'Download PDF' : 'Learn More'}
                              </button>
                            </h4>
                            {parsedJob.responsibilities.length > 0 && (
                              <>
                                <h5>Responsibilities:</h5>
                                <ul className="with-bullets">
                                  {parsedJob.responsibilities.map((resp, respIndex) => (
                                    <li key={respIndex}>{resp}</li>
                                  ))}
                                </ul>
                              </>
                            )}
                            {parsedJob.idealFor.length > 0 && (
                              <>
                                <h5>Ideal For:</h5>
                                <ul className="with-bullets">
                                  {parsedJob.idealFor.map((ideal, idealIndex) => (
                                    <li key={idealIndex}>{ideal}</li>
                                  ))}
                                </ul>
                              </>
                            )}
                            {/* Fallback: if no parsed content, show raw description */}
                            {parsedJob.responsibilities.length === 0 && parsedJob.idealFor.length === 0 && job.long_description && (
                              <div dangerouslySetInnerHTML={{ __html: job.long_description }} />
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {sectionData.right_section.map((section, index) => (
                <div key={index} className="career-box">
                  <h3>{section.title}</h3>
                  <div dangerouslySetInnerHTML={{ __html: section.description }} />
                </div>
              ))}

              <div className="career-box">
                <h6>{sectionData.main_text}</h6>
                <div className="btn-sec">
                  {sectionData.left_button_text && (
                    <a className="call-btn" href={sectionData.left_button_url}>
                      {sectionData.left_button_text}
                    </a>
                  )}
                  {sectionData.right_button_text && (
                    <a className="up-btn" href={sectionData.right_button_url}>
                      {sectionData.right_button_text}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}