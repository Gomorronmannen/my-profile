/* ======================
   script.js — Link Hub
   ======================
   Instructions:
   1) Put your Discord user id below (discordId)
   2) Replace song entries in `songs` with your files (title, artist, src, cover)
   3) Set randomOnLoad and autoplay as you like
   4) Serve the site via a static server (python -m http.server / npx http-server)
*/

///////////////////////
// CONFIG - edit me! //
///////////////////////
const discordId = "1414184318913351753"; // e.g. "1325567817319452682"
const randomOnLoad = true;
const autoplay = true; // browsers often block autoplay of unmuted audio

// Fill these with your files in /assets/songs/ and covers in /assets/covers/
const songs = [
  { title: "Come As You Are", artist: "Nirvana", src: "assets/songs/song1.mp3", cover: "assets/covers/song1.jpg" },
  { title: "All Apologies",   artist: "Nirvana", src: "assets/songs/song2.mp3", cover: "assets/covers/song2.jpg" },
  { title: "Come Together",   artist: "The Beatles", src: "assets/songs/song3.mp3", cover: "assets/covers/song3.jpg" },
  { title: "Buddy Holly",     artist: "Weezer", src: "assets/songs/song4.mp3", cover: "assets/covers/song4.jpg" },
  { title: "Piano Man",       artist: "Billy Joel", src: "assets/songs/song5.mp3", cover: "assets/covers/song5.jpg" },
];

//////////////////////////
// ELEMENT REFERENCES   //
//////////////////////////
const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const trackTitleEl = document.getElementById("track-title");
const trackArtistEl = document.getElementById("track-artist");
const playerCover = document.getElementById("player-cover");

const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");

const discordNameEl = document.getElementById("discordName");
const discordActivityEl = document.getElementById("discordActivity");
const discordAvatarEl = document.getElementById("discordAvatar");
const discordIndicator = document.getElementById("discordIndicator");

const viewCountEl = document.getElementById("viewCount");

// NEW: volume slider
const volumeSlider = document.getElementById("volumeSlider");

//////////////////////////
// PLAYER STATE         //
//////////////////////////
let currentIndex = 0;
let isPlaying = false;
let userInteracted = false; // track whether user clicked (for autoplay policies)

//////////////////////////
// UTILS                //
//////////////////////////
function formatTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Click-to-enter overlay logic
const entryOverlay = document.getElementById("entryOverlay");

entryOverlay.addEventListener("click", () => {
  // Fade away overlay
  entryOverlay.classList.add("hidden");

  // Load first (or random) song before playing
  if (songs && songs.length > 0) {
    loadSong(randomOnLoad ? Math.floor(Math.random() * songs.length) : 0);
  }

  // Try to play music
  tryPlay();

  // Remove overlay after fade
  setTimeout(() => {
    entryOverlay.remove();
  }, 800);
});


//////////////////////////
// SONG LOADING / UI    //
//////////////////////////
function loadSong(index) {
  if (!songs || songs.length === 0) return;
  index = ((index % songs.length) + songs.length) % songs.length; // safe wrap
  currentIndex = index;
  const s = songs[index];

  // Update UI
  trackTitleEl.textContent = s.title || "Unknown";
  trackArtistEl.textContent = s.artist || "";
  playerCover.src = s.cover || "assets/covers/song1.jpg";

  // Load audio
  audio.src = s.src;
  audio.load();

  // Reset UI states
  playBtn.textContent = "▶";
  isPlaying = false;
  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "0:00";
  progressFill.style.width = "0%";
  progressBar.setAttribute("aria-valuenow", "0");
}

// Attempt to play (handles promise from play())
async function tryPlay() {
  try {
    await audio.play();
    isPlaying = true;
    playBtn.textContent = "❚❚";
  } catch (err) {
    // Autoplay blocked or other error — leave paused
    isPlaying = false;
    playBtn.textContent = "▶";
  }
}

//////////////////////////
// INIT / RANDOM ON LOAD//
//////////////////////////
function initPlayer() {
  if (!songs || songs.length === 0) {
    trackTitleEl.textContent = "No songs found";
    trackArtistEl.textContent = "";
    playerCover.src = "assets/covers/song1.jpg";
    return;
  }

  if (randomOnLoad) {
    const idx = Math.floor(Math.random() * songs.length);
    loadSong(idx);
    if (autoplay) tryPlay();
  } else {
    loadSong(0);
    if (autoplay) tryPlay();
  }

  // Init volume
  audio.volume = 0.1;
  if (volumeSlider) {
    volumeSlider.value = 10;
    volumeSlider.addEventListener("input", () => {
      audio.volume = volumeSlider.value / 100;
    });
  }
}

