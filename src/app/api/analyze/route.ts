import { NextRequest, NextResponse } from 'next/server';

export interface AnalysisResult {
  url: string;
  fetchedAt: string;
  robotsTxt: {
    exists: boolean;
    content?: string;
    blocksAICrawlers?: boolean;
  };
  sitemap: {
    exists: boolean;
    url?: string;
  };
  meta: {
    title?: string;
    titleLength?: number;
    description?: string;
    descriptionLength?: number;
    favicon?: string;
    ogTags?: Record<string, string>;
  };
  headings: {
    h1Count: number;
    h1Tags: string[];
  };
  schema: {
    hasOrganization: boolean;
    hasPerson: boolean;
    hasFAQ: boolean;
    hasArticle: boolean;
    hasBreadcrumb: boolean;
    types: string[];
  };
  pages: {
    hasAbout: boolean;
    hasPrivacy: boolean;
    hasTerms: boolean;
    hasContact: boolean;
  };
  social: {
    links: { platform: string; url: string }[];
    hasTwitter: boolean;
    hasFacebook: boolean;
    hasLinkedIn: boolean;
    hasInstagram: boolean;
    hasYouTube: boolean;
    hasTikTok: boolean;
    hasPinterest: boolean;
  };
  technical: {
    hasCanonical: boolean;
    canonicalUrl?: string;
    hasNoindex: boolean;
    loadTimeMs?: number;
  };
  error?: string;
}

const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'CCBot',
  'anthropic-ai',
  'Claude-Web',
  'Bytespider',
  'Diffbot',
  'PerplexityBot',
];

