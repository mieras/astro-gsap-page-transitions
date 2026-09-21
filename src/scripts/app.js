import gsap from 'gsap';
import WebGLPageTransition from './components/webgl-page-transition';
import MorphSVGPlugin from 'gsap/MorphSVGPlugin';
import MotionText from './components/motion-text';
import { preventLinksMenu, select } from './utils';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import DrawSVGPlugin from 'gsap/DrawSVGPlugin';

const OVERLAY_TRANSITIONS = new Set([
  'example-2-transition',
  'example-3-transition',
  'example-4-transition',
  'example-5-transition',
]);

const SYNC_TRANSITIONS = new Set(['default-transition', 'example-6-transition']);

const namespaceFromPathname = (pathname) => {
  const segment = pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop();
  return segment || 'index';
};

const transitionForNamespace = (namespace) => {
  switch (namespace) {
    case 'about':
      return 'example-2-transition';
    case 'works':
      return 'example-3-transition';
    case 'team':
      return 'example-4-transition';
    case 'archive':
      return 'example-5-transition';
    case 'contact':
      return 'example-6-transition';
    default:
      return 'default-transition';
  }
};

class App {
  constructor() {
    this.motionTexts = new MotionText();
    this.motionTexts.init();
    this.motionTexts.animationIn();

    this.transitionOverlay = select('.transition__overlay');

    this.titleDestination = select('.transition__overlay .title__destination');

    this.splitTitleDestination = null;

    this.getPercentageVerticalClipExample3();

    this.webglPageTransition = new WebGLPageTransition();

    this.nav = null;
    this.outgoingWrapper = null;
    this.incomingWrapper = null;

    this.render();
    this.addEventListeners();
  }

  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  setTransitioning(on, doc = document) {
    doc.documentElement.classList.toggle('is__transitioning', on);
    doc.body?.classList.toggle('is__transitioning', on);
  }

  addEventListeners() {
    window.addEventListener('resize', this.onResize.bind(this));

    document.addEventListener('astro:before-preparation', this.onBeforePreparation.bind(this));
    document.addEventListener('astro:before-swap', this.onBeforeSwap.bind(this));
    document.addEventListener('astro:after-swap', this.onAfterSwap.bind(this));
    document.addEventListener('astro:page-load', this.onPageLoad.bind(this));
  }

  onBeforePreparation(event) {
    const namespace = namespaceFromPathname(event.to.pathname);

    this.nav = {
      namespace,
      name: transitionForNamespace(namespace),
      isHistory: event.navigationType === 'traverse',
      to: event.to,
    };
    this.outgoingWrapper = null;
    this.incomingWrapper = null;

    if (this.prefersReducedMotion()) return;

    const originalLoader = event.loader;
    event.loader = async () => {
      const leavePromise = this.runLeave();
      await originalLoader();
      await leavePromise;
    };
  }

  onBeforeSwap(event) {
    event.viewTransition?.skipTransition?.();

    if (!this.nav) return;

    this.setTransitioning(true, event.newDocument);

    if (this.prefersReducedMotion()) return;

    const next = event.newDocument.querySelector('.app__wrapper');
    const current = document.querySelector('.app__wrapper');
    this.incomingWrapper = next;

    if (SYNC_TRANSITIONS.has(this.nav.name) && current && next) {
      this.runBefore({ current: { container: current }, next: { container: next } });
      this.outgoingWrapper = current;
      current.remove();
    }
  }

  onAfterSwap() {
    if (this.outgoingWrapper) {
      const incoming = this.incomingWrapper ?? document.querySelector('.app__wrapper');
      if (incoming?.parentNode) {
        incoming.parentNode.insertBefore(this.outgoingWrapper, incoming);
      }
      incoming?.scrollTo(0, 0);
      return;
    }

    this.resetPageScroll(this.incomingWrapper);
  }

  async onPageLoad() {
    if (!this.nav) return;

    const next =
      this.incomingWrapper ??
      [...document.querySelectorAll('.app__wrapper')].find((el) => el !== this.outgoingWrapper) ??
      document.querySelector('.app__wrapper');
    const data = {
      current: { container: this.outgoingWrapper },
      next: {
        container: next,
        url: { path: this.nav?.to?.pathname || window.location.pathname },
      },
      trigger: this.nav?.isHistory ? 'back' : next,
    };

    if (this.prefersReducedMotion()) {
      this.motionTexts.destroy();
      this.motionTexts.init(next);
      this.motionTexts.animationIn();
      this.cleanupOutgoing();
      this.resetPageScroll(next);
      this.setTransitioning(false);
      this.nav = null;
      return;
    }

    if (SYNC_TRANSITIONS.has(this.nav?.name)) {
      await this.runEnter(data);
      this.runAfter(data);
    } else {
      await this.runAfter(data);
    }

    this.cleanupOutgoing();
    this.resetPageScroll(next);
    this.nav = null;
  }

