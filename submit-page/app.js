const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1447775203454357625/zY9OAL8eL5yVzgdXGMn1WIGq_Y03tyew5pRXvTQP1I1spJJGvkSe34ZZGoLF3F3Cei0P";

function showStatus(message, type = "info") {
  const statusDiv = document.getElementById("submitStatus");

  let styleClass;
  let icon;

  switch(type) {
    case "success":
      styleClass = "success";
      icon = "✓";
      break;
    case "error":
      styleClass = "error";
      icon = "✕";
      break;
    case "info":
    default:
      styleClass = "info";
      icon = "ℹ";
      break;
  }

  statusDiv.innerHTML = `
    <div class="status-message ${styleClass}">
      <span class="status-icon">${icon}</span>
      <span class="status-text">${escapeHtml(message)}</span>
    </div>
  `;

  statusDiv.style.display = "block";

  if (type !== "info") {
    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 10000);
  }
}

function validateUrl(url) {
  try {
    const parsedUrl = new URL(url);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }

    const lowerUrl = url.toLowerCase();
    const fileIndicators = ['.zip', '.rar', '.7z', '.tar.gz', '.tgz', '/download/', 'drive.google.com', 'mega.nz', 'pixeldrain.com', 'mediafire.com'];

    return fileIndicators.some(indicator => lowerUrl.includes(indicator));
  } catch (e) {
    return false;
  }
}

async function submitToDiscord(downloadLink) {
  const webhookData = {
    content: `**New Drum Kit Submission**`,
    embeds: [{
      title: "DRUMKITS.SITE",
      description: "A new drum kit has been submitted for review.",
      color: 0x00ff00,
      fields: [
        {
          name: "📎",
          value: downloadLink,
          inline: false
        },
        {
          name: "Date",
          value: new Date().toLocaleString(),
          inline: true
        },
        {
          name: "Download Source",
          value: "DRUMKITS.SITE Submission Page",
          inline: true
        }
      ],
      footer: {
        text: "Ready for manual review."
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
      throw new Error(`Hook failed: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Hook error:", error);
    return { success: false, error: error.message };
  }
}

function handleFormSubmission() {
  const form = document.getElementById("submitForm");
  const submitBtn = document.getElementById("submitBtn");
  const originalBtnText = submitBtn.textContent;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const downloadLink = formData.get("downloadLink").trim();

    if (!downloadLink) {
      showStatus("Please enter a download link.", "error");
      return;
    }

    if (!validateUrl(downloadLink)) {
      showStatus("Invalid download link. Please check that it's a valid file hosting URL.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    showStatus("Sending...", "info");

    try {
      const result = await submitToDiscord(downloadLink);

      if (result.success) {
        showStatus("Submission sent! Your kit will be reviewed.", "success");
        form.reset();
      } else {
        showStatus("Failed. Please try again later.", "error");
      }
    } catch (error) {
      console.error("Submission error:", error);
      showStatus("Network error.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Submit page loaded");
  handleFormSubmission();
});
