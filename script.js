/* ==========================================================
   Wedding invitation — countdown, scroll fade-in and RSVP form
   ========================================================== */

// EDIT: set the wedding date and start time to switch the countdown on.
// Format: 'YYYY-MM-DDTHH:MM:SS+08:00' (Philippine time), for example:
//   var WEDDING_DATE = '2027-06-14T10:00:00+08:00';
// Leave it as null to keep the countdown hidden.
var WEDDING_DATE = '2027-06-14T10:00:00+08:00';

// EDIT: the YouTube video used as background music. This is the part of the
// link after "watch?v=". It repeats on a loop. Set it to '' to use
// song.mp3 or the built-in melody instead.
// (The "Panaginip" video HoU1k2oW3W4 cannot be used: its owner blocks embedding.)
var YOUTUBE_SONG_ID = '';

// EDIT: how fast the page scrolls by itself after the invitation is opened,
// in pixels per second. Bigger = faster. Set to 0 to switch auto-scroll off.
var AUTO_SCROLL_SPEED = 35;

// EDIT: where RSVP replies are sent. See DEPLOY.txt for how to get these values.
//   url   = the Google Form link ending in /formResponse
//   others = the "entry.123456" code of each question in that form
//
// The form currently has three questions:
//   "name"     (short answer)            -> name
//   "atten"    (choices: yes / No)       -> attending
//   "attendes" (dropdown: 1 / 2 / 3)     -> seats
// The answers sent must match the form's choices EXACTLY (yes, No, 1, 2, 3).
// If you rename a choice or add a question in Google Forms, update this block.
// There is no "message" question yet, so the message box is hidden on the site;
// add a Paragraph question to the form and put its code in "message" to show it.
var GOOGLE_FORM = {
  url: 'https://docs.google.com/forms/d/e/1FAIpQLSdKiu_q6nrPGhuUtky38ST_Pza6A3lkrVsUvXHVoYw5TIw5rw/formResponse',
  name: 'entry.1042526489',
  attending: 'entry.2065926048',
  seats: 'entry.835563212',
  message: '',
  yesAnswer: 'yes',
  noAnswer: 'No',
  // The form requires a seat number and has no "0", so a guest who declines is sent as this.
  seatsWhenDeclining: '1',
  extra: {}
};

