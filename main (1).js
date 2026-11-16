(() => {
  const mobileMenu = document.querySelector('.mobile-menu');
  if (mobileMenu) {
    const menuSummary = mobileMenu.querySelector('summary');
    const syncMenuLabel = () => {
      menuSummary?.setAttribute('aria-label', mobileMenu.open ? 'Close site navigation' : 'Open site navigation');
    };

    mobileMenu.addEventListener('toggle', syncMenuLabel);
    syncMenuLabel();

    mobileMenu.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.open = false;
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mobileMenu.open) {
        mobileMenu.open = false;
        menuSummary?.focus();
      }
    });
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealItems = document.querySelectorAll('.reveal');
    if (revealItems.length > 0) {
      const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            currentObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

      document.documentElement.classList.add('motion-ready');
      revealItems.forEach((item) => observer.observe(item));
    }
  }
})();
