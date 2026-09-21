const select = (selector) => document.querySelector(selector);
const selectAll = (selector) => document.querySelectorAll(selector);

const hexToRgb = (hex) => {
  hex = hex.replace(/^#/, "");

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const bigint = parseInt(hex, 16);

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b };
};

const setClassSplitText = (type) => {
  return type === "lines"
    ? {
        linesClass: "lines",
      }
    : type === "words"
      ? {
          wordsClass: "words",
        }
      : {
          charsClass: "chars",
        };
};

const preventLinksMenu = () => {
  const links = selectAll("a.nav__link");

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      const currentPathname = window.location.pathname;
      const linkPathname = new URL(e.currentTarget.href).pathname;

      if (currentPathname === linkPathname) e.preventDefault();
    });
  });
};

export { select, selectAll, hexToRgb, setClassSplitText, preventLinksMenu };
