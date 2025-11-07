/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMParser to parse and whitelist allowed tags
 */
export function sanitizeHtml(html) {
  if (!html) return "";
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  const allowedTags = [
    "p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "a", "img", "blockquote", "code", "pre"
  ];
  
  const allowedAttributes = {
    a: ["href", "title", "target"],
    img: ["src", "alt", "title", "width", "height"],
  };
  
  function sanitizeNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.cloneNode(true);
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      
      if (!allowedTags.includes(tagName)) {
        const fragment = document.createDocumentFragment();
        Array.from(node.childNodes).forEach((child) => {
          const sanitized = sanitizeNode(child);
          if (sanitized) {
            fragment.appendChild(sanitized);
          }
        });
        return fragment;
      }
      
      const newNode = document.createElement(tagName);
      const allowedAttrs = allowedAttributes[tagName] || [];
      
      Array.from(node.attributes).forEach((attr) => {
        if (allowedAttrs.includes(attr.name.toLowerCase())) {
          if (attr.name === "href" && !attr.value.startsWith("http") && !attr.value.startsWith("/") && !attr.value.startsWith("#")) {
            return;
          }
          newNode.setAttribute(attr.name, attr.value);
        }
      });
      
      Array.from(node.childNodes).forEach((child) => {
        const sanitized = sanitizeNode(child);
        if (sanitized) {
          newNode.appendChild(sanitized);
        }
      });
      
      return newNode;
    }
    
    return null;
  }
  
  const body = doc.body;
  const fragment = document.createDocumentFragment();
  
  Array.from(body.childNodes).forEach((child) => {
    const sanitized = sanitizeNode(child);
    if (sanitized) {
      fragment.appendChild(sanitized);
    }
  });
  
  const tempDiv = document.createElement("div");
  tempDiv.appendChild(fragment);
  return tempDiv.innerHTML;
}