  cleanupOutgoing() {
    if (this.outgoingWrapper) {
      this.outgoingWrapper.remove();
      this.outgoingWrapper = null;
    }
    this.incomingWrapper = null;
  }

  resetPageScroll(container) {
    const el = container ?? document.querySelector('.app__wrapper');
    el?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }

  runBefore(data) {
    const name = this.nav.name;
    this.setTransitioning(true);

    if (name === 'default-transition') {
      gsap.set(data.next.container, {
        position: 'fixed',
        inset: 0,
        scale: 0.6,
        clipPath: 'inset(100% 0 0 0)',
        zIndex: 3,
        willChange: 'auto',
      });

      gsap.set(data.current.container, {
        zIndex: 2,
        willChange: 'auto',
      });
      return;
    }

    if (name === 'example-4-transition') {
      this.transitionOverlay.classList.add('team__transition');

      if (this.splitTitleDestination) this.splitTitleDestination.revert();

      this.splitTitleDestination = new SplitText(this.titleDestination, {
        type: 'words',
        mask: 'words',
        wordsClass: 'words',
      });

      gsap.set(this.transitionOverlay, {
        '--clip': `polygon(0% ${50 - this.percentageVerticalClip}%, 0% ${
          50 - this.percentageVerticalClip
        }%, 0% ${50 + this.percentageVerticalClip}%, 0% ${50 + this.percentageVerticalClip}%)`,
      });
      return;
    }

    if (name === 'example-6-transition') {
      data.next.container.classList.add('contact__transition');
      gsap.set(data.next.container, {
        position: 'fixed',
        inset: 0,
        clipPath: 'polygon(15% 75%, 85% 75%, 85% 75%, 15% 75%)',
        zIndex: 3,
        height: '100vh',
        overflow: 'hidden',
        '--clip': 'inset(0 0 0% 0)',
      });
    }
  }

  runLeave() {
    if (!OVERLAY_TRANSITIONS.has(this.nav.name)) return Promise.resolve();

    const data = {
      trigger: this.nav.isHistory ? 'back' : document.createElement('a'),
    };

    this.runBefore(data);

    if (this.nav.name === 'example-2-transition') {
      return this.leaveAbout();
    }
    if (this.nav.name === 'example-3-transition') {
      return this.leaveWorks(data);
    }
    if (this.nav.name === 'example-4-transition') {
      return this.leaveTeam();
    }
    if (this.nav.name === 'example-5-transition') {
      return this.leaveArchive();
    }

    return Promise.resolve();
  }

  runEnter(data) {
    if (this.nav.name === 'default-transition') {
      return this.enterDefault(data);
    }
    if (this.nav.name === 'example-6-transition') {
      return this.enterContact(data);
    }
    return Promise.resolve();
  }

  runAfter(data) {
    if (this.nav.name === 'default-transition') {
      this.setTransitioning(false);
      gsap.set(data.next.container, {
        clearProps: 'all',
      });
      return;
    }

    if (this.nav.name === 'example-2-transition') {
      return this.afterAbout();
    }
    if (this.nav.name === 'example-3-transition') {
      return this.afterWorks(data);
    }
    if (this.nav.name === 'example-4-transition') {
      return this.afterTeam();
    }
    if (this.nav.name === 'example-5-transition') {
      return this.afterArchive();
    }
    if (this.nav.name === 'example-6-transition') {
      this.setTransitioning(false);
      data.next.container.classList.remove('contact__transition');
      gsap.set(data.next.container, {
        clearProps: 'all',
      });
    }
  }

  enterDefault(data) {
    const contentCurrent = data.current.container.querySelector('.content__wrapper');

    const tl = gsap.timeline({
      defaults: {
        duration: 0.8,
        ease: 'power3.inOut',
      },
      onComplete: () => tl.kill(),
    });

    tl.to(data.current.container, {
      scale: 0.6,
    })
      .to(data.current.container, {
        opacity: 0.45,
        ease: 'power3',
      })
      .to(
        contentCurrent,
        {
          yPercent: -10,
          ease: 'power3',
        },
        '<',
      )
      .to(
        data.next.container,
        {
          clipPath: 'inset(0% 0 0 0)',
          ease: 'power3',
          onStart: () => {
            this.motionTexts.init(data.next.container);
            this.motionTexts.animationIn();
          },
          onComplete: () => {
            this.motionTexts.destroy();
          },
        },
        '<',
      )
      .to(data.next.container, {
        scale: 1,
      });

    return new Promise((resolve) => {
      tl.call(() => {
        resolve();
      });
    });
  }