(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* ---------- Countdown ---------- */
  var countdown = document.getElementById('countdown');
  var target = WEDDING_DATE ? new Date(WEDDING_DATE).getTime() : NaN;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function tick() {
    // Before the wedding it counts down; after it, it keeps running as time married.
    var diff = target - Date.now();
    var caption = document.getElementById('cd-caption');
    if (caption) {
      caption.textContent = diff > 0 ? 'until we say "I do"' : 'since we said "I do"';
    }
    var s = Math.floor(Math.abs(diff) / 1000);
    document.getElementById('cd-days').textContent = Math.floor(s / 86400);
    document.getElementById('cd-hours').textContent = pad(Math.floor((s % 86400) / 3600));
    document.getElementById('cd-minutes').textContent = pad(Math.floor((s % 3600) / 60));
    document.getElementById('cd-seconds').textContent = pad(s % 60);
    return true;
  }

  if (countdown && !isNaN(target) && tick()) {
    countdown.hidden = false;
    var timer = setInterval(function () {
      if (!tick()) { clearInterval(timer); }
    }, 1000);
  }

  /* ---------- Fade sections in while scrolling ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Background music ----------
     Browsers only allow sound after the guest taps something, so the music
     starts when the seal is tapped. It plays song.mp3 if that file
     exists; otherwise it plays a soft built-in music-box melody. */
  var audio = document.getElementById('bg-music');
  var musicToggle = document.getElementById('music-toggle');
  var musicOn = false;
  var synth = null; // built-in melody, created only if song.mp3 is missing

  // Gentle arpeggios over four chords (C, G, A minor, F), as piano key numbers.
  var MELODY = [
    60, 64, 67, 72, 76, 72, 67, 64,
    59, 62, 67, 71, 74, 71, 67, 62,
    57, 60, 64, 69, 72, 69, 64, 60,
    53, 57, 60, 65, 69, 65, 60, 57
  ];
  var NOTE_LENGTH = 0.34; // seconds between notes

  function createSynth() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) { return null; }
    var ctx = new Ctx();
    var master = ctx.createGain();
    master.gain.value = 0.14;
    master.connect(ctx.destination);
    var step = 0;
    var nextTime = ctx.currentTime + 0.1;

    function playNote(key, when) {
      var freq = 440 * Math.pow(2, (key - 69) / 12);
      [[freq, 1], [freq * 2, 0.25]].forEach(function (part) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = part[0];
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(part[1], when + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + 1.8);
        osc.connect(gain);
        gain.connect(master);
        osc.start(when);
        osc.stop(when + 1.9);
      });
    }

    // Keep a little music queued ahead; nothing queues while paused.
    setInterval(function () {
      if (ctx.state !== 'running') { return; }
      if (nextTime < ctx.currentTime) { nextTime = ctx.currentTime + 0.05; }
      while (nextTime < ctx.currentTime + 0.6) {
        playNote(MELODY[step % MELODY.length], nextTime);
        nextTime += NOTE_LENGTH;
        step++;
      }
    }, 150);

    return ctx;
  }

  function showMusicState() {
    if (!musicToggle) { return; }
    musicToggle.hidden = false;
    musicToggle.classList.toggle('is-playing', musicOn);
    musicToggle.setAttribute('aria-label', musicOn ? 'Pause music' : 'Play music');
  }

  function playSynth() {
    if (!synth) { synth = createSynth(); }
    if (synth) { synth.resume(); }
  }

  // Plays song.mp3, or the built-in melody if that file is missing.
  function playLocal() {
    if (synth || !audio) { playSynth(); return; }
    var attempt = audio.play();
    if (attempt && attempt.catch) {
      attempt.catch(function () { if (musicOn) { playSynth(); } });
    }
  }

  /* The song from YouTube, shown in the "Our song" section and repeated on a loop.
     If YouTube cannot be reached or the video cannot be embedded,
     the site falls back to song.mp3 / the built-in melody. */
  var yt = null;          // the YouTube player
  var ytReady = false;
  var ytFailed = !YOUTUBE_SONG_ID || !document.getElementById('yt-player');
  var ytWanted = false;   // the guest asked for music before the player was ready

  function ytIsPlaying() {
    var state = yt && yt.getPlayerState ? yt.getPlayerState() : -1;
    return state === 1 || state === 3; // playing or buffering
  }

  if (!ytFailed) {
    window.onYouTubeIframeAPIReady = function () {
      yt = new YT.Player('yt-player', {
        videoId: YOUTUBE_SONG_ID,
        host: 'https://www.youtube-nocookie.com',
        // loop + playlist of the same video = the song repeats forever
        playerVars: { loop: 1, playlist: YOUTUBE_SONG_ID, playsinline: 1, rel: 0 },
        events: {
          onReady: function () {
            ytReady = true;
            if (ytWanted && musicOn) { yt.playVideo(); }
          },
          onStateChange: function (e) {
            // Keep the round button in step with the player's own controls.
            if (e.data === 1) { musicOn = true; showMusicState(); }
            if (e.data === 2) { musicOn = false; showMusicState(); }
            // Safety net: if the song ever ends instead of looping, start it again.
            if (e.data === 0) { yt.seekTo(0); yt.playVideo(); }
          },
          onError: function () {
            ytFailed = true;
            if (musicOn) { playLocal(); }
          }
        }
      });
    };
    var api = document.createElement('script');
    api.src = 'https://www.youtube.com/iframe_api';
    api.onerror = function () { ytFailed = true; if (musicOn) { playLocal(); } };
    document.head.appendChild(api);
  } else {
    var songSection = document.getElementById('our-song');
    if (songSection) { songSection.hidden = true; }
  }

  function startMusic() {
    musicOn = true;
    showMusicState();
    if (ytFailed) { playLocal(); return; }
    if (!ytReady) { ytWanted = true; return; }
    yt.playVideo();
    // Some phones refuse to start sound on their own; then show the button as paused
    // so one more tap on it starts the song.
    setTimeout(function () {
      if (musicOn && !ytFailed && !ytIsPlaying()) { musicOn = false; showMusicState(); }
    }, 4000);
  }

  function stopMusic() {
    musicOn = false;
    ytWanted = false;
    showMusicState();
    if (yt && ytReady) { yt.pauseVideo(); }
    if (audio) { audio.pause(); }
    if (synth) { synth.suspend(); }
  }

  if (musicToggle) {
    musicToggle.addEventListener('click', function () {
      if (musicOn) { stopMusic(); } else { startMusic(); }
    });
  }

  /* ---------- Slow auto-scroll after opening ----------
     The page glides down by itself. It stops for good as soon as the guest
     scrolls, taps, clicks or presses a key, or when it reaches the bottom. */
  var autoScrolling = false;

  function stopAutoScroll() { autoScrolling = false; }

  function startAutoScroll() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!AUTO_SCROLL_SPEED || reduce || autoScrolling) { return; }

    autoScrolling = true;
    var position = window.pageYOffset;
    var last = null;

    function frame(now) {
      if (!autoScrolling) { return; }
      if (last !== null) {
        // Cap the step so a sleeping tab does not jump when it wakes up.
        position += AUTO_SCROLL_SPEED * Math.min(now - last, 100) / 1000;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (position >= max) { position = max; autoScrolling = false; }
        window.scrollTo({ top: position, behavior: 'instant' });
      }
      last = now;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach(function (type) {
    window.addEventListener(type, function (e) {
      // Pausing or playing the music should not stop the scrolling.
      if (e.target && e.target.closest && e.target.closest('.music-toggle')) { return; }
      stopAutoScroll();
    }, { passive: true });
  });

  /* ---------- Opening cover ---------- */
  var cover = document.getElementById('cover');
  var openButton = document.getElementById('open-invite');

  function finishOpening() {
    cover.hidden = true;
    document.body.classList.remove('cover-locked');
  }

  if (cover && openButton) {
    document.body.classList.add('cover-locked');
    openButton.addEventListener('click', function () {
      // Seal fades, the flap lifts, then the envelope fades away to show the page.
      cover.classList.add('is-open');
      openButton.disabled = true;
      startMusic();
      setTimeout(function () { document.body.classList.add('opened'); }, 1300);
      setTimeout(finishOpening, 2300);
      // Give guests a moment to read the names before the page starts to glide.
      setTimeout(startAutoScroll, 5500);
    });
  } else {
    document.body.classList.add('opened');
  }

  /* ---------- Falling petals in the hero ---------- */
  var petals = document.getElementById('petals');
  var calmMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (petals && !calmMotion) {
    for (var i = 0; i < 16; i++) {
      var petal = document.createElement('span');
      var size = 10 + Math.random() * 10;
      petal.className = 'petal';
      petal.style.left = (Math.random() * 100) + '%';
      petal.style.width = size + 'px';
      petal.style.height = (size * 1.4) + 'px';
      petal.style.animationDuration = (9 + Math.random() * 9) + 's';
      petal.style.animationDelay = (-Math.random() * 18) + 's';
      petals.appendChild(petal);
    }
  }

  /* ---------- Photos: show a labelled frame until the file is added ---------- */
  // If your own .jpg is not there yet, show the sample drawing with the same name (.svg).
  function markMissing(img) {
    if (!img.dataset.triedSample) {
      img.dataset.triedSample = '1';
      img.src = img.getAttribute('src').replace('.jpg', '.svg');
      return;
    }
    var frame = img.closest('.photo');
    if (!frame) { return; }
    frame.classList.add('missing');
    var shot = frame.closest('.shot');
    if (shot) { shot.disabled = true; }
  }

  document.querySelectorAll('.photo img').forEach(function (img) {
    img.addEventListener('error', function () { markMissing(img); });
    if (img.complete && img.naturalWidth === 0) {
      markMissing(img);
    }
  });

  /* ---------- Gallery: click a photo to enlarge it ---------- */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxClose = document.getElementById('lightbox-close');

  if (lightbox && typeof lightbox.showModal === 'function') {
    document.querySelectorAll('.shot').forEach(function (shot) {
      shot.addEventListener('click', function () {
        var img = shot.querySelector('img');
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.showModal();
      });
    });
    lightboxClose.addEventListener('click', function () { lightbox.close(); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) { lightbox.close(); }
    });
  }

  /* ---------- RSVP form ---------- */
  var form = document.getElementById('rsvp-form');
  if (!form) { return; }

  var status = document.getElementById('form-status');
  var guestsField = document.getElementById('guests-field');
  var button = form.querySelector('button[type="submit"]');

  function setStatus(text, isError) {
    status.textContent = text;
    status.classList.toggle('error', !!isError);
  }

  // Hide the message box while the Google Form has no question to store it in.
  var messageBox = document.getElementById('message');
  if (messageBox && !GOOGLE_FORM.message) {
    messageBox.closest('.field').hidden = true;
  }

  // Only ask for the number of seats when the guest is attending.
  form.addEventListener('change', function (e) {
    if (e.target.name === 'attending') {
      guestsField.hidden = e.target.value === 'no';
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = form.elements.name.value.trim();
    var attending = form.elements.attending.value;

    if (!name) {
      setStatus('Please enter your name.', true);
      form.elements.name.focus();
      return;
    }
    if (!attending) {
      setStatus('Please tell us whether you can attend.', true);
      return;
    }

    button.disabled = true;
    setStatus('Sending your reply…', false);

    var thanks = attending === 'yes'
      ? 'Thank you! We look forward to celebrating with you.'
      : 'Thank you for letting us know. You will be missed.';

    // Spam trap: real guests never fill the hidden "website" field.
    if (form.elements.website.value) {
      form.reset();
      setStatus(thanks, false);
      button.disabled = false;
      return;
    }

    if (!GOOGLE_FORM.url) {
      setStatus('Online replies are not switched on yet. Please reply through Rodel.', true);
      button.disabled = false;
      return;
    }

    // Send the answers to the Google Form; they appear in its linked Google Sheet.
    var answers = new URLSearchParams();
    var values = {
      name: name,
      attending: attending === 'yes' ? GOOGLE_FORM.yesAnswer : GOOGLE_FORM.noAnswer,
      seats: attending === 'yes' ? form.elements.guests.value : GOOGLE_FORM.seatsWhenDeclining,
      message: form.elements.message.value.trim()
    };
    Object.keys(values).forEach(function (key) {
      if (GOOGLE_FORM[key]) { answers.append(GOOGLE_FORM[key], values[key]); }
    });
    Object.keys(GOOGLE_FORM.extra || {}).forEach(function (code) {
      answers.append(code, GOOGLE_FORM.extra[code]);
    });

    // Google does not let the page read its reply, so a sent request counts as success.
    fetch(GOOGLE_FORM.url, { method: 'POST', mode: 'no-cors', body: answers })
      .then(function () {
        form.reset();
        guestsField.hidden = false;
        setStatus(thanks, false);
      })
      .catch(function () {
        setStatus('We could not send your reply. Please try again, or reply through Rodel.', true);
      })
      .then(function () {
        button.disabled = false;
      });
  });
})();
