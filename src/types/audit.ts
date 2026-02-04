// SEO Audit Categories and Scoring Types

export interface AuditCategory {
  id: string;
  name: string;
  description: string;
  weight: number; // How much this category contributes to overall score (0-100)
  checks: AuditCheck[];
}

export interface AuditCheck {
  id: string;
  name: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  passed: boolean | null; // null = not yet checked
  score: number; // 0-100
  details?: string;
  recommendations?: string[];
}

export interface AuditResult {
  url: string;
  timestamp: Date;
  overallScore: number;
  categories: CategoryResult[];
}

export interface CategoryResult {
  category: AuditCategory;
  score: number;
  passedChecks: number;
  totalChecks: number;
}

// Default audit categories for SEO
export const DEFAULT_CATEGORIES: Omit<AuditCategory, 'checks'>[] = [
  {
    id: 'authority',
    name: 'Authority',
    description: 'Backlink profile, domain strength, brand mentions, and trust signals',
    weight: 20,
  },
  {
    id: 'on-page',
    name: 'On-Page',
    description: 'Title tags, meta descriptions, headings, keyword optimisation, and content structure',
    weight: 15,
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Crawlability, indexability, site architecture, and technical health',
    weight: 15,
  },
  {
    id: 'eeat',
    name: 'EEAT',
    description: 'Experience, Expertise, Authoritativeness, and Trustworthiness signals',
    weight: 15,
  },
  {
    id: 'ai-search',
    name: 'AI Search',
    description: 'Optimisation for AI Overviews, SGE, ChatGPT, Perplexity, and LLM visibility',
    weight: 10,
  },
  {
    id: 'social-search',
    name: 'Social Search',
    description: 'Discoverability on TikTok, YouTube, Instagram, and social platforms',
    weight: 15,
  },
  {
    id: 'performance',
    name: 'Performance',
    description: 'Page speed, Core Web Vitals (LCP, INP, CLS), and loading optimisation',
    weight: 10,
  },
];

// Default checks for each category - ordered by importance (critical -> high -> medium -> low)
export const AUTHORITY_CHECKS: Omit<AuditCheck, 'passed' | 'score' | 'details' | 'recommendations'>[] = [
  // Critical
  {
    id: 'dr-growth',
    name: 'Domain Rating Growth',
    description: 'Does the site have a clear increase in domain rating over the last 2 years?',
    importance: 'critical',
  },
  {
    id: 'natural-link-profile',
    name: 'Natural Link Profile',
    description: 'Does the site have a natural link profile attributed to it?',
    importance: 'critical',
  },
  // High
  {
    id: 'high-authority-backlinks',
    name: 'High-Authority Backlinks',
    description: 'Does the site have backlinks from at least 10 high-authority domains (DR 50+) in the past 12 months?',
    importance: 'high',
  },
  {
    id: 'referring-domains-growth',
    name: 'Referring Domains Growth',
    description: 'Does the site have a clear, consistent increase in referring domains over the last 12 months?',
    importance: 'high',
  },
  {
    id: 'anchor-text-distribution',
    name: 'Anchor Text Distribution',
    description: 'Is the anchor text profile of the website natural and NOT exact-match heavy?',
    importance: 'high',
  },
  // Medium
  {
    id: 'spam-score',
    name: 'Low Spam Score',
    description: 'Does the site have a spam score of 1% or less?',
    importance: 'medium',
  },
];

