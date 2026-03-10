/**
 * Storefront Header Component
 * Renders the header section of a storefront
 */

'use client';

import { StorefrontConfig, ThemeConfiguration } from '@/types/storefront';
import Link from 'next/link';

interface StorefrontHeaderProps {
  storefront: StorefrontConfig;
  theme: ThemeConfiguration;
}

export function StorefrontHeader({ storefront, theme }: StorefrontHeaderProps) {
  const logoUrl = theme.media.logoUrl;
  const bannerUrl = theme.media.bannerUrl;

  return (
    <header className="storefront-header">
      {/* Banner image if available */}
      {bannerUrl && (
        <div className="header-banner">
          <img 
            src={bannerUrl} 
            alt={`${storefront.handle} banner`}
            className="banner-image"
          />
        </div>
      )}

      {/* Main header content */}
      <div className="header-content">
        <div className="header-container">
          {/* Logo and store name */}
          <div className="header-brand">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={`${storefront.handle} logo`}
                className="store-logo"
              />
            ) : (
              <div className="store-name-fallback">
                {storefront.handle}
              </div>
            )}
          </div>

          {/* Navigation (placeholder for future implementation) */}
          <nav className="header-nav">
            <Link 
              href="/" 
              className="nav-link"
            >
              Back to Stitches Africa
            </Link>
          </nav>
        </div>
      </div>

      <style jsx>{`
        .storefront-header {
          background-color: var(--color-background);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .header-banner {
          width: 100%;
          height: 200px;
          overflow: hidden;
        }

        .banner-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .header-content {
          padding: 1rem 0;
        }

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-brand {
          display: flex;
          align-items: center;
        }

        .store-logo {
          height: 60px;
          width: auto;
          max-width: 200px;
        }

        .store-name-fallback {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--color-primary);
          text-transform: capitalize;
        }

        .header-nav {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .nav-link {
          color: var(--color-text);
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .nav-link:hover {
          background-color: var(--color-primary);
          color: white;
        }

        @media (max-width: 768px) {
          .header-container {
            padding: 0 1rem;
            flex-direction: column;
            gap: 1rem;
          }

          .header-banner {
            height: 120px;
          }

          .store-logo {
            height: 40px;
          }

          .store-name-fallback {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </header>
  );
}