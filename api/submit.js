const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1447775203454357625/zY9OAL8eL5yVzgdXGMn1WIGq_Y03tyew5pRXvTQP1I1spJJGvkSe34ZZGoLF3F3Cei0P";

function validateUrl(url) {
  try {
    const parsedUrl = new URL(url);

    // Check if it's HTTP or HTTPS
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }

    // Basic check for common file extensions or hosting sites
    const lowerUrl = url.toLowerCase();
    const fileIndicators = ['.zip', '.rar', '.7z', '.tar.gz', '.tgz', '/download/', 'drive.google.com', 'mega.nz', 'pixeldrain.com', 'mediafire.com'];

    return fileIndicators.some(indicator => lowerUrl.includes(indicator));
  } catch (e) {
    return false;
  }
}

async function submitToDiscord(downloadLink) {
  const webhookData = {
    content: `🎵 **New Drum Kit Submission!**`,
    embeds: [{
      title: "🔗 Collection Submission",
      description: "A new drum kit collection has been submitted for review.",
      color: 0x00ff00,
      fields: [
        {
          name: "📎 Download Link",
          value: downloadLink,
          inline: false
        },
        {
          name: "⏰ Submitted",
          value: new Date().toLocaleString(),
          inline: true
        },
        {
          name: "🌐 Source",
          value: "DRUMKITS.SITE Submission Form",
          inline: true
        }
      ],
      footer: {
        text: "Ready for manual review and addition to the collection."
      }
    }]
  };

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Discord webhook error:", error);
    throw error; // Re-throw to be caught by caller
  }
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { downloadLink } = req.body;

    // Validate input
    if (!downloadLink || typeof downloadLink !== 'string') {
      return res.status(400).json({ error: 'Download link is required' });
    }

    const trimmedLink = downloadLink.trim();

    // Validate URL format and content
    if (!validateUrl(trimmedLink)) {
      return res.status(400).json({
        error: 'Invalid download link. Please check that it\'s a valid file hosting URL.'
      });
    }

    // Submit to Discord
    await submitToDiscord(trimmedLink);

    // Success response
    res.status(200).json({
      success: true,
      message: 'Submission sent successfully! Your drum kit will be reviewed and may be added to the collection.'
    });

  } catch (error) {
    console.error('API Error:', error);

    // Return error response
    res.status(500).json({
      error: 'Failed to submit. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