export const ON_PAGE_CHECKS: Omit<AuditCheck, 'passed' | 'score' | 'details' | 'recommendations'>[] = [
  // Critical
  {
    id: 'meta-titles',
    name: 'Optimised Meta Titles',
    description: 'Do all key pages have optimised meta titles?',
    importance: 'critical',
  },
  {
    id: 'h1-tags',
    name: 'Single H1 Tag',
    description: 'Do all pages have x1 H1 tag?',
    importance: 'critical',
  },
  // High
  {
    id: 'url-structure',
    name: 'URL Structure',
    description: 'Is the website\'s URL structure clear, concise and logical?',
    importance: 'high',
  },
  {
    id: 'image-alt-text',
    name: 'Image Alt Text',
    description: 'Do images have optimised alt text attributed to them on a consistent basis across the site?',
    importance: 'high',
  },
  // Medium
  {
    id: 'meta-descriptions',
    name: 'Optimised Meta Descriptions',
    description: 'Do all key pages have optimised meta descriptions?',
    importance: 'medium',
  },
  // Low
  {
    id: 'image-file-names',
    name: 'Image File Names',
    description: 'Do images have optimised file names attributed to them on a consistent basis across the site?',
    importance: 'low',
  },
];

export const TECHNICAL_CHECKS: Omit<AuditCheck, 'passed' | 'score' | 'details' | 'recommendations'>[] = [
  // Critical
  {
    id: 'robots-txt',
    name: 'Robots.txt Valid',
    description: 'Check if robots.txt exists and is valid.',
    importance: 'critical',
  },
  {
    id: 'sitemap-exists',
    name: 'Sitemap.xml Exists',
    description: 'Does sitemap.xml file exist?',
    importance: 'critical',
  },
  {
    id: 'internal-404s',
    name: 'Internal 404 Errors',
    description: 'Are there internal 404 errors firing on the website?',
    importance: 'critical',
  },
  {
    id: 'missing-meta-titles',
    name: 'Missing Meta Titles',
    description: 'Any missing meta titles?',
    importance: 'critical',
  },
  {
    id: 'noindex-key-pages',
    name: 'Noindex on Key Pages',
    description: 'Any key pages have a noindex tag attributed on them?',
    importance: 'critical',
  },
  // High
  {
    id: 'sitemap-errors',
    name: 'Sitemap URL Errors',
    description: 'Do URLs in sitemap.xml file return any 404 or 3xx errors?',
    importance: 'high',
  },
  {
    id: 'internal-redirects',
    name: 'Internal Redirects',
    description: 'Are there internal redirects firing on the website?',
    importance: 'high',
  },
  {
    id: 'duplicate-meta-titles',
    name: 'Duplicate Meta Titles',
    description: 'Any duplicate meta titles?',
    importance: 'high',
  },
  {
    id: 'click-depth',
    name: 'Click Depth',
    description: 'Are any key pages >3 clicks from the homepage?',
    importance: 'high',
  },
  {
    id: 'js-dependency',
    name: 'JavaScript Dependency',
    description: 'Does critical content load without dependency of JavaScript (e.g. navigation/key HTML)?',
    importance: 'high',
  },
  {
    id: 'ai-crawlers-blocked',
    name: 'AI Crawlers Access',
    description: 'Are AI crawlers blocked in robots.txt? (they should not be)',
    importance: 'high',
  },
  // Medium
  {
    id: 'self-referencing-canonicals',
    name: 'Self-Referencing Canonicals',
    description: 'Do the main URLs have self-referencing canonical tags that we want to rank?',
    importance: 'medium',
  },
  {
    id: 'duplicate-meta-descriptions',
    name: 'Duplicate Meta Descriptions',
    description: 'Any duplicate meta descriptions?',
    importance: 'medium',
  },
  {
    id: 'missing-meta-descriptions',
    name: 'Missing Meta Descriptions',
    description: 'Any missing meta descriptions?',
    importance: 'medium',
  },
  {
    id: 'orphan-pages',
    name: 'Orphan Pages',
    description: 'Any orphan pages on the website?',
    importance: 'medium',
  },
  {
    id: 'organisation-schema',
    name: 'Organisation Schema',
    description: 'Does the website have organisation schema marked up?',
    importance: 'medium',
  },
  {
    id: 'placeholder-text',
    name: 'Placeholder Text',
    description: 'Is there any lorem ipsum placeholder text on the site?',
    importance: 'medium',
  },
];

