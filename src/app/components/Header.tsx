"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

export type NavigationItem = {
  label: string;
  url: string;
  is_external: boolean;
  order: number;
};

export type HeaderData = {
  logo: string;
  navigation: NavigationItem[];
  button: { text: string; link: string };
};

export type ApiShape = {
  success: boolean;
  data: { header: HeaderData };
};

type MiddleShape = { header?: HeaderData;[k: string]: unknown };

type HeaderProps = { data?: HeaderData | MiddleShape | ApiShape | null };

const isHeaderData = (x: unknown): x is HeaderData =>
  !!x &&
  typeof x === "object" &&
  Array.isArray((x as HeaderData).navigation) &&
  typeof (x as HeaderData).button?.text === "string";

const isApiShape = (x: unknown): x is ApiShape =>
  !!x &&
  typeof x === "object" &&
  isHeaderData((x as ApiShape)?.data?.header);

const isMiddleShape = (x: unknown): x is MiddleShape =>
  !!x &&
  typeof x === "object" &&
  isHeaderData((x as MiddleShape)?.header);

const STORAGE_BASE = "https://vgc.psofttechnologies.in/storage/";

const normalizeUrl = (raw?: string) => {
  if (!raw) return "/";
  let url = raw.trim().replace(/\\/g, "");
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith("/")) url = `/${url}`;
  if (url === "/home") return "/";
  return url;
};

const isExternalItem = (item: NavigationItem) =>
  item.is_external || /^https?:\/\//i.test(item.url || "");

