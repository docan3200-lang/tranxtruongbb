(() => {
  'use strict';
  const audio = document.getElementById('bgMusic');
  const toggle = document.getElementById('musicToggle');
  const musicText = document.getElementById('musicText');
  const open = document.getElementById('openInvite');
  const note = document.getElementById('openingNote');
  const status = document.getElementById('audioStatus');
  const introMusic = document.getElementById('introMusicToggle');
  let optedOut = false;
  let started = false;
  let statusTimer;
  audio.volume = .55;

  function syncMusic() {
    const playing = !audio.paused && !audio.ended;
    toggle.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? 'Tắt nhạc nền' : 'Bật nhạc nền');
    musicText.textContent = playing ? 'Tắt nhạc' : 'Bật nhạc';
    if (introMusic) {
      introMusic.classList.toggle('is-playing', playing);
      introMusic.setAttribute('aria-pressed', String(playing));
      introMusic.setAttribute('aria-label', playing ? 'Tắt nhạc nền' : 'Bật nhạc nền');
      introMusic.querySelector('.intro-music-text').textContent = playing ? 'Tắt nhạc' : 'Bật nhạc';
    }
    if (playing) {
      started = true;
      note.textContent = 'Giai điệu yêu thương đang phát ♡';
      open.querySelector('.open-label').textContent = 'KHÁM PHÁ THIỆP';
      status.hidden = true;
    } else if (started) {
      note.textContent = 'Bạn có thể bật lại giai điệu ở nút nhạc phía dưới';
    }
  }
  function message(text) {
    clearTimeout(statusTimer);
    status.textContent = text;
    status.hidden = false;
    statusTimer = setTimeout(() => { status.hidden = true; }, 6000);
  }
  function playMusic(fromGesture = false) {
    // Call play synchronously inside a gesture; waiting first breaks iOS unlock.
    const attempt = audio.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch((error) => {
        syncMusic();
        if (error.name === 'NotAllowedError') {
          note.textContent = 'Chạm “Mở thiệp” để nghe nhạc cùng chúng mình';
          if (fromGesture) message('Chạm “Bật nhạc” để bắt đầu giai điệu nhé!');
        } else if (fromGesture) {
          message('Nhạc chưa tải xong. Bạn chạm “Bật nhạc” để thử lại nhé!');
        }
      });
    }
  }
  audio.addEventListener('play', syncMusic);
  audio.addEventListener('pause', syncMusic);
  audio.addEventListener('error', () => message('Chưa tải được nhạc. Bạn kiểm tra kết nối và thử lại nhé!'));
  function toggleMusic() {
    if (audio.paused) { optedOut = false; playMusic(true); }
    else { optedOut = true; audio.pause(); }
  }
  toggle.addEventListener('click', toggleMusic);
  if (introMusic) introMusic.addEventListener('click', toggleMusic);
  document.addEventListener('invitation:open', () => {
    if (!optedOut && audio.paused) playMusic(true);
  });
  open.addEventListener('click', () => {
    if (audio.paused) { optedOut = false; playMusic(true); }
    document.getElementById('loi-ngo').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  });
  // A first tap anywhere on the invitation can unlock autoplay. Respect manual pause.
  document.addEventListener('click', (event) => {
    if (!started && !optedOut && !event.target.closest('#musicToggle, #openInvite, #invitationIntro')) playMusic();
  });
  document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && !started && !optedOut && !event.target.closest('button')) playMusic();
  });
  playMusic();
  syncMusic();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const petalLayer = document.getElementById('petals');
  function makePetals() {
    petalLayer.replaceChildren();
    if (reduced.matches) return;
    const count = innerWidth < 700 ? 22 : 34;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      const size = 7 + Math.random() * 9;
      const duration = 12 + Math.random() * 13;
      const variables = {x: `${Math.random()*100}%`, size: `${size}px`, duration: `${duration}s`, delay: `${-Math.random()*duration}s`, drift: `${Math.random()*170-85}px`, spin: `${Math.random()*540-270}deg`, sway: `${3+Math.random()*4}s`, rotate: `${Math.random()*180}deg`, opacity: `${.25+Math.random()*.4}`};
      Object.entries(variables).forEach(([key,value]) => petal.style.setProperty(`--${key}`, value));
      petal.appendChild(document.createElement('i'));
      fragment.appendChild(petal);
    }
    petalLayer.appendChild(fragment);
  }
  makePetals();
  if (reduced.addEventListener) reduced.addEventListener('change', makePetals);
  document.addEventListener('visibilitychange', () => {
    petalLayer.querySelectorAll('.petal').forEach(petal => {petal.style.animationPlayState = document.hidden ? 'paused' : 'running';});
  });
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      });
    }, {threshold:.07});
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    document.documentElement.classList.add('js-motion');
  }
})();
