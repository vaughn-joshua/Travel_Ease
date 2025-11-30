/**
 * Sanitize HTML content to prevent XSS attacks
 * This is a basic implementation - for production, consider using DOMPurify
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Create a temporary div to parse the HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Remove script tags
  const scripts = tempDiv.getElementsByTagName("script");
  while (scripts.length > 0) {
    scripts[0].parentNode?.removeChild(scripts[0]);
  }

  // Remove event handlers from all elements
  const allElements = tempDiv.getElementsByTagName("*");
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const attributes = Array.from(element.attributes);
    for (const attr of attributes) {
      if (attr.name.startsWith("on")) {
        element.removeAttribute(attr.name);
      }
    }
    // Remove javascript: URLs
    if (element.hasAttribute("href")) {
      const href = element.getAttribute("href");
      if (href?.toLowerCase().startsWith("javascript:")) {
        element.removeAttribute("href");
      }
    }
    if (element.hasAttribute("src")) {
      const src = element.getAttribute("src");
      if (src?.toLowerCase().startsWith("javascript:")) {
        element.removeAttribute("src");
      }
    }
  }

  return tempDiv.innerHTML;
}