export default function Header({ data }: HeaderProps) {
  const header: HeaderData | null = useMemo(() => {
    if (isHeaderData(data)) return data;
    if (isMiddleShape(data)) return data.header!;
    if (isApiShape(data)) return data.data.header;
    return null;
  }, [data]);

  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  const [logoSrc, setLogoSrc] = useState<string>("/images/logo.svg");
  useEffect(() => {
    setLogoSrc(header?.logo ? `${STORAGE_BASE}${header.logo}` : "/images/logo.svg");
  }, [header?.logo]);

  const navigation: NavigationItem[] = useMemo(() => {
    if (header?.navigation?.length) {
      return [...header.navigation]
        .filter((n) => !!n?.label && !!n?.url)
        .sort((a, b) => a.order - b.order);
    }
    // Fallback when no header present
    return [
      { label: "Home", url: "/", is_external: false, order: 1 },
      { label: "About", url: "/about-us", is_external: false, order: 2 },
      { label: "Services", url: "/service", is_external: false, order: 3 },
      { label: "Blog", url: "/blog", is_external: false, order: 4 },
      { label: "Career", url: "/career", is_external: false, order: 5 },
    ];
  }, [header?.navigation]);

  const buttonText = header?.button?.text ?? "Get Quote";
  const buttonHref = normalizeUrl(header?.button?.link ?? "/contact-us");

  // Shrink on scroll (passive + cleanup)
  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const onScroll = () => {
      if (window.scrollY > 50) node.classList.add("smaller");
      else node.classList.remove("smaller");
    };

    // Run once to set initial state
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll when offcanvas open
  useEffect(() => {
    const { style } = document.body;
    if (!menuOpen) {
      style.overflow = "";
      return;
    }
    const prev = style.overflow;
    style.overflow = "hidden";
    return () => {
      style.overflow = prev || "";
    };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);




  const [styles, setStyles] = useState({
    borderTop: "1px solid #eef0f2",
    marginTop: "15px",
    paddingTop: "15px",
    paddingBottom: "10px",
    width: "100%",
    boxSizing: "border-box",
    textAlign: "center",
  });

  const [linkStyles, setLinkStyles] = useState({
    display: "inline-block",
    background: "#0070f3",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: 600,
    textDecoration: "none",
    transition: "background 0.2s",
    width: "auto",
    boxSizing: "border-box",
  });

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 480) {
        setLinkStyles(current => ({
          ...current,
          padding: "14px 16px",
          fontSize: "0.95rem",
          width: "90%",
        }));
        setStyles(current => ({
          ...current,
          paddingTop: "18px",
          paddingBottom: "12px",
          marginTop: "10px",
        }));
      } else {
        setLinkStyles(current => ({
          ...current,
          padding: "12px 24px",
          fontSize: "1rem",
          width: "auto",
        }));
        setStyles(current => ({
          ...current,
          paddingTop: "15px",
          paddingBottom: "10px",
          marginTop: "15px",
        }));
      }
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  return (
    <header ref={headerRef}>
      <div className="container">
        <div className="row">
          <div
            className="col-lg-12 col-md-12"
            style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}
          >
            {/* Desktop logo */}
            <div className="d-none d-md-inline-flex " style={{ alignItems: "center"  }}>
              <Link href="/" aria-label="Home">
                <Image
                  src={logoSrc}
                  alt="Company logo"
                  width={200}
                  height={80}
                  priority
                  unoptimized
                  style={{ height: "56px", width: "auto", objectFit: "contain" }}
                  onError={() => setLogoSrc("/images/logo.svg")}
                />
              </Link>
            </div>

            {/* Mobile logo */}
            <div className="mob-logo d-md-none" style={{ display: "flex", alignItems: "center" }}>
              <Link href="/" aria-label="Home (mobile)">
                <Image
                  src={logoSrc}
                  alt="Company logo"
                  width={140}
                  height={44}
                  priority
                  unoptimized
                  style={{ height: "44px", width: "auto", objectFit: "contain" }}
                  onError={() => setLogoSrc("/images/logo.svg")}
                />
              </Link>
            </div>

            {/* Navbar */}
            <nav className="navbar navbar-expand-md" style={{ marginLeft: "auto", marginRight: "9px" }}>
              <button
                className={`navbar-toggler ${menuOpen ? "open" : "collapsed"} d-flex flex-column justify-content-center `}
                type="button"
                aria-controls="navbarCollapse"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((s) => !s)}
                style={{ border: "none", background: "transparent" }}
              >
                <span className="sr-only">Toggle navigation</span>
                <span className="icon-bar top" />
                <span className="icon-bar middle" />
                <span className="icon-bar bottom" />
              </button>

              {/* Desktop inline nav */}
              <div
                className="navbar-collapse collapse d-none d-md-flex"
                id="navbarCollapse"
                style={{ marginLeft: "auto" }}
              >
                <ul
                  className="navbar-nav"
                  style={{ display: "flex", gap: 12, alignItems: "center", marginLeft: "auto" }}
                >
                  {navigation.map((item) => {
                    const href = normalizeUrl(item.url);
                    const key = `${item.order}-${item.label}`;
                    if (!href) return null;
                    return (
                      <li key={key} className="nav-item">
                        {isExternalItem(item) ? (
                          <a className="nav-link" href={href} target="_blank" rel="noopener noreferrer">
                            {item.label}
                          </a>
                        ) : (
                          <Link href={href} className="nav-link">
                            {item.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>

            {/* CTA Button - Hidden on mobile */}
            <div style={{ marginLeft: 20 }} className="d-none d-md-block ">
              <Link href={buttonHref} className="cont-btn " aria-label={buttonText}>
                {buttonText}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Offcanvas drawer for mobile */}
      <div className={`offcanvas-left ${menuOpen ? "open" : ""}`} role="dialog" aria-modal={menuOpen}>
        <div className="offcanvas-header">
          <div className="offcanvas-logo" aria-hidden="true" />
        </div>
        <nav className="offcanvas-nav" aria-label="Mobile">
          <ul>
            {navigation.map((item) => {
              const href = normalizeUrl(item.url);
              const key = `m-${item.order}-${item.label}`;
              if (!href) return null;
              return (
                <li key={key}>
                  {isExternalItem(item) ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" onClick={closeMenu}>
                      {item.label}
                    </a>
                  ) : (
                    <Link href={href} onClick={closeMenu}>
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
 
 
            <li className="mobile-cta-button" style={styles}>
              <a href={buttonHref} onClick={closeMenu} style={linkStyles}>
                {buttonText}
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* Backdrop */}
      <div className={`offcanvas-backdrop ${menuOpen ? "show" : ""}`} onClick={closeMenu} />
    </header>
  );
}
