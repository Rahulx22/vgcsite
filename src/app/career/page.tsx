"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { API_URL, fetchWithTimeout, ensureUrl, stripHtml } from "../../lib/api";
import type { CareerApiResponse, CareerHeaderBlock, CareerSectionBlock, CareerSection, CareerJob } from "../../types/pages";
import type { Metadata } from "next";
import Head from "next/head";

// Add static metadata
// Note: Metadata cannot be exported from client components
// Move to a separate metadata file or remove "use client" directive if metadata is needed

// Helper function to decode HTML entities









function decodeHtmlEntities(text: string): string {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

// Enhanced helper function to parse HTML list items
function parseHtmlList(html: string): string[] {
  const items: string[] = [];

  // Try multiple parsing approaches
  if (!html) return items;

  // Approach 1: Look for <li> tags with <p> inside
  const regex1 = /<li[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/li>/g;
  let match1;
  while ((match1 = regex1.exec(html)) !== null) {
    const content = match1[1].trim();
    if (content) {
      // Remove any nested HTML tags but preserve the text
      const cleanText = content.replace(/<[^>]*>/g, '').trim();
      if (cleanText) {
        items.push(decodeHtmlEntities(cleanText));
      }
    }
  }

  // If no items found, try <li> tags with direct text content
  if (items.length === 0) {
    const regex2 = /<li[^>]*>([\s\S]*?)<\/li>/g;
    let match2;
    while ((match2 = regex2.exec(html)) !== null) {
      const content = match2[1].trim();
      if (content) {
        // Remove any nested HTML tags but preserve the text
        const cleanText = content.replace(/<[^>]*>/g, '').trim();
        if (cleanText) {
          items.push(decodeHtmlEntities(cleanText));
        }
      }
    }
  }

  // If still no items, try a simpler approach for plain text
  if (items.length === 0) {
    // Try to split by line breaks or other separators
    const lines = html.split(/[\n\r]+/);
    for (const line of lines) {
      const cleanLine = line.replace(/<[^>]*>/g, '').trim();
      if (cleanLine && cleanLine.length > 10) { // Only add if it's substantial content
        items.push(decodeHtmlEntities(cleanLine));
      }
    }
  }

  return items;
}

// Enhanced helper function to parse job responsibilities and ideal for sections
function parseJobDescription(longDescription: string) {
  const responsibilities: string[] = [];
  const idealFor: string[] = [];

  // Handle case where longDescription might be empty or invalid
  if (!longDescription || typeof longDescription !== 'string') {
    return { responsibilities, idealFor };
  }

  try {
    // Try to find sections by h5 tags first
    if (longDescription.includes('<h5')) {
      // Split by h5 tags to get sections
      const sections = longDescription.split(/<h5[^>]*>([^<]+)<\/h5>/i);

      for (let i = 1; i < sections.length; i += 2) {
        const title = sections[i] ? sections[i].trim() : '';
        const content = sections[i + 1] || '';

        const items = parseHtmlList(content);

        if (title.toLowerCase().includes('responsibilities') || title.toLowerCase().includes('responsibility')) {
          responsibilities.push(...items);
        } else if (title.toLowerCase().includes('ideal')) {
          idealFor.push(...items);
        }
      }
    } else {
      // If no h5 tags, try to parse the entire content as a single section
      // Look for keywords to determine section type
      const items = parseHtmlList(longDescription);

      // If we have items, try to determine which section they belong to based on content
      if (items.length > 0) {
        // Simple heuristic: if any item contains responsibility-related words, put in responsibilities
        const responsibilityKeywords = ['responsible', 'responsibility', 'task', 'duty', 'handle', 'manage', 'coordinate'];
        const idealKeywords = ['ideal', 'candidate', 'qualification', 'requirement', 'skill', 'experience'];

        const hasResponsibilityKeywords = items.some(item =>
          responsibilityKeywords.some(keyword => item.toLowerCase().includes(keyword))
        );

        const hasIdealKeywords = items.some(item =>
          idealKeywords.some(keyword => item.toLowerCase().includes(keyword))
        );

        if (hasResponsibilityKeywords || (!hasIdealKeywords && items.length > 2)) {
          responsibilities.push(...items);
        } else if (hasIdealKeywords) {
          idealFor.push(...items);
        } else {
          // Default to responsibilities if we can't determine
          responsibilities.push(...items);
        }
      }
    }
  } catch (error) {
    console.error('Error parsing job description:', error);
    // Fallback: try to parse the entire content as list items
    try {
      const items = parseHtmlList(longDescription);
      if (items.length > 0) {
        responsibilities.push(...items);
      }
    } catch (fallbackError) {
      console.error('Fallback parsing also failed:', fallbackError);
    }
  }

  return { responsibilities, idealFor };
}

// Helper function to extract role type from job title
function extractRoleType(title: string): string {
  // Common role categories
  const roleCategories = [
    'developer', 'engineer', 'programmer',
    'consultant', 'advisor', 'specialist',
    'manager', 'director', 'lead',
    'accountant', 'accountant',
    'analyst', 'associate',
    'senior', 'jr', 'junior'
  ];

  const lowerTitle = title.toLowerCase();

  // Check for specific role categories
  for (const category of roleCategories) {
    if (lowerTitle.includes(category)) {
      // Capitalize first letter
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }

  // Default to "Other" if no category found
  return "Other";
}

export default function CareerPage() {
  const [careerData, setCareerData] = useState<CareerApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('All'); // Add state for role filter

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    position: "",
    linkedin: "",
    degree: "",
    personalNote: ""
  });
  const [resume, setResume] = useState<File | null>(null);
  const [resumePreview, setResumePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchCareerData = async () => {
      try {
        setLoading(true);
        // Fetch all pages from API with 5-minute caching
        const response = await fetchWithTimeout(API_URL, {
          cache: 'force-cache',
          next: { revalidate: 300 } // Cache for 5 minutes (300 seconds)
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch pages data: ${response.status}`);
        }

        const apiResponse = await response.json();
        const pages = Array.isArray(apiResponse?.data) ? apiResponse.data : [];

        // Find the career page from all pages
        const careerPage = pages.find((page: any) =>
          page.type === 'career' || page.slug === 'career'
        );

        if (!careerPage) {
          throw new Error('Career page not found in API response');
        }

        // Debug log to see the career page data
        console.log('Career page data:', careerPage);

        setCareerData(careerPage);
      } catch (err) {
        console.error('Error fetching career data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load career data');
      } finally {
        setLoading(false);
      }
    };

    fetchCareerData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResume(file);

      // Create preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setResumePreview(e.target?.result as string);
        };
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
      // Prepare the data to match API expected format
      const submitData = new FormData();
      submitData.append('first_name', formData.firstName);
      submitData.append('last_name', formData.lastName);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('city', formData.city);
      submitData.append('position', formData.position);
      submitData.append('linkedin_url', formData.linkedin);
      submitData.append('degree', formData.degree);
      submitData.append('personal_note', formData.personalNote);

      // Add resume file if selected
      if (resume) {
        submitData.append('resume', resume);
      }

      const response = await fetch("https://vgc.psofttechnologies.in/api/v1/resume-form", {
        method: "POST",
        body: submitData,
      });

      if (!response.ok) {
        throw new Error(`Failed to submit form: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Form submitted successfully:", result);
      setSubmitSuccess(true);

      // Reset form after successful submission
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        city: "",
        position: "",
        linkedin: "",
        degree: "",
        personalNote: ""
      });
      setResume(null);
      setResumePreview(null);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("Error submitting form:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to submit form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error || !careerData) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
        <h2>Error: {error || 'Failed to load career data'}</h2>
      </div>
    );
  }

  // Extract data from API response
  const headerBlock = careerData.blocks.find(block => block.type === 'career_header') as CareerHeaderBlock;
  const sectionBlock = careerData.blocks.find(block => block.type === 'career_section') as CareerSectionBlock;

  if (!headerBlock || !sectionBlock) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
        <h2>Error: Invalid career data structure</h2>
      </div>
    );
  }

  const headerData = headerBlock.data;
  const sectionData = sectionBlock.data;

  // Function to handle PDF download for a job
  const handleJobPdfDownload = (job: CareerJob) => {
    // Debug log to see the job data
    console.log('Job data for PDF download:', job);

    // Check if job has a PDF document URL
    if (job.job_description_doc) {
      // Construct the full URL for the PDF using the correct path
      const baseUrl = 'https://vgc.psofttechnologies.in';
      const cleanPath = job.job_description_doc.replace(/^\/+/, ''); // Remove leading slashes
      const pdfUrl = `${baseUrl}/storage/${cleanPath}`;

      // Debug log to see the final URL
      console.log('Final PDF URL:', pdfUrl);

      // Check if the URL looks correct
      if (pdfUrl.endsWith('.pdf')) {
        // Try to open the PDF in a new tab
        const newWindow = window.open(pdfUrl, '_blank');

        // If popup blocking prevents opening, provide a fallback
        if (!newWindow) {
          // Create a temporary link and trigger download
          const a = document.createElement('a');
          a.href = pdfUrl;
          a.target = '_blank';
          a.download = `VGC-${job.title.replace(/\s+/g, '-')}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } else {
        console.error('PDF URL does not end with .pdf:', pdfUrl);
        alert('Invalid PDF URL. Please contact support.');
      }
    } else {
      console.log('No PDF document found for job:', job.title);
      // Fallback: scroll to the job section
      const element = document.getElementById(`job-${job.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Extract active jobs (without filtering)
  const activeJobs = sectionData.jobs?.filter(job =>
    job.status === 'active' || job.status === 'Active' || job.status === 'ACTIVE'
  ) || [];

  // Get unique responsibilities from all jobs to create filter options
  const getUniqueResponsibilities = () => {
    const responsibilitiesSet = new Set<string>();
    responsibilitiesSet.add('All'); // Add 'All' option

    activeJobs.forEach(job => {
      const parsedJob = parseJobDescription(job.long_description);
      parsedJob.responsibilities.forEach(resp => {
        // Extract key responsibility categories from the responsibility text
        const lowerResp = resp.toLowerCase();
        if (lowerResp.includes('manage') || lowerResp.includes('lead') || lowerResp.includes('supervis')) {
          responsibilitiesSet.add('Management');
        } else if (lowerResp.includes('develop') || lowerResp.includes('code') || lowerResp.includes('program')) {
          responsibilitiesSet.add('Development');
        } else if (lowerResp.includes('design') || lowerResp.includes('ui') || lowerResp.includes('ux')) {
          responsibilitiesSet.add('Design');
        } else if (lowerResp.includes('analy') || lowerResp.includes('data') || lowerResp.includes('report')) {
          responsibilitiesSet.add('Analysis');
        } else if (lowerResp.includes('support') || lowerResp.includes('help') || lowerResp.includes('assist')) {
          responsibilitiesSet.add('Support');
        } else if (lowerResp.includes('finance') || lowerResp.includes('account') || lowerResp.includes('tax')) {
          responsibilitiesSet.add('Finance');
        } else {
          responsibilitiesSet.add('Other');
        }
      });
    });

    return Array.from(responsibilitiesSet);
  };

  // Filter jobs based on selected responsibility
  const filteredJobs = selectedRole === 'All' ? activeJobs : activeJobs.filter(job => {
    const parsedJob = parseJobDescription(job.long_description);
    return parsedJob.responsibilities.some(resp => {
      const lowerResp = resp.toLowerCase();
      switch (selectedRole) {
        case 'Management':
          return lowerResp.includes('manage') || lowerResp.includes('lead') || lowerResp.includes('supervis');
        case 'Development':
          return lowerResp.includes('develop') || lowerResp.includes('code') || lowerResp.includes('program');
        case 'Design':
          return lowerResp.includes('design') || lowerResp.includes('ui') || lowerResp.includes('ux');
        case 'Analysis':
          return lowerResp.includes('analy') || lowerResp.includes('data') || lowerResp.includes('report');
        case 'Support':
          return lowerResp.includes('support') || lowerResp.includes('help') || lowerResp.includes('assist');
        case 'Finance':
          return lowerResp.includes('finance') || lowerResp.includes('account') || lowerResp.includes('tax');
        default:
          return false;
      }
    });
  });


//



  return (
    <>
      <Head>  <link rel="canonical" href="https://vgcadvisors.com/career" />
        <meta name="robots" content="index, follow"></meta></Head>

      <div className="business-banner dd">
        <div className="container-fluid">
          <div className="row">
            <div className="col-xl-5 col-lg-6 col-md-12 offset-xl-1"
              data-aos="fade-right"
              data-aos-duration="1200">
              <nav>
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="/">Home</a>
                  </li>
                  <li className="breadcrumb-item active">
                    Career
                  </li>
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
                style={{
                  width: '100%',
                  height: 'auto'
                }}
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