async function checkUrlExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return response.ok;
  } catch {
    return false;
  }
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SEO-Audit-Tool/1.0',
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const urlObj = new URL(normalizedUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

    const startTime = Date.now();

    // Fetch the main page
    let html = '';
    let fetchError = '';
    try {
      const response = await fetchWithTimeout(normalizedUrl);
      html = await response.text();
    } catch (error) {
      fetchError = error instanceof Error ? error.message : 'Failed to fetch URL';
    }

    const loadTimeMs = Date.now() - startTime;

    // Initialize result
    const result: AnalysisResult = {
      url: normalizedUrl,
      fetchedAt: new Date().toISOString(),
      robotsTxt: { exists: false },
      sitemap: { exists: false },
      meta: {},
      headings: { h1Count: 0, h1Tags: [] },
      schema: {
        hasOrganization: false,
        hasPerson: false,
        hasFAQ: false,
        hasArticle: false,
        hasBreadcrumb: false,
        types: [],
      },
      pages: {
        hasAbout: false,
        hasPrivacy: false,
        hasTerms: false,
        hasContact: false,
      },
      social: {
        links: [],
        hasTwitter: false,
        hasFacebook: false,
        hasLinkedIn: false,
        hasInstagram: false,
        hasYouTube: false,
        hasTikTok: false,
        hasPinterest: false,
      },
      technical: {
        hasCanonical: false,
        hasNoindex: false,
        loadTimeMs,
      },
    };

    if (fetchError) {
      result.error = fetchError;
      return NextResponse.json(result);
    }

    // Check robots.txt
    try {
      const robotsResponse = await fetchWithTimeout(`${baseUrl}/robots.txt`, 5000);
      if (robotsResponse.ok) {
        const robotsContent = await robotsResponse.text();
        result.robotsTxt = {
          exists: true,
          content: robotsContent.slice(0, 2000),
          blocksAICrawlers: AI_CRAWLERS.some(crawler =>
            robotsContent.toLowerCase().includes(crawler.toLowerCase()) &&
            robotsContent.toLowerCase().includes('disallow')
          ),
        };
      }
    } catch {
      // robots.txt doesn't exist or couldn't be fetched
    }

    // Check sitemap
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/sitemap/sitemap.xml`,
    ];

    for (const sitemapUrl of sitemapUrls) {
      if (await checkUrlExists(sitemapUrl)) {
        result.sitemap = { exists: true, url: sitemapUrl };
        break;
      }
    }

    // Parse HTML for meta information
    if (html) {
      // Meta title
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (titleMatch) {
        result.meta.title = titleMatch[1].trim();
        result.meta.titleLength = result.meta.title.length;
      }

      // Meta description
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
      if (descMatch) {
        result.meta.description = descMatch[1].trim();
        result.meta.descriptionLength = result.meta.description.length;
      }

      // Favicon
      const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i) ||
                          html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
      if (faviconMatch) {
        result.meta.favicon = faviconMatch[1];
      }

      // Open Graph tags
      const ogTags: Record<string, string> = {};
      const ogMatches = html.matchAll(/<meta[^>]*property=["']og:([^"']*)["'][^>]*content=["']([^"']*)["']/gi);
      for (const match of ogMatches) {
        ogTags[match[1]] = match[2];
      }
      if (Object.keys(ogTags).length > 0) {
        result.meta.ogTags = ogTags;
      }

      // H1 tags
      const h1Matches = html.matchAll(/<h1[^>]*>([^<]*)<\/h1>/gi);
      const h1Tags: string[] = [];
      for (const match of h1Matches) {
        h1Tags.push(match[1].trim());
      }
      result.headings = { h1Count: h1Tags.length, h1Tags };

      // Canonical
      const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
      if (canonicalMatch) {
        result.technical.hasCanonical = true;
        result.technical.canonicalUrl = canonicalMatch[1];
      }

      // Noindex
      result.technical.hasNoindex = /<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);

      // Schema.org detection
      const schemaMatches = html.matchAll(/"@type"\s*:\s*"([^"]+)"/g);
      const schemaTypes: string[] = [];
      for (const match of schemaMatches) {
        schemaTypes.push(match[1]);
      }
      result.schema = {
        hasOrganization: schemaTypes.some(t => t.toLowerCase() === 'organization'),
        hasPerson: schemaTypes.some(t => t.toLowerCase() === 'person'),
        hasFAQ: schemaTypes.some(t => t.toLowerCase() === 'faqpage'),
        hasArticle: schemaTypes.some(t => t.toLowerCase().includes('article')),
        hasBreadcrumb: schemaTypes.some(t => t.toLowerCase() === 'breadcrumblist'),
        types: [...new Set(schemaTypes)],
      };

      // Check for common pages by looking at links
      const htmlLower = html.toLowerCase();
      result.pages = {
        hasAbout: /href=["'][^"']*\/about/i.test(html) || htmlLower.includes('about us') || htmlLower.includes('about-us'),
        hasPrivacy: /href=["'][^"']*\/privacy/i.test(html) || htmlLower.includes('privacy policy'),
        hasTerms: /href=["'][^"']*\/terms/i.test(html) || htmlLower.includes('terms') && (htmlLower.includes('conditions') || htmlLower.includes('service')),
        hasContact: /href=["'][^"']*\/contact/i.test(html) || htmlLower.includes('contact us'),
      };

      // Social media links
      const socialPatterns = [
        { platform: 'Twitter/X', pattern: /href=["']([^"']*(?:twitter\.com|x\.com)[^"']*)["']/gi, key: 'hasTwitter' },
        { platform: 'Facebook', pattern: /href=["']([^"']*facebook\.com[^"']*)["']/gi, key: 'hasFacebook' },
        { platform: 'LinkedIn', pattern: /href=["']([^"']*linkedin\.com[^"']*)["']/gi, key: 'hasLinkedIn' },
        { platform: 'Instagram', pattern: /href=["']([^"']*instagram\.com[^"']*)["']/gi, key: 'hasInstagram' },
        { platform: 'YouTube', pattern: /href=["']([^"']*youtube\.com[^"']*)["']/gi, key: 'hasYouTube' },
        { platform: 'TikTok', pattern: /href=["']([^"']*tiktok\.com[^"']*)["']/gi, key: 'hasTikTok' },
        { platform: 'Pinterest', pattern: /href=["']([^"']*pinterest\.com[^"']*)["']/gi, key: 'hasPinterest' },
      ];

      for (const { platform, pattern, key } of socialPatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          result.social.links.push({ platform, url: match[1] });
          (result.social as Record<string, boolean | { platform: string; url: string }[]>)[key] = true;
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
