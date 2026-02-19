const KIT_IMAGE_BASE_URL = "https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev";
const KIT_IMAGE_VERSION = "1";

function getKitImageUrl(id) {
  const normalizedId = encodeURIComponent(String(id));
  return `${KIT_IMAGE_BASE_URL}/${normalizedId}.jpg?v=${KIT_IMAGE_VERSION}`;
}

function applyFallbackImage(img, fallbackSrc = "/errors/default.jpg") {
  if (!img) return;
  img.onerror = () => {
    if (img.src.endsWith(fallbackSrc)) return;
    img.onerror = null;
    img.src = fallbackSrc;
  };
}

function createKitImage(
  imageUrl,
  altText,
  {
    loading = "lazy",
    width,
    height,
    fallbackSrc = "/errors/default.jpg",
    placeholderFirst = false,
  } = {}
) {
  const img = document.createElement("img");
  img.alt = "";
  img.loading = loading;
  img.decoding = "async";

  if (width) img.width = width;
  if (height) img.height = height;

  if (placeholderFirst) {
    img.src = fallbackSrc;

    const probe = new Image();
    probe.decoding = "async";
    probe.onload = () => {
      img.src = imageUrl;
      probe.onload = null;
      probe.onerror = null;
    };
    probe.onerror = () => {
      probe.onload = null;
      probe.onerror = null;
    };
    probe.src = imageUrl;

    return img;
  }

  applyFallbackImage(img, fallbackSrc);
  img.src = imageUrl;

  return img;
}

window.DrumkitAssets = {
  KIT_IMAGE_BASE_URL,
  KIT_IMAGE_VERSION,
  getKitImageUrl,
  applyFallbackImage,
  createKitImage,
};