export const EEAT_CHECKS: Omit<AuditCheck, 'passed' | 'score' | 'details' | 'recommendations'>[] = [
  // Critical
  {
    id: 'about-page-exists',
    name: 'About Page Exists',
    description: 'Is there an about page that exists on the site?',
    importance: 'critical',
  },
  // High
  {
    id: 'about-page-details',
    name: 'About Page Details',
    description: 'Does the about page include details such as team members, company overview/history and company values?',
    importance: 'high',
  },
  {
    id: 'author-profile-pages',
    name: 'Author Profile Pages',
    description: 'Does the site have author profile landing pages with clear details about the author\'s expertise, including aspects such as an overview, links to social profiles and any blogs that author has written on the site?',
    importance: 'high',
  },
  {
    id: 'author-bios',
    name: 'Author Bios in Content',
    description: 'Are there author bios included in the blog content pages with clickable links to the author landing pages?',
    importance: 'high',
  },
  {
    id: 'date-published-updated',
    name: 'Date Published/Updated',
    description: 'Is there a date published/updated section on the blog content?',
    importance: 'high',
  },
  {
    id: 'reviews-page',
    name: 'Reviews Page',
    description: 'Is there a reviews page on the site?',
    importance: 'high',
  },
  {
    id: 'privacy-policy',
    name: 'Privacy Policy Page',
    description: 'Is there a privacy policy page on the site?',
    importance: 'high',
  },
  // Medium
  {
    id: 'person-schema',
    name: 'Person Schema',
    description: 'Is person schema added to the author pages with correct information?',
    importance: 'medium',
  },
  {
    id: 'reviews-rating',
    name: 'Reviews Rating',
    description: 'If reviews are integrated on the site, do they have over 4.5 star rating?',
    importance: 'medium',
  },
  {
    id: 'terms-conditions',
    name: 'Terms & Conditions Page',
    description: 'Is there a T&Cs page on the site?',
    importance: 'medium',
  },
  {
    id: 'social-media-links',
    name: 'Social Media Links',
    description: 'Does the website have links to their social media profiles in the footer of the site?',
    importance: 'medium',
  },
  // Low
  {
    id: 'favicon',
    name: 'Favicon',
    description: 'Is the favicon added to the site correctly and pulling through to the search results?',
    importance: 'low',
  },
  {
    id: 'optimised-404-page',
    name: 'Optimised 404 Page',
    description: 'Is the 404 page optimised for users to navigate back to key pages on the site?',
    importance: 'low',
  },
];

export const SOCIAL_SEARCH_CHECKS: Omit<AuditCheck, 'passed' | 'score' | 'details' | 'recommendations'>[] = [
  // High
  {
    id: 'tiktok-active',
    name: 'TikTok Presence',
    description: 'Is the brand active across TikTok?',
    importance: 'high',
  },
  {
    id: 'youtube-active',
    name: 'YouTube Presence',
    description: 'Is the brand active across YouTube?',
    importance: 'high',
  },
  {
    id: 'instagram-active',
    name: 'Instagram Presence',
    description: 'Is the brand active across Instagram?',
    importance: 'high',
  },
  {
    id: 'social-engagement',
    name: 'Social Engagement Management',
    description: 'Are social comments and reviews being responded to and managed consistently?',
    importance: 'high',
  },
  // Medium
  {
    id: 'pinterest-active',
    name: 'Pinterest Presence',
    description: 'Is the brand active across Pinterest?',
    importance: 'medium',
  },
  {
    id: 'consistent-handles',
    name: 'Consistent Handles',
    description: 'Are brand handles and usernames consistent across all social search platforms?',
    importance: 'medium',
  },
];