  leaveAbout() {
    const tl = gsap.timeline({
      defaults: {
        duration: 1,
        ease: 'power1.in',
      },
      onComplete: () => tl.kill(),
    });

    gsap.set('#webgl', {
      pointerEvents: 'auto',
      autoAlpha: 1,
      visibility: 'visible',
    });

    tl.to(this.webglPageTransition.material.uniforms.uProgress, {
      value: -0.75,
    });

    return new Promise((resolve) => {
      tl.call(() => {
        this.motionTexts.destroy();
        resolve();
      });
    });
  }

  afterAbout() {
    const tl = gsap.timeline({
      defaults: {
        duration: 1,
        ease: 'power1.in',
      },
      onComplete: () => {
        gsap.set('#webgl', {
          pointerEvents: 'none',
          autoAlpha: 0,
          visibility: 'hidden',
        });

        tl.kill();
      },
    });

    tl.to(this.webglPageTransition.material.uniforms.uProgress, {
      value: 1.5,
    });

    return new Promise((resolve) => {
      tl.call(() => {
        this.setTransitioning(false);
        resolve();
      });
    });
  }

  leaveWorks(data) {
    const tl = gsap.timeline({
      defaults: {
        duration: 0.5,
        ease: 'sine.in',
      },
      onComplete: () => tl.kill(),
    });

    const path = select('.transition__morph__svg svg path');

    gsap.set('.transition__morph__svg', {
      pointerEvents: 'auto',
      autoAlpha: 1,
      visibility: 'visible',
    });

    let enterCurve = 'M 0 100 V 50 Q 50 0 100 50 V 100 z',
      filledPath = 'M 0 100 V 0 Q 50 0 100 0 V 100 z';

    if (typeof data.trigger === 'string') {
      enterCurve = 'M 0 0 V 50 Q 50 100 100 50 V 0 z';
      filledPath = 'M 0 0 V 100 Q 50 100 100 100 V 0 z';
      gsap.set(path, {
        attr: { d: 'M 0 0 V 0 Q 50 0 100 0 V 0 z' },
      });
    }

    tl.to(path, {
      morphSVG: enterCurve,
    }).to(
      path,
      {
        morphSVG: filledPath,
        ease: 'sine',
      },
      '<+=.5',
    );

    return new Promise((resolve) => {
      tl.call(() => {
        this.motionTexts.destroy();
        resolve();
      });
    });
  }

  afterWorks(data) {
    const path = select('.transition__morph__svg svg path');
    const originalPath = path.dataset.originalPath;
    const tl = gsap.timeline({
      defaults: {
        duration: 0.5,
        ease: 'sine.in',
      },
      onComplete: () => {
        gsap.set('.transition__morph__svg', {
          pointerEvents: 'none',
          autoAlpha: 0,
          visibility: 'hidden',
        });

        gsap.set(path, {
          attr: { d: originalPath },
        });

        tl.kill();
      },
    });

    let leaveCurve = 'M 0 0 V 50 Q 50 0 100 50 V 0 z',
      unfilledPath = 'M 0 0 V 0 Q 50 0 100 0 V 0 z';

    if (typeof data.trigger === 'string') {
      leaveCurve = 'M 0 100 V 50 Q 50 100 100 50 V 100 z';
      unfilledPath = 'M 0 100 V 100 Q 50 100 100 100 V 100 z';
    }

    tl.to(path, {
      morphSVG: leaveCurve,
    }).to(
      path,
      {
        morphSVG: unfilledPath,
        ease: 'sine',
        onStart: () => {
          this.motionTexts.init();
          this.motionTexts.animationIn();
        },
      },
      '<+=.5',
    );

    return new Promise((resolve) => {
      tl.call(() => {
        this.setTransitioning(false);
        resolve();
      });
    });
  }

  leaveTeam() {
    const tl = gsap.timeline({
      defaults: {
        duration: 1,
        ease: 'expo.inOut',
      },
      onComplete: () => tl.kill(),
    });

    gsap.set(this.transitionOverlay, {
      pointerEvents: 'auto',
      autoAlpha: 1,
      visibility: 'visible',
    });

    tl.to(this.transitionOverlay, {
      '--clip': `polygon(0 ${50 - this.percentageVerticalClip}%, 100% ${
        50 - this.percentageVerticalClip
      }%, 100% ${50 + this.percentageVerticalClip}%, 0 ${50 + this.percentageVerticalClip}%)`,
    });

    tl.to(this.transitionOverlay, {
      '--clip': 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    });

    return new Promise((resolve) => {
      tl.call(() => {
        this.motionTexts.destroy();
        resolve();
      });
    });
  }

