const $ = (id) => document.getElementById(id);

const usernameEl = $("username");
const btnEl = $("btn");
const statusEl = $("status");
const cardEl = $("card");

const avatarEl = $("avatar");
const nameEl = $("name");
const handleEl = $("handle");
const bioEl = $("bio");
const chipsEl = $("chips");

const reposEl = $("repos");
const followersEl = $("followers");
const followingEl = $("following");

const openProfileEl = $("openProfile");
const copyLinkEl = $("copyLink");

function setStatus(message, type) {
  statusEl.className = `status ${type || ""}`.trim();
  statusEl.textContent = message;
  statusEl.classList.remove("hidden");
}

function hideStatus() {
  statusEl.classList.add("hidden");
}

function showCard() {
  cardEl.classList.remove("hidden");
}

function hideCard() {
  cardEl.classList.add("hidden");
}

function normalizeUrl(url) {
  if (!url) return "";
  const trimmed = String(url).trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "https://" + trimmed;
}

function addChip(label, value) {
  if (!value) return;
  const div = document.createElement("div");
  div.className = "chip";
  div.textContent = `${label}: ${value}`;
  chipsEl.appendChild(div);
}

function clearChips() {
  chipsEl.innerHTML = "";
}

async function fetchGitHubProfile(username) {
  const url = `https://api.github.com/users/${encodeURIComponent(username)}`;

  // GitHub API is rate-limited for unauthenticated requests.
  // We keep it simple: no token required.
  const res = await fetch(url, {
    headers: {
      "Accept": "application/vnd.github+json"
    }
  });

  if (res.status === 404) {
    throw new Error("User not found. Check the username and try again.");
  }

  if (res.status === 403) {
    // Often rate limit (or blocked by enterprise policies)
    throw new Error("Access denied or rate-limited (403). Try again later.");
  }

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }

  return await res.json();
}

function formatNumber(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString();
}

async function runSearch() {
  const username = usernameEl.value.trim();
  if (!username) {
    hideCard();
    setStatus("Please enter a GitHub username.", "err");
    return;
  }

  hideCard();
  setStatus("Loading profile…", "loading");

  try {
    const data = await fetchGitHubProfile(username);

    // Fill UI
    avatarEl.src = data.avatar_url || "";
    nameEl.textContent = data.name || "—";
    handleEl.textContent = `@${data.login}`;
    handleEl.href = data.html_url;

    bioEl.textContent = data.bio || "No bio available.";

    reposEl.textContent = formatNumber(data.public_repos);
    followersEl.textContent = formatNumber(data.followers);
    followingEl.textContent = formatNumber(data.following);

    clearChips();
    addChip("Company", data.company);
    addChip("Location", data.location);

    const blog = normalizeUrl(data.blog);
    if (blog) addChip("Website", blog);

    if (data.twitter_username) addChip("X", `@${data.twitter_username}`);

    openProfileEl.href = data.html_url;

    copyLinkEl.onclick = async () => {
      try {
        await navigator.clipboard.writeText(data.html_url);
        setStatus("Profile link copied ✅", "ok");
        setTimeout(() => hideStatus(), 1200);
      } catch {
        setStatus("Could not copy. Your browser may block clipboard in extensions.", "err");
      }
    };

    showCard();
    setStatus("Done ✅", "ok");
    setTimeout(() => hideStatus(), 900);
  } catch (err) {
    hideCard();
    setStatus(err.message || "Something went wrong.", "err");
  }
}

btnEl.addEventListener("click", runSearch);

usernameEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});

// Nice UX: focus input on open
window.addEventListener("DOMContentLoaded", () => {
  usernameEl.focus();
});