export const AI_SEARCH_CHECKS: Omit<AuditCheck, 'passed' | 'score' | 'details' | 'recommendations'>[] = [
  // Critical
  {
    id: 'clear-direct-answers',
    name: 'Clear, Direct Answers',
    description: 'Does content provide concise, direct answers to common questions (not buried in fluff)?',
    importance: 'critical',
  },
  // High
  {
    id: 'faq-sections',
    name: 'FAQ Sections',
    description: 'Are FAQ sections with Q&A format present on key pages?',
    importance: 'high',
  },
  {
    id: 'structured-data-coverage',
    name: 'Structured Data Coverage',
    description: 'Is comprehensive schema markup used (FAQ, HowTo, Article, Product, etc.)?',
    importance: 'high',
  },
  {
    id: 'content-freshness',
    name: 'Content Freshness',
    description: 'Is content regularly updated with visible "last updated" dates?',
    importance: 'high',
  },
  {
    id: 'comprehensive-topic-coverage',
    name: 'Comprehensive Topic Coverage',
    description: 'Does content thoroughly cover topics rather than shallow overviews?',
    importance: 'high',
  },
  // Medium
  {
    id: 'original-research',
    name: 'Original Research/Statistics',
    description: 'Does the site publish original data, studies, or unique insights that AI would cite?',
    importance: 'medium',
  },
  {
    id: 'entity-recognition',
    name: 'Entity Recognition',
    description: 'Is the brand/site recognised as an entity (appears in knowledge panels, Wikipedia, etc.)?',
    importance: 'medium',
  },
  {
    id: 'citation-ready-formatting',
    name: 'Citation-Ready Formatting',
    description: 'Are key facts, definitions, and stats formatted in easily extractable ways?',
    importance: 'medium',
  },
];

export const PERFORMANCE_CHECKS: Omit<AuditCheck, 'passed' | 'score' | 'details' | 'recommendations'>[] = [
  // Critical
  {
    id: 'lcp',
    name: 'LCP (Largest Contentful Paint)',
    description: 'Is LCP under 2.5 seconds?',
    importance: 'critical',
  },
  {
    id: 'inp',
    name: 'INP (Interaction to Next Paint)',
    description: 'Is INP under 200ms?',
    importance: 'critical',
  },
  {
    id: 'cls',
    name: 'CLS (Cumulative Layout Shift)',
    description: 'Is CLS under 0.1?',
    importance: 'critical',
  },
  // High
  {
    id: 'mobile-page-speed',
    name: 'Mobile Page Speed Score',
    description: 'Does the site score 75+ on mobile in PageSpeed Insights?',
    importance: 'high',
  },
  {
    id: 'desktop-page-speed',
    name: 'Desktop Page Speed Score',
    description: 'Does the site score 75+ on desktop in PageSpeed Insights?',
    importance: 'high',
  },
  {
    id: 'mobile-responsiveness',
    name: 'Mobile Responsiveness',
    description: 'Is the site fully responsive and mobile-friendly?',
    importance: 'high',
  },
  // Medium
  {
    id: 'ttfb',
    name: 'TTFB (Time to First Byte)',
    description: 'Is server response time under 800ms?',
    importance: 'medium',
  },
  {
    id: 'image-optimisation',
    name: 'Image Optimisation',
    description: 'Are images compressed and using modern formats (WebP/AVIF)?',
    importance: 'medium',
  },
  {
    id: 'render-blocking-resources',
    name: 'Render-Blocking Resources',
    description: 'Are critical CSS/JS optimised to not block rendering?',
    importance: 'medium',
  },
];

// ==========================================
// BRAND-TYPE SPECIFIC CHECKS
// ==========================================