  afterTeam() {
    const tl = gsap.timeline({
      defaults: {
        duration: 1,
        ease: 'hop',
      },
      onComplete: () => {
        if (this.splitTitleDestination) {
          this.splitTitleDestination.revert();
          this.splitTitleDestination = null;
        }

        gsap.set(this.transitionOverlay, {
          pointerEvents: 'none',
          autoAlpha: 0,
          visibility: 'hidden',
        });

        tl.kill();
      },
    });

    tl.to(this.splitTitleDestination.words, {
      yPercent: -120,
      duration: 0.5,
      stagger: {
        amount: 0.25,
      },
      ease: 'elastic.in(1, 1)',
    });

    tl.to(
      this.transitionOverlay,
      {
        '--clip': 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
        onStart: () => {
          this.motionTexts.init();
          this.motionTexts.animationIn();
        },
      },
      '<+0.25',
    );

    return new Promise((resolve) => {
      tl.call(() => {
        this.setTransitioning(false);
        this.transitionOverlay.classList.remove('team__transition');
        resolve();
      });
    });
  }

  leaveArchive() {
    const tl = gsap.timeline({
      defaults: {
        duration: 1.4,
        ease: 'sine.inOut',
      },
      onComplete: () => tl.kill(),
    });

    gsap.set('.transition__svg__wrapper', {
      pointerEvents: 'auto',
      autoAlpha: 1,
      visibility: 'visible',
    });

    gsap.set('.svg__transition svg path', {
      drawSVG: '0% 0%',
      attr: { 'stroke-width': 100 },
      opacity: 0,
    });

    tl.to('.svg__transition svg path', {
      opacity: 1,
      duration: 0.5,
    });

    tl.to(
      '.svg__transition svg path',
      {
        drawSVG: '0% 100%',
      },
      '<',
    );

    tl.to(
      '.svg__transition svg path',
      {
        attr: { 'stroke-width': 400 },
        ease: 'sine.inOut',
      },
      '<+=0.18',
    );

    return new Promise((resolve) => {
      tl.call(() => {
        this.motionTexts.destroy();
        resolve();
      });
    });
  }

  afterArchive() {
    const tl = gsap.timeline({
      defaults: {
        duration: 1,
        ease: 'sine.inOut',
      },
      onComplete: () => {
        gsap.set('.transition__svg__wrapper', {
          pointerEvents: 'none',
          autoAlpha: 0,
          visibility: 'hidden',
        });

        gsap.set('.svg__transition svg path', {
          drawSVG: '0% 0%',
          attr: { 'stroke-width': 100 },
        });

        tl.kill();
      },
    });

    tl.to('.svg__transition svg path', {
      attr: { 'stroke-width': 100 },
    });

    tl.to(
      '.svg__transition svg path',
      {
        drawSVG: '100% 100%',
      },
      '<+=0.45',
    );

    return new Promise((resolve) => {
      tl.call(() => {
        this.setTransitioning(false);
        resolve();
      });
    });
  }

  enterContact(data) {
    const tl = gsap.timeline({
      defaults: {
        duration: 1.25,
        ease: 'hop',
      },
      onComplete: () => tl.kill(),
    });

    tl.to(data.next.container, {
      clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)',
    });

    tl.to(
      data.next.container,
      {
        '--clip': 'inset(0 0 100% 0)',
      },
      '<+=0.285',
    );

    tl.call(
      () => {
        this.motionTexts.destroy();
        this.motionTexts.init(data.next.container);
        this.motionTexts.animationIn();
      },
      null,
      '<+=0.385',
    );

    return new Promise((resolve) => {
      tl.call(() => {
        resolve();
      });
    });
  }

  getPercentageVerticalClipExample3() {
    const titleDestinationBound = this.titleDestination.getBoundingClientRect();
    const halfHeightTitleDestination = titleDestinationBound.height / 2;
    const halfHeightViewport = window.innerHeight / 2;
    this.percentageVerticalClip = (halfHeightTitleDestination / halfHeightViewport) * 50;
  }

  onResize() {
    this.getPercentageVerticalClipExample3();
    this.webglPageTransition.onResize();
  }

  render() {
    this.webglPageTransition.render();
    requestAnimationFrame(this.render.bind(this));
  }
}

const boot = () => {
  preventLinksMenu();
  gsap.registerPlugin(SplitText, CustomEase, MorphSVGPlugin, DrawSVGPlugin);
  CustomEase.create('hop', '0.56, 0, 0.35, 0.98');
  new App();
};

if (!window.__codropsApp) {
  window.__codropsApp = true;
  boot();
}
