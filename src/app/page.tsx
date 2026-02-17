'use client';

import { useState } from 'react';
import { DEFAULT_CATEGORIES, BrandType } from '@/types/audit';

const categoryIcons: Record<string, string> = {
  'authority': '🏆',
  'on-page': '📄',
  'technical': '⚙️',
  'eeat': '✓',
  'ai-search': '🤖',
  'social-search': '📱',
  'performance': '⚡',
  'ecommerce-collection': '🛍️',
  'ecommerce-product': '📦',
  'local-gbp': '📍',
  'local-landing': '🏪',
  'international': '🌍',
};

// Brand-specific categories for display
const BRAND_SPECIFIC_CATEGORIES = [
  {
    id: 'ecommerce-collection',
    name: 'Collection Pages',
    description: 'Product carousels, filters, navigation, and collection page optimisation for ecommerce',
    brandType: 'ecommerce',
  },
  {
    id: 'ecommerce-product',
    name: 'Product Pages',
    description: 'Pricing, schema, stock availability, images, and product page best practices',
    brandType: 'ecommerce',
  },
  {
    id: 'local-gbp',
    name: 'Google Business Profile',
    description: 'GBP optimisation, reviews, photos, categories, and local presence management',
    brandType: 'local',
  },
  {
    id: 'local-landing',
    name: 'Local Landing Pages',
    description: 'NAP details, LocalBusiness schema, maps integration, and store information',
    brandType: 'local',
  },
  {
    id: 'international',
    name: 'International SEO',
    description: 'Hreflang implementation, multi-region content, language selectors, and geo-targeting',
    brandType: 'international',
  },
];

const brandTypes: { id: BrandType; name: string; icon: string }[] = [
  { id: 'general', name: 'General', icon: '🌐' },
  { id: 'ecommerce', name: 'Ecommerce', icon: '🛒' },
  { id: 'local', name: 'Local', icon: '📍' },
  { id: 'international', name: 'International', icon: '🌍' },
];

