// Load a YouTube player only after an explicit click. Keep playback in the page.
(() => {
  'use strict';

  const initialize = () => {
    let activePlayer = null;

    const stop = player => {
      player.iframe?.remove();
      player.iframe = null;
      player.button.hidden = false;
      player.container.classList.remove('is-playing');
      if (activePlayer === player) activePlayer = null;
    };

    document.querySelectorAll('.inline-video[data-video]').forEach(container => {
      const videoId = container.dataset.video;
      const button = container.querySelector('button.youtube-play');
      if (!button || !/^[A-Za-z0-9_-]{11}$/.test(videoId) || container.dataset.inlineVideoReady) return;

      const title = container.dataset.title?.trim() || 'Video Ottovolante';
      const requestedStart = Number(container.dataset.start || 0);
      const start = Number.isFinite(requestedStart) ? Math.max(0, Math.floor(requestedStart)) : 0;
      const player = { container, button, iframe: null };

      button.type = 'button';
      if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', `Riproduci ${title}`);
      container.dataset.inlineVideoReady = 'true';

      button.addEventListener('click', () => {
        if (activePlayer === player) return;
        if (activePlayer) stop(activePlayer);

        const url = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
        url.searchParams.set('autoplay', '1');
        url.searchParams.set('playsinline', '1');
        url.searchParams.set('enablejsapi', '1');
        url.searchParams.set('rel', '0');
        if (start > 0) url.searchParams.set('start', String(start));
        if (/^https?:$/.test(window.location.protocol)) {
          url.searchParams.set('origin', window.location.origin);
        }

        const iframe = document.createElement('iframe');
        iframe.src = url.href;
        iframe.title = title;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.tabIndex = 0;

        player.iframe = iframe;
        activePlayer = player;
        button.hidden = true;
        container.classList.add('is-playing');
        container.append(iframe);
        iframe.focus({ preventScroll: true });
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