// ECOMMERCE: Collection Pages - ordered by importance
export const ECOMMERCE_COLLECTION_CHECKS: Omit<AuditCheck, 'passed' | 'score' | 'details' | 'recommendations'>[] = [
  // Critical
  {
    id: 'collection-product-carousels',
    name: 'Product Carousels',
    description: 'Do collection pages have product carousels that link to individual product pages?',
    importance: 'critical',
  },
  {
    id: 'collection-filter-canonicals',
    name: 'Filter Canonicalisation',
    description: 'Is there a filter system that works and canonicalises correctly to the collection URL?',
    importance: 'critical',
  },
  {
    id: 'collection-h1-optimised',
    name: 'Optimised Collection H1s',
    description: 'There are clear, optimised H1s on key collection pages for focus keyword intents.',
    importance: 'critical',
  },
  {
    id: 'collection-navigation-access',
    name: 'Navigation Accessibility',
    description: 'Key collection pages are accessible from navigation/homepage.',
    importance: 'critical',
  },
  // High
  {
    id: 'collection-h1-description',
    name: 'H1 Description',
    description: 'Do collection pages have a brief description underneath the H1?',
    importance: 'high',
  },
  {
    id: 'collection-carousel-alt-text',
    name: 'Carousel Image Alt Text',
    description: 'Has alt text been added to product images in the product carousel?',
    importance: 'high',
  },
  {
    id: 'collection-cls',
    name: 'Collection Page CLS',
    description: 'Collection pages have no CLS occurring.',
    importance: 'high',
  },
  {
    id: 'collection-url-structure',
    name: 'Collection URL Structure',
    description: 'There is a clear URL structure in place for collection pages for the CMS it operates on.',
    importance: 'high',
  },
  {
    id: 'collection-product-ctas',
    name: 'Product CTAs',
    description: 'There is a clear CTA for each product in the product carousel.',
    importance: 'high',
  },
  {
    id: 'collection-breadcrumbs',
    name: 'Collection Breadcrumbs',
    description: 'Breadcrumbs are added to collection pages and structurally correct.',
    importance: 'high',
  },
  // Medium
  {
    id: 'collection-faqs',
    name: 'Collection Page FAQs',
    description: 'Do collection pages have FAQs added to the bottom with FAQ schema added?',
    importance: 'medium',
  },
  {
    id: 'collection-reviews-banner',
    name: 'Reviews Banner/Carousel',
    description: 'There is a reviews banner/carousel integrated on collection pages.',
    importance: 'medium',
  },
];

// ECOMMERCE: Product Pages - ordered by importance
export const ECOMMERCE_PRODUCT_CHECKS: Omit<AuditCheck, 'passed' | 'score' | 'details' | 'recommendations'>[] = [
  // Critical
  {
    id: 'product-pricing',
    name: 'Clear Pricing',
    description: 'Product pages have clear pricing for users to see.',
    importance: 'critical',
  },
  {
    id: 'product-schema',
    name: 'Product Schema',
    description: 'Product schema is added to product pages and validated.',
    importance: 'critical',
  },
  // High
  {
    id: 'product-stock-availability',
    name: 'Stock Availability',
    description: 'Product pages show stock availability.',
    importance: 'high',
  },
  {
    id: 'product-review-rating',
    name: 'Review Star Rating',
    description: 'Product review star rating is visible.',
    importance: 'high',
  },
  {
    id: 'product-specs-features',
    name: 'Specs & Features',
    description: 'Product pages have clear specs and features visible and accessible.',
    importance: 'high',
  },
  {
    id: 'product-return-policy',
    name: 'Return & Refund Policy',
    description: 'Product pages have clear return and refund policies information.',
    importance: 'high',
  },
  {
    id: 'product-shipping',
    name: 'Shipping Information',
    description: 'Product pages have clear shipping information.',
    importance: 'high',
  },
  {
    id: 'product-merchant-center',
    name: 'Google Merchant Center Data',
    description: 'Product has the correct Google Merchant Center data.',
    importance: 'high',
  },
  {
    id: 'product-cls',
    name: 'Product Page CLS',
    description: 'Product pages have no CLS occurring.',
    importance: 'high',
  },
  {
    id: 'product-image-alt-text',
    name: 'Product Image Alt Text',
    description: 'Product images have optimised alt text.',
    importance: 'high',
  },
  {
    id: 'product-image-quality',
    name: 'Product Image Quality',
    description: 'Product images are high quality.',
    importance: 'high',
  },
  // Medium
  {
    id: 'product-warranty',
    name: 'Warranty Information',
    description: 'Product pages have clear warranty information on the page.',
    importance: 'medium',
  },
  {
    id: 'product-contact-info',
    name: 'Customer Support Info',
    description: 'Product pages have clear customer support/contact information displayed.',
    importance: 'medium',
  },
];