//////////////////////////
// PLAY / PAUSE / SKIP   //
//////////////////////////
function togglePlay() {
  if (!audio.src) return;
  if (isPlaying) {
    audio.pause();
    playBtn.textContent = "▶";
    isPlaying = false;
  } else {
    userInteracted = true;
    tryPlay();
  }
}

function nextSong() {
  loadSong(currentIndex + 1);
  if (isPlaying) tryPlay();
}

function prevSong() {
  loadSong(currentIndex - 1);
  if (isPlaying) tryPlay();
}

//////////////////////////
// PROGRESS & SEEKING    //
//////////////////////////
audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration || 0);
  progressBar.setAttribute("aria-valuemax", "100");
});

audio.addEventListener("timeupdate", () => {
  const cur = audio.currentTime || 0;
  const dur = audio.duration || 1;
  const pct = (cur / dur) * 100;
  progressFill.style.width = `${pct}%`;
  currentTimeEl.textContent = formatTime(cur);
  progressBar.setAttribute("aria-valuenow", Math.floor(pct));
});

progressBar.addEventListener("click", (e) => {
  const rect = progressBar.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const pct = Math.max(0, Math.min(1, x / rect.width));
  audio.currentTime = (audio.duration || 0) * pct;
});

progressBar.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    const step = 5; // seconds
    if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, (audio.currentTime || 0) - step);
    if (e.key === "ArrowRight") audio.currentTime = Math.min((audio.duration || 0), (audio.currentTime || 0) + step);
  }
});

audio.addEventListener("ended", () => {
  const wasPlaying = isPlaying;
  nextSong();
  if (wasPlaying) tryPlay();
});

//////////////////////////
// UI EVENT BINDINGS    //
//////////////////////////
playBtn.addEventListener("click", (e) => {
  userInteracted = true;
  togglePlay();
});
nextBtn.addEventListener("click", (e) => { userInteracted = true; nextSong(); });
prevBtn.addEventListener("click", (e) => { userInteracted = true; prevSong(); });

window.addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable)) return;

  if (e.key === " " || e.code === "Space") {
    e.preventDefault();
    togglePlay();
  } else if (e.key === "ArrowRight") {
    nextSong();
  } else if (e.key === "ArrowLeft") {
    prevSong();
  }
});

//////////////////////////
// LANYARD (Discord)    //
//////////////////////////
async function fetchLanyard() {
  if (!discordId || discordId === "1414184318913351753") {
    discordNameEl.textContent = "Add your Discord ID in script.js";
    discordActivityEl.textContent = "";
    discordAvatarEl.src = "assets/icons/discord.svg";
    discordIndicator.className = "status-dot offline";
    return;
  }

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`);
    if (!res.ok) throw new Error("Network response not ok");
    const json = await res.json();
    const data = json.data;

    const username = data.discord_user?.username || "Unknown";
    const discrim = data.discord_user?.discriminator ? ("#" + data.discord_user.discriminator) : "";
    discordNameEl.textContent = `${username}${discrim}`;

    const avatarHash = data.discord_user?.avatar;
    if (avatarHash) {
      discordAvatarEl.src = `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png?size=128`;
    } else {
      discordAvatarEl.src = "assets/icons/discord.svg";
    }

    const status = data.discord_status || "offline";
    discordIndicator.className = "status-dot " + (status || "offline");

    let activityText = status;
    if (Array.isArray(data.activities) && data.activities.length > 0) {
      const spotify = data.listening_to_spotify ? data.spotify : null;
      if (spotify && data.listening_to_spotify) {
        activityText = `${spotify.song} — ${spotify.artist}`;
      } else {
        const act = data.activities.find(a => a.type === 0 || a.type === 4) || data.activities[0];
        if (act) {
          activityText = act.details ? `${act.name} • ${act.details}` : act.name || status;
        }
      }
    }
    discordActivityEl.textContent = activityText;
  } catch (err) {
    discordNameEl.textContent = "Unavailable";
    discordActivityEl.textContent = "";
    discordAvatarEl.src = "assets/icons/discord.svg";
    discordIndicator.className = "status-dot offline";
  }
}

// initial fetch + polling (every 20s)
fetchLanyard();
setInterval(fetchLanyard, 100);

//////////////////////////
// STARTUP              //
//////////////////////////
initPlayer();