export default function Home() {
  const [url, setUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedBrandTypes, setSelectedBrandTypes] = useState<Set<BrandType>>(new Set());
  const [showBrandSelection, setShowBrandSelection] = useState(false);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setShowBrandSelection(true);
  };

  const toggleBrandType = (brandType: BrandType) => {
    setSelectedBrandTypes(prev => {
      const next = new Set(prev);
      if (next.has(brandType)) {
        next.delete(brandType);
      } else {
        next.add(brandType);
      }
      return next;
    });
  };

  const handleStartAudit = () => {
    if (!url || selectedBrandTypes.size === 0) return;
    const types = Array.from(selectedBrandTypes).join(',');
    window.location.href = `/audit?url=${encodeURIComponent(url)}&type=${types}`;
  };

  const handleBack = () => {
    setShowBrandSelection(false);
    setSelectedBrandTypes(new Set());
  };

  return (
    <main style={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <section
        style={{
          padding: '4rem 2rem 5rem',
          background: 'linear-gradient(180deg, var(--background-secondary) 0%, var(--background) 100%)',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              borderRadius: '100px',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '1.5rem',
            }}
          >
            <span>✨</span>
            <span>Comprehensive SEO Analysis</span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: '1.25rem',
              letterSpacing: '-0.02em',
            }}
          >
            Search <span className="animated-underline">Everything</span> Audit
          </h1>

          {/* Subheading */}
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'var(--muted)',
              marginBottom: '2.5rem',
              maxWidth: '600px',
              margin: '0 auto 2.5rem',
            }}
          >
            {showBrandSelection
              ? 'Select one or more brand types for a tailored audit experience.'
              : 'Analyse your website across 12 key categories and get actionable insights to improve your search visibility.'}
          </p>

          {!showBrandSelection ? (
            <>
              {/* Search Form */}
              <form onSubmit={handleUrlSubmit}>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    maxWidth: '580px',
                    margin: '0 auto',
                    padding: '0.5rem',
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: isFocused ? 'var(--shadow-lg)' : 'var(--shadow-md)',
                    border: `2px solid ${isFocused ? 'var(--primary)' : 'var(--border)'}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--muted)',
                        fontSize: '1.1rem',
                      }}
                    >
                      🔍
                    </span>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Enter your website URL..."
                      required
                      style={{
                        width: '100%',
                        padding: '1rem 1rem 1rem 3rem',
                        fontSize: '1rem',
                        border: 'none',
                        borderRadius: 'var(--radius)',
                        backgroundColor: 'transparent',
                        color: 'var(--foreground)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      padding: '1rem 2rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Continue →
                  </button>
                </div>
              </form>

              {/* Trust indicators */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '2rem',
                  marginTop: '2rem',
                  flexWrap: 'wrap',
                }}
              >
                {['150+ checks', '12 categories', 'Instant results'].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--muted)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <span style={{ color: 'var(--success)' }}>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* URL Display */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  marginBottom: '2rem',
                  fontSize: '0.9rem',
                }}
              >
                <span>🔗</span>
                <span style={{ color: 'var(--foreground)' }}>{url}</span>
                <button
                  onClick={handleBack}
                  style={{
                    marginLeft: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    backgroundColor: 'transparent',
                    color: 'var(--muted)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  Change
                </button>
              </div>

              {/* Brand Type Selection */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                  maxWidth: '400px',
                  margin: '0 auto 2rem',
                }}
              >
                {brandTypes.map((brand) => {
                  const isSelected = selectedBrandTypes.has(brand.id);
                  return (
                    <button
                      key={brand.id}
                      onClick={() => toggleBrandType(brand.id)}
                      style={{
                        padding: '1.25rem 1rem',
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--card-bg)',
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }
                      }}
                    >
                      {isSelected && (
                        <span style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary)',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>✓</span>
                      )}
                      <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{brand.icon}</div>
                      <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                        {brand.name}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Start Audit Button */}
              <button
                onClick={handleStartAudit}
                disabled={selectedBrandTypes.size === 0}
                style={{
                  padding: '1rem 3rem',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  backgroundColor: selectedBrandTypes.size > 0 ? 'var(--primary)' : 'var(--border)',
                  color: selectedBrandTypes.size > 0 ? 'white' : 'var(--muted)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  cursor: selectedBrandTypes.size > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedBrandTypes.size > 0) {
                    e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedBrandTypes.size > 0) {
                    e.currentTarget.style.backgroundColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                Start Audit →
              </button>
            </>
          )}
        </div>
      </section>

      {/* Categories Section */}
      {!showBrandSelection && (
        <section style={{ padding: '4rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
          {/* Core Categories */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
              }}
            >
              What We Analyse
            </h2>
            <p style={{ color: 'var(--muted)', maxWidth: '500px', margin: '0 auto' }}>
              A comprehensive audit covering all aspects of modern search visibility
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {DEFAULT_CATEGORIES.map((category) => (
              <div
                key={category.id}
                style={{
                  padding: '1.75rem',
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  transition: 'all 0.2s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: '1.75rem', display: 'block', marginBottom: '1rem' }}>
                  {categoryIcons[category.id] || '📊'}
                </span>
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                  }}
                >
                  {category.name}
                </h3>
                <p
                  style={{
                    color: 'var(--muted)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                  }}
                >
                  {category.description}
                </p>
              </div>
            ))}
          </div>

          {/* Brand-Specific Categories */}
          <div style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '3rem' }}>
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
              }}
            >
              Brand-Specific Analysis
            </h2>
            <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto' }}>
              Additional checks tailored to your business type — ecommerce, local, or international
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {BRAND_SPECIFIC_CATEGORIES.map((category) => (
              <div
                key={category.id}
                style={{
                  padding: '1.75rem',
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  transition: 'all 0.2s ease',
                  cursor: 'default',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                  }}
                >
                  {category.brandType}
                </span>
                <span style={{ fontSize: '1.75rem', display: 'block', marginBottom: '1rem' }}>
                  {categoryIcons[category.id] || '📊'}
                </span>
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                  }}
                >
                  {category.name}
                </h3>
                <p
                  style={{
                    color: 'var(--muted)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                  }}
                >
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
