import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { setClassSplitText } from "../utils";

class MotionText {
  elements = [];
  splitText = [];
  splitTextTween = [];

  constructor() {}

  init(container) {
    this.elements = container
      ? container.querySelectorAll("[data-motion-text]")
      : document.querySelectorAll("[data-motion-text]");
    this.elements.forEach((element) => {
      const duration =
        parseFloat(element.getAttribute("data-motion-text-duration")) || 0.6;

      if (element.hasAttribute("data-motion-text-split")) {
        const splitType =
          element.getAttribute("data-motion-text-split") || "lines";

        const staggers =
          parseFloat(element.getAttribute("data-motion-text-stagger")) || 0.05;

        const split = new SplitText(element, {
          type: splitType,
          mask: splitType,
          ...setClassSplitText(splitType),
        });

        gsap.set(split[splitType], {
          yPercent: 120,
        });

        gsap.set(element, {
          visibility: "visible",
        });

        this.splitText.push({
          el: element,
          split,
          duration,
          staggers,
          splitType,
        });
      }
    });
  }

  animationIn() {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    this.splitText.forEach(({ split, duration, staggers, splitType }) => {
      if (reduceMotion) {
        gsap.set(split[splitType], { yPercent: 0 });
        return;
      }

      const tween = gsap.to(split[splitType], {
        yPercent: 0,
        duration,
        stagger: staggers,
        ease: "power2.inOut",
      });

      this.splitTextTween.push(tween);
    });
  }

  destroy() {
    if (
      this.splitText.length === 0 &&
      this.splitTextTween.length === 0 &&
      this.elements.length === 0
    )
      return;

    this.elements.forEach((el) => {
      el.dataset.motionText = false;
    });
    this.splitText.forEach(({ split }) => {
      split.revert();
    });

    this.splitTextTween.forEach((tween) => {
      tween.kill();
    });

    // this.ease

    this.splitTextTween = [];
    this.elements = [];
    this.splitText = [];
  }
}

export default MotionText;
