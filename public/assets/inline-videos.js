// Connect to YouTube only after consent for the selected playback.
(() => {
  'use strict';

  const initialize = () => {
    let activePlayer = null;
    let pendingPlayer = null;
    const disableButtons = document.querySelectorAll('[data-disable-youtube]');
    const statuses = document.querySelectorAll('[data-youtube-status]');
    const dialog = document.createElement('dialog');
    dialog.className = 'youtube-consent';
    dialog.setAttribute('aria-labelledby', 'youtube-consent-title');
    dialog.setAttribute('aria-describedby', 'youtube-consent-description youtube-consent-choice');
    dialog.innerHTML = `
      <h2 id="youtube-consent-title">Riprodurre il video YouTube?</h2>
      <p class="youtube-consent-video"></p>
      <p id="youtube-consent-description">Se accetti, il video si collega a Google/YouTube, che riceve dati come indirizzo IP, informazioni sul browser e sulla riproduzione e può usare cookie o tecnologie simili.</p>
      <p id="youtube-consent-choice">La scelta è facoltativa e vale solo per questa riproduzione. Puoi continuare a visitare il sito senza accettare. Durante la visione puoi usare “Disattiva YouTube”.</p>
      <p class="youtube-consent-links"><a href="privacy.html#video-youtube" target="_blank" rel="noopener">Privacy e cookie del sito (nuova scheda)</a><br><a href="https://policies.google.com/privacy?hl=it" target="_blank" rel="noopener noreferrer">Privacy di Google (sito esterno, nuova scheda)</a></p>
      <div class="youtube-consent-actions"><button type="button" data-youtube-decline autofocus>Non ora</button><button type="button" data-youtube-accept>Accetta e riproduci</button></div>
    `;
    document.body.append(dialog);

    const updateStatus = () => {
      disableButtons.forEach(button => { button.hidden = !activePlayer; });
      statuses.forEach(status => {
        status.textContent = activePlayer
          ? `YouTube è attivo per il video: ${activePlayer.title}.`
          : 'YouTube non è attivo.';
      });
    };

    const stop = (player, restoreFocus = false) => {
      if (!player) return;
      player.iframe?.remove();
      player.iframe = null;
      player.button.hidden = false;
      player.controls.hidden = true;
      player.container.classList.remove('is-playing');
      if (activePlayer === player) activePlayer = null;
      updateStatus();
      if (restoreFocus) player.button.focus({ preventScroll: true });
    };

    const dismiss = (restoreFocus = true) => {
      const player = pendingPlayer;
      pendingPlayer = null;
      if (dialog.open) dialog.close();
      if (restoreFocus) player?.button.focus({ preventScroll: true });
    };

    const activate = player => {
      if (activePlayer) stop(activePlayer);
      const url = new URL(`https://www.youtube-nocookie.com/embed/${player.videoId}`);
      url.searchParams.set('autoplay', '1');
      url.searchParams.set('playsinline', '1');
      url.searchParams.set('enablejsapi', '1');
      url.searchParams.set('rel', '0');
      if (player.start > 0) url.searchParams.set('start', String(player.start));
      if (/^https?:$/.test(window.location.protocol)) {
        url.searchParams.set('origin', window.location.origin);
      }

      const iframe = document.createElement('iframe');
      iframe.src = url.href;
      iframe.title = player.title;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.tabIndex = 0;

      player.iframe = iframe;
      activePlayer = player;
      player.button.hidden = true;
      player.controls.hidden = false;
      player.container.classList.add('is-playing');
      player.container.append(iframe);
      updateStatus();
      iframe.focus({ preventScroll: true });
    };

    dialog.querySelector('[data-youtube-decline]').addEventListener('click', () => dismiss());
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      dismiss();
    });
    dialog.querySelector('[data-youtube-accept]').addEventListener('click', () => {
      const player = pendingPlayer;
      dismiss(false);
      if (player) activate(player);
    });
    disableButtons.forEach(button => {
      button.addEventListener('click', () => {
        stop(activePlayer);
        button.closest('.privacy-footer')?.querySelector('a')?.focus({ preventScroll: true });
      });
    });

    document.querySelectorAll('.inline-video[data-video]').forEach(container => {
      const videoId = container.dataset.video;
      const button = container.querySelector('button.youtube-play');
      if (!button || !/^[A-Za-z0-9_-]{11}$/.test(videoId) || container.dataset.inlineVideoReady) return;
      // Leave playback unavailable if this browser cannot present the consent dialog.
      if (typeof dialog.showModal !== 'function') return;

      const title = container.dataset.title?.trim() || 'Video Ottovolante';
      const requestedStart = Number(container.dataset.start || 0);
      const start = Number.isFinite(requestedStart) ? Math.max(0, Math.floor(requestedStart)) : 0;
      const controls = document.createElement('div');
      controls.className = 'youtube-controls';
      controls.hidden = true;
      const disable = document.createElement('button');
      disable.type = 'button';
      disable.textContent = 'Disattiva YouTube';
      disable.setAttribute('aria-label', `Disattiva YouTube per ${title}`);
      controls.append(disable);
      container.after(controls);
      const player = { container, button, controls, videoId, title, start, iframe: null };

      button.type = 'button';
      button.hidden = false;
      button.setAttribute('aria-haspopup', 'dialog');
      if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', `Riproduci ${title}`);
      container.dataset.inlineVideoReady = 'true';
      disable.addEventListener('click', () => stop(player, true));
      button.addEventListener('click', () => {
        if (activePlayer === player || dialog.open) return;
        if (activePlayer) stop(activePlayer);
        pendingPlayer = player;
        dialog.querySelector('.youtube-consent-video').textContent = title;
        dialog.showModal();
        dialog.querySelector('[data-youtube-decline]').focus({ preventScroll: true });
      });
    });

    const reset = () => {
      dismiss(false);
      stop(activePlayer);
      updateStatus();
    };
    window.addEventListener('pagehide', reset);
    window.addEventListener('pageshow', reset);
    updateStatus();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