// LOCAL: Google Business Profile - ordered by importance
export const LOCAL_GBP_CHECKS: Omit<AuditCheck, 'passed' | 'score' | 'details' | 'recommendations'>[] = [
  // Critical
  {
    id: 'gbp-verified',
    name: 'GBP Verified & Claimed',
    description: 'A verified GBP exists and has been claimed.',
    importance: 'critical',
  },
  {
    id: 'gbp-business-name',
    name: 'Business Name Correct',
    description: 'The business name is correct and specific to the location.',
    importance: 'critical',
  },
  {
    id: 'gbp-address',
    name: 'Business Address Correct',
    description: 'The business address is correct and specific to the location.',
    importance: 'critical',
  },
  {
    id: 'gbp-phone',
    name: 'Phone Number Correct',
    description: 'The business phone number is correct and specific to the location.',
    importance: 'critical',
  },
  {
    id: 'gbp-website',
    name: 'Website Link Correct',
    description: 'The business website is correct and points to the correct landing page.',
    importance: 'critical',
  },
  {
    id: 'gbp-primary-category',
    name: 'Primary Category Correct',
    description: 'The primary business category is correct.',
    importance: 'critical',
  },
  {
    id: 'gbp-reviews-answered',
    name: 'Reviews Answered',
    description: 'Reviews are being answered consistently.',
    importance: 'critical',
  },
  // High
  {
    id: 'gbp-working-hours',
    name: 'Working Hours Correct',
    description: 'The business working hours are correct and match the landing page.',
    importance: 'high',
  },
  {
    id: 'gbp-secondary-categories',
    name: 'Secondary Categories',
    description: 'Secondary business categories are present and accurate.',
    importance: 'high',
  },
  {
    id: 'gbp-description',
    name: 'Complete Description',
    description: 'The profile has a complete description.',
    importance: 'high',
  },
  {
    id: 'gbp-logo',
    name: 'Logo Uploaded',
    description: 'The logo is uploaded and accurate.',
    importance: 'high',
  },
  {
    id: 'gbp-cover-image',
    name: 'Cover Image',
    description: 'The cover image is a wide exterior photo showcasing the location.',
    importance: 'high',
  },
  {
    id: 'gbp-interior-exterior-photos',
    name: 'Interior & Exterior Photos',
    description: 'The profile has interior and exterior photos added.',
    importance: 'high',
  },
  {
    id: 'gbp-services',
    name: 'Services with Descriptions',
    description: 'The profile includes services with descriptions (if applicable).',
    importance: 'high',
  },
  {
    id: 'gbp-review-flow',
    name: 'Consistent Review Flow',
    description: 'The business has a consistent flow of high-quality reviews.',
    importance: 'high',
  },
  // Medium
  {
    id: 'gbp-holiday-hours',
    name: 'Holiday Hours Added',
    description: 'The business holiday hours have correctly been added.',
    importance: 'medium',
  },
  {
    id: 'gbp-social-links',
    name: 'Social Profile Links',
    description: 'The profile contains links to all relevant social profiles.',
    importance: 'medium',
  },
  {
    id: 'gbp-service-area',
    name: 'Service Area Included',
    description: 'The business service area is included (where applicable).',
    importance: 'medium',
  },
  {
    id: 'gbp-team-photo',
    name: 'Team Photo',
    description: 'The profile has a team photo.',
    importance: 'medium',
  },
  {
    id: 'gbp-questions-answered',
    name: 'Questions Answered',
    description: 'All questions on the profile have been answered (if applicable).',
    importance: 'medium',
  },
  // Low
  {
    id: 'gbp-video',
    name: 'Video Asset',
    description: 'The profile has a video asset.',
    importance: 'low',
  },
];

