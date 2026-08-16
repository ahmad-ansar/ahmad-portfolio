"use strict";

document.documentElement.classList.add("js");

const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const menu = document.querySelector("[data-menu]");

function updateHeader() {
  header?.classList.toggle("scrolled", window.scrollY > 12);
}

function closeMenu() {
  if (!menuButton || !menu) return;
  menuButton.setAttribute("aria-expanded", "false");
  menu.classList.remove("open");
}

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menu?.classList.toggle("open", !isOpen);
});

menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px" });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

const analyzer = document.querySelector("[data-analyzer]");

if (analyzer) {
  const input = analyzer.querySelector("[data-password-input]");
  const toggle = analyzer.querySelector("[data-password-toggle]");
  const generateButton = analyzer.querySelector("[data-generate]");
  const clearButton = analyzer.querySelector("[data-clear]");
  const strengthBar = analyzer.querySelector("[data-strength-bar]");
  const strengthLabel = analyzer.querySelector("[data-strength-label]");
  const scoreOutput = analyzer.querySelector("[data-score]");
  const lengthOutput = analyzer.querySelector("[data-length]");
  const entropyOutput = analyzer.querySelector("[data-entropy]");
  const crackOutput = analyzer.querySelector("[data-crack-time]");
  const feedbackList = analyzer.querySelector("[data-feedback]");

  const commonPasswords = new Set([
    "123456", "12345678", "123456789", "1234567890", "111111", "000000",
    "password", "password1", "password123", "passw0rd", "qwerty", "qwerty123",
    "abc123", "letmein", "welcome", "admin", "login", "monkey", "dragon",
    "football", "baseball", "iloveyou", "sunshine", "princess", "superman",
    "batman", "trustno1", "master", "hello", "freedom", "whatever", "secret",
    "changeme", "computer", "internet", "starwars", "minecraft", "pokemon"
  ]);

  const colors = {
    "Very weak": "#ff7b72",
    "Weak": "#f2a65a",
    "Fair": "#f0c66f",
    "Strong": "#62d98b",
    "Very strong": "#52d6c5"
  };

  const predictableSequences = [
    "0123", "1234", "2345", "3456", "4567", "5678", "6789",
    "abcd", "bcde", "cdef", "qwerty", "asdf", "zxcv"
  ];

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function passwordProfile(value) {
    const lowerValue = value.toLowerCase();
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSymbol = /[^A-Za-z0-9\s]/.test(value);
    const hasSpace = /\s/.test(value);
    const classes = [hasLower, hasUpper, hasNumber, hasSymbol, hasSpace].filter(Boolean).length;

    let poolSize = 0;
    if (hasLower) poolSize += 26;
    if (hasUpper) poolSize += 26;
    if (hasNumber) poolSize += 10;
    if (hasSymbol) poolSize += 33;
    if (hasSpace) poolSize += 1;

    const isCommon = commonPasswords.has(lowerValue.trim());
    const hasRepeat = /(.)\1{2,}/i.test(value);
    const hasSequence = predictableSequences.some((sequence) => lowerValue.includes(sequence));
    const isOnlyDigits = /^[0-9]+$/.test(value);
    const isShortWord = /^[a-z]+$/i.test(value) && value.length < 14;

    return {
      classes,
      poolSize: Math.max(poolSize, 1),
      isCommon,
      hasRepeat,
      hasSequence,
      isOnlyDigits,
      isShortWord
    };
  }

  function analyzePassword(value) {
    const profile = passwordProfile(value);
    const rawEntropy = value.length * Math.log2(profile.poolSize);
    let penalty = 0;

    if (profile.isCommon) penalty += 60;
    if (profile.hasRepeat) penalty += 12;
    if (profile.hasSequence) penalty += 14;
    if (profile.isOnlyDigits) penalty += 12;
    if (profile.isShortWord) penalty += 10;
    if (value.length < 8) penalty += 20;

    const effectiveEntropy = Math.max(0, rawEntropy - penalty);
    let score = clamp(Math.round(effectiveEntropy * 1.15), 0, 100);

    if (value.length < 8) score = Math.min(score, 20);
    if (profile.isCommon) score = Math.min(score, 8);

    let label = "Very weak";
    if (score >= 82) label = "Very strong";
    else if (score >= 64) label = "Strong";
    else if (score >= 42) label = "Fair";
    else if (score >= 20) label = "Weak";

    const feedback = [];
    if (profile.isCommon) feedback.push("This appears in common password lists.");
    if (value.length < 14) feedback.push("Use at least 14 characters for a stronger margin.");
    if (profile.classes < 3 && !profile.hasSpace) feedback.push("Add length and more character variety, or use a longer passphrase.");
    if (profile.hasRepeat) feedback.push("Avoid repeating the same character three or more times.");
    if (profile.hasSequence) feedback.push("Avoid predictable keyboard or number sequences.");
    if (!feedback.length) feedback.push("No basic warning signs were found by this simplified check.");

    return {
      score,
      label,
      rawEntropy,
      effectiveEntropy,
      feedback
    };
  }

  function formatCompact(value) {
    if (value >= 100) return Math.round(value).toLocaleString("en-US");
    if (value >= 10) return value.toFixed(1).replace(".0", "");
    return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatResistance(entropyBits) {
    const guessesPerSecond = 100_000_000_000;
    const log10Seconds = entropyBits * Math.LOG10E * Math.LN2 - Math.log10(2 * guessesPerSecond);

    if (log10Seconds < 0) return "less than 1 second";

    const log10Minute = Math.log10(60);
    const log10Hour = Math.log10(3600);
    const log10Day = Math.log10(86_400);
    const log10Year = Math.log10(31_557_600);

    if (log10Seconds < log10Minute) return `${formatCompact(10 ** log10Seconds)} seconds`;
    if (log10Seconds < log10Hour) return `${formatCompact(10 ** (log10Seconds - log10Minute))} minutes`;
    if (log10Seconds < log10Day) return `${formatCompact(10 ** (log10Seconds - log10Hour))} hours`;
    if (log10Seconds < log10Year) return `${formatCompact(10 ** (log10Seconds - log10Day))} days`;

    const log10Years = log10Seconds - log10Year;
    if (log10Years < 3) return `${formatCompact(10 ** log10Years)} years`;
    if (log10Years < 6) return `${formatCompact(10 ** (log10Years - 3))} thousand years`;
    if (log10Years < 9) return `${formatCompact(10 ** (log10Years - 6))} million years`;
    if (log10Years < 12) return `${formatCompact(10 ** (log10Years - 9))} billion years`;
    return "more than a trillion years";
  }

  function setFeedback(items) {
    feedbackList.replaceChildren();
    items.forEach((message) => {
      const item = document.createElement("li");
      item.textContent = message;
      feedbackList.append(item);
    });
  }

  function resetAnalyzer() {
    strengthBar.style.width = "0%";
    strengthBar.style.background = colors["Very weak"];
    strengthLabel.textContent = "Waiting for a sample";
    strengthLabel.style.color = "";
    scoreOutput.textContent = "Score: --";
    lengthOutput.textContent = "--";
    entropyOutput.textContent = "--";
    crackOutput.textContent = "--";
    setFeedback(["Enter a sample to see the estimate."]);
  }

  function renderAnalysis() {
    const value = input.value;
    if (!value) {
      resetAnalyzer();
      return;
    }

    const result = analyzePassword(value);
    const color = colors[result.label];

    strengthBar.style.width = `${result.score}%`;
    strengthBar.style.background = color;
    strengthLabel.textContent = result.label;
    strengthLabel.style.color = color;
    scoreOutput.textContent = `Score: ${result.score}/100`;
    lengthOutput.textContent = String(value.length);
    entropyOutput.textContent = `${result.rawEntropy.toFixed(1)} bits`;
    crackOutput.textContent = formatResistance(result.effectiveEntropy);
    setFeedback(result.feedback);
  }

  function secureRandomIndex(maximum) {
    if (!Number.isSafeInteger(maximum) || maximum <= 0) {
      throw new RangeError("Maximum must be a positive safe integer.");
    }

    const range = 0x1_0000_0000;
    const limit = Math.floor(range / maximum) * maximum;
    const randomValue = new Uint32Array(1);

    do {
      crypto.getRandomValues(randomValue);
    } while (randomValue[0] >= limit);

    return randomValue[0] % maximum;
  }

  function choose(characters) {
    return characters[secureRandomIndex(characters.length)];
  }

  function generatePassword() {
    const groups = [
      "abcdefghijkmnopqrstuvwxyz",
      "ABCDEFGHJKLMNPQRSTUVWXYZ",
      "23456789",
      "!@#$%^&*_-+=?"
    ];
    const allCharacters = groups.join("");
    const characters = groups.map(choose);

    while (characters.length < 18) {
      characters.push(choose(allCharacters));
    }

    for (let index = characters.length - 1; index > 0; index -= 1) {
      const swapIndex = secureRandomIndex(index + 1);
      [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
    }

    return characters.join("");
  }

  input.addEventListener("input", renderAnalysis);

  toggle.addEventListener("click", () => {
    const shouldShow = input.type === "password";
    input.type = shouldShow ? "text" : "password";
    toggle.textContent = shouldShow ? "Hide" : "Show";
    toggle.setAttribute("aria-pressed", String(shouldShow));
  });

  generateButton.addEventListener("click", () => {
    input.value = generatePassword();
    input.type = "text";
    toggle.textContent = "Hide";
    toggle.setAttribute("aria-pressed", "true");
    renderAnalysis();
    input.focus();
    input.select();
  });

  clearButton.addEventListener("click", () => {
    input.value = "";
    input.type = "password";
    toggle.textContent = "Show";
    toggle.setAttribute("aria-pressed", "false");
    resetAnalyzer();
    input.focus();
  });

  resetAnalyzer();
}
