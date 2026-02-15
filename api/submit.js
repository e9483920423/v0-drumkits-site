const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const ipRequestLog = new Map();

const ALLOWED_HOSTS = [
  "drive.google.com",
  "mega.nz",
  "pixeldrain.com",
  "mediafire.com"
];

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const recentRequests = (ipRequestLog.get(ip) || []).filter((ts) => ts > windowStart);

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    ipRequestLog.set(ip, recentRequests);
    return true;
  }

  recentRequests.push(now);
  ipRequestLog.set(ip, recentRequests);

  if (ipRequestLog.size > 10000) {
    for (const [storedIp, timestamps] of ipRequestLog.entries()) {
      const cleaned = timestamps.filter((ts) => ts > windowStart);
      if (cleaned.length === 0) {
        ipRequestLog.delete(storedIp);
      } else {
        ipRequestLog.set(storedIp, cleaned);
      }
    }
  }

  return false;
}

function validateUrl(url) {
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }

    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");
    const isAllowedHost = ALLOWED_HOSTS.some((allowedHost) => hostname === allowedHost || hostname.endsWith(`.${allowedHost}`));

    const lowerUrl = url.toLowerCase();
    const fileIndicators = ['.zip', '.rar', '.7z', '.tar.gz', '.tgz', '/download/', 'drive.google.com', 'mega.nz', 'pixeldrain.com', 'mediafire.com'];
    const hasFileIndicator = fileIndicators.some(indicator => lowerUrl.includes(indicator));

    return isAllowedHost || hasFileIndicator;
  } catch (e) {
    return false;
  }
}

async function submitToDiscord(downloadLink, webhookUrl) {
  const webhookData = {
    content: `**Kit**`,
    embeds: [{
      title: "Submitted",
      description: "ready for review",
      color: 0x00ff00,
      fields: [
        {
          name: "Link",
          value: downloadLink,
          inline: false
        },
        {
          name: "Submitted",
          value: new Date().toLocaleString(),
          inline: true
        },
        {
          name: "Source",
          value: "DRUMKITS.SITE",
          inline: true
        }
      ],
      footer: {
        text: "Ready for manual review."
      }
    }]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      throw new Error(`failed: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("error:", error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!DISCORD_WEBHOOK_URL) {
    console.error("DISCORD_WEBHOOK_URL is not configured.");
    return res.status(500).json({ error: "Server configuration error." });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: "Too many submissions. Please wait a minute and try again."
    });
  }

  try {
    const { downloadLink } = req.body || {};


    if (!downloadLink || typeof downloadLink !== 'string') {
      return res.status(400).json({ error: 'Download link is required' });
    }

    const trimmedLink = downloadLink.trim();

    if (!validateUrl(trimmedLink)) {
      return res.status(400).json({
        error: 'Invalid download link. Please check that it\'s a valid file hosting URL.'
      });
    }

    await submitToDiscord(trimmedLink, DISCORD_WEBHOOK_URL);

    // Success response
    res.status(200).json({
      success: true,
      message: 'Submission sent.'
    });

  } catch (error) {
    console.error('API Error:', error);

    // Return error response
    res.status(500).json({
      error: 'Failed to submit.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