// LOCAL: Landing Pages - ordered by importance
export const LOCAL_LANDING_CHECKS: Omit<AuditCheck, 'passed' | 'score' | 'details' | 'recommendations'>[] = [
  // Critical
  {
    id: 'local-h1-optimised',
    name: 'Local H1 Optimised',
    description: 'Is the H1 optimised for the local search intent it should be targeting?',
    importance: 'critical',
  },
  {
    id: 'local-metadata-optimised',
    name: 'Local Metadata Optimised',
    description: 'Is the metadata optimised for the local search intent it should be targeting?',
    importance: 'critical',
  },
  {
    id: 'local-nap-details',
    name: 'NAP & Opening Hours',
    description: 'The landing page includes the address, opening hours and contact details for users to see.',
    importance: 'critical',
  },
  {
    id: 'local-business-schema',
    name: 'LocalBusiness Schema',
    description: 'LocalBusiness schema is added to the landing page.',
    importance: 'critical',
  },
  // High
  {
    id: 'local-store-image',
    name: 'Store Image',
    description: 'The landing page includes a high-quality image of the store.',
    importance: 'high',
  },
  {
    id: 'local-gbp-reviews',
    name: 'GBP Reviews Integrated',
    description: 'Google Business Profile reviews are integrated onto the page.',
    importance: 'high',
  },
  {
    id: 'local-google-maps',
    name: 'Google Maps Integration',
    description: 'Google Maps is integrated onto the landing page.',
    importance: 'high',
  },
  {
    id: 'local-ctas',
    name: 'Clear CTAs',
    description: 'Clear CTAs are added for booking appointments/getting directions.',
    importance: 'high',
  },
  // Medium
  {
    id: 'local-image-alt-text',
    name: 'Image Alt Text',
    description: 'The images on the landing page have optimised alt text added.',
    importance: 'medium',
  },
  {
    id: 'local-faqs',
    name: 'Store FAQs',
    description: 'There are FAQs about the store added with FAQ schema attributed.',
    importance: 'medium',
  },
  {
    id: 'local-facilities',
    name: 'Store Facilities',
    description: 'The facilities of the store are included.',
    importance: 'medium',
  },
  {
    id: 'local-team-section',
    name: 'Team Section',
    description: 'There is a section of the team who runs the store for trust.',
    importance: 'medium',
  },
];

// INTERNATIONAL: Hreflang & Multi-region - ordered by importance
export const INTERNATIONAL_CHECKS: Omit<AuditCheck, 'passed' | 'score' | 'details' | 'recommendations'>[] = [
  // Critical
  {
    id: 'intl-hreflang-implementation',
    name: 'Hreflang Implementation',
    description: 'Hreflang has correctly been implemented across the domain.',
    importance: 'critical',
  },
  {
    id: 'intl-unique-content',
    name: 'Unique Content per Region',
    description: 'All of the content is not duplicated/the same across each separate location area of the site.',
    importance: 'critical',
  },
  {
    id: 'intl-no-geo-redirects',
    name: 'No Geolocation Redirects',
    description: 'There are no geolocation redirects automatically triggering/set up on the site.',
    importance: 'critical',
  },
  // High
  {
    id: 'intl-metadata-differentiation',
    name: 'Metadata Differentiation',
    description: 'There is a clear difference in metadata for each country.',
    importance: 'high',
  },
  {
    id: 'intl-hreflang-sitemap',
    name: 'Hreflang XML Sitemap',
    description: 'A clear hreflang XML sitemap exists.',
    importance: 'high',
  },
  {
    id: 'intl-subdirectory-structure',
    name: 'Subdirectory Structure',
    description: 'The logic of the site does not use subdomains to separate the different country versions (uses subdirectories).',
    importance: 'high',
  },
  {
    id: 'intl-language-selector',
    name: 'Language Selector',
    description: 'Users can choose their language clearly on the site from an option/selection widget/CTA.',
    importance: 'high',
  },
  {
    id: 'intl-crawlability',
    name: 'Cross-version Crawlability',
    description: 'Crawling and navigating between the different versions of the site is a simple and clear process.',
    importance: 'high',
  },
];

// Brand type definition
export type BrandType = 'general' | 'ecommerce' | 'local' | 'international';
