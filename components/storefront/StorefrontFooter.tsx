/**
 * Storefront Footer Component
 * Renders the footer section of a storefront
 */

'use client';

import { StorefrontConfig, ThemeConfiguration } from '@/types/storefront';
import Link from 'next/link';

interface StorefrontFooterProps {
  storefront: StorefrontConfig;
  theme: ThemeConfiguration;
}

export function StorefrontFooter({ storefront, theme }: StorefrontFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="storefront-footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Store info */}
          <div className="footer-section">
            <h3 className="footer-title">{storefront.handle}</h3>
            <p className="footer-text">
              Powered by Stitches Africa
            </p>
          </div>

          {/* Links */}
          <div className="footer-section">
            <h4 className="footer-subtitle">Quick Links</h4>
            <ul className="footer-links">
              <li>
                <Link href="/" className="footer-link">
                  Stitches Africa Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="footer-link">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="footer-link">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-section">
            <h4 className="footer-subtitle">Legal</h4>
            <ul className="footer-links">
              <li>
                <Link href="/privacy-policy" className="footer-link">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="footer-link">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <p className="copyright">
            © {currentYear} {storefront.handle}. All rights reserved. 
            Powered by <Link href="/" className="stitches-link">Stitches Africa</Link>.
          </p>
        </div>
      </div>

      <style jsx>{`
        .storefront-footer {
          background-color: var(--color-secondary);
          color: white;
          margin-top: auto;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .footer-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .footer-title {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0;
          color: var(--color-accent);
        }

        .footer-subtitle {
          font-family: var(--font-heading);
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
        }

        .footer-text {
          margin: 0;
          opacity: 0.8;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .footer-link {
          color: white;
          text-decoration: none;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .footer-link:hover {
          opacity: 1;
          text-decoration: underline;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          padding-top: 1rem;
          text-align: center;
        }

        .copyright {
          margin: 0;
          opacity: 0.7;
          font-size: 0.875rem;
        }

        .stitches-link {
          color: var(--color-accent);
          text-decoration: none;
          font-weight: 600;
        }

        .stitches-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .footer-container {
            padding: 1rem;
          }

          .footer-content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>
    </footer>
  );
}