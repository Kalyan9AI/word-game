/* Missing Letters Game */
(function () {
  "use strict";

  const WORDS = [
    "planet","computer","puzzle","javascript","holiday","silence","picture","market","library","bottle",
    "garden","mountain","battery","window","pencil","friend","teacher","country","chocolate","blanket",
    "kitchen","balance","thunder","painter","diamond","fantasy","gravity","harvest","journey","lantern"
  ];

  const totalRounds = 10;
  let currentRound = 0;
  let currentWord = "";
  let missingIndices = [];
  let score = 0;
  let roundFinished = false;
  let availableWords = shuffle([...WORDS]);

  const maskedWordEl = document.getElementById("masked-word");
  const inputsEl = document.getElementById("inputs");
  const msgEl = document.getElementById("message");
  const scoreEl = document.getElementById("score");
  const roundInfoEl = document.getElementById("round-info");
  const fullGuessInput = document.getElementById("full-guess");

  const checkBtn = document.getElementById("check-btn");
  const revealBtn = document.getElementById("reveal-btn");
  const nextBtn = document.getElementById("next-btn");
  const restartBtn = document.getElementById("restart-btn");

  function shuffle(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function chooseMissingIndices(word) {
    const length = word.length;
    const numMissing = Math.min(3, Math.max(1, Math.floor(length / 4)));
    const positions = Array.from({ length }, (_, i) => i);
    const shuffled = shuffle(positions);
    const selected = [];
    for (let i = 0; i < shuffled.length && selected.length < numMissing; i += 1) {
      const idx = shuffled[i];
      if (idx !== 0 && idx !== length - 1) {
        selected.push(idx);
      }
    }
    if (selected.length === 0) selected.push(1 % length);
    selected.sort((a, b) => a - b);
    return selected;
  }

  function renderMaskedWord(word, holes) {
    maskedWordEl.innerHTML = "";
    const letters = word.split("");
    letters.forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = holes.includes(i) ? "_" : ch;
      maskedWordEl.appendChild(span);
    });
  }

  function renderInputs(word, holes) {
    inputsEl.innerHTML = "";
    holes.forEach((pos, idx) => {
      const slot = document.createElement("div");
      slot.className = "slot";

      const label = document.createElement("span");
      label.className = "label";
      label.textContent = `#${idx + 1} @ ${pos + 1}`;

      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "text";
      input.maxLength = 1;
      input.className = "letter";
      input.setAttribute("data-index", String(pos));
      input.setAttribute("aria-label", `Missing letter at position ${pos + 1}`);

      input.addEventListener("input", (e) => {
        const target = e.target;
        const value = (target.value || "").replace(/[^a-zA-Z]/g, "");
        target.value = value.toLowerCase();
        target.classList.remove("wrong", "correct");
        if (value.length === 1) focusNextInput(idx);
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value) {
          focusPrevInput(idx);
        }
      });

      slot.appendChild(label);
      slot.appendChild(input);
      inputsEl.appendChild(slot);
    });
  }

  function focusNextInput(currentIdx) {
    const next = inputsEl.querySelectorAll("input.letter")[currentIdx + 1];
    if (next) next.focus();
  }

  function focusPrevInput(currentIdx) {
    const prev = inputsEl.querySelectorAll("input.letter")[currentIdx - 1];
    if (prev) prev.focus();
  }

  function setMessage(text, type = "") {
    msgEl.textContent = text;
    msgEl.style.color = type === "error" ? "#ef4444" : type === "success" ? "#10b981" : "";
  }

  function updateScore() {
    scoreEl.textContent = `Score: ${score}`;
  }

  function updateRoundInfo() {
    roundInfoEl.textContent = `Round ${currentRound} of ${totalRounds}`;
  }

  function startRound() {
    if (availableWords.length === 0) {
      availableWords = shuffle([...WORDS]);
    }
    currentWord = availableWords.pop();
    missingIndices = chooseMissingIndices(currentWord);
    roundFinished = false;
    fullGuessInput.value = "";
    nextBtn.disabled = true;
    setMessage("");
    renderMaskedWord(currentWord, missingIndices);
    renderInputs(currentWord, missingIndices);
    const firstInput = inputsEl.querySelector("input.letter");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 30);
    } else {
      fullGuessInput.focus();
    }
  }

  function checkAnswer() {
    if (roundFinished) return;
    const guessWhole = (fullGuessInput.value || "").trim().toLowerCase();
    let correct = false;

    if (guessWhole) {
      correct = guessWhole === currentWord;
      if (!correct) {
        setMessage("Not quite. Check the full word and try again.", "error");
      }
    } else {
      const inputs = Array.from(inputsEl.querySelectorAll("input.letter"));
      if (inputs.length === 0) return; // nothing to fill
      let allFilled = true;
      let allCorrect = true;
      inputs.forEach((inp) => {
        const pos = Number(inp.getAttribute("data-index"));
        const val = (inp.value || "").toLowerCase();
        if (!val) allFilled = false;
        if (val === currentWord[pos]) {
          inp.classList.add("correct");
          inp.classList.remove("wrong");
        } else {
          inp.classList.add("wrong");
          inp.classList.remove("correct");
          allCorrect = false;
        }
      });
      if (!allFilled) {
        setMessage("Fill all missing letters.", "");
        return;
      }
      correct = allCorrect;
      if (!correct) setMessage("Some letters are wrong. Try again!", "error");
    }

    if (correct) {
      score += 1;
      updateScore();
      roundFinished = true;
      setMessage(`Correct! The word is "${currentWord}".`, "success");
      // reveal the full word visually
      renderMaskedWord(currentWord, []);
      nextBtn.disabled = false;
    }
  }

  function revealAnswer() {
    if (roundFinished) return;
    renderMaskedWord(currentWord, []);
    const inputs = Array.from(inputsEl.querySelectorAll("input.letter"));
    inputs.forEach((inp) => {
      const pos = Number(inp.getAttribute("data-index"));
      inp.value = currentWord[pos];
      inp.classList.remove("wrong");
      inp.classList.add("correct");
      inp.disabled = true;
    });
    setMessage(`Revealed. The word is "${currentWord}".`);
    roundFinished = true;
    nextBtn.disabled = false;
  }

  function nextRound() {
    if (currentRound >= totalRounds) {
      setMessage(`Game over! Final score: ${score}/${totalRounds}. Press Restart to play again.`);
      nextBtn.disabled = true;
      return;
    }
    currentRound += 1;
    updateRoundInfo();
    startRound();
  }

  function restartGame() {
    score = 0;
    currentRound = 1;
    availableWords = shuffle([...WORDS]);
    updateScore();
    updateRoundInfo();
    startRound();
    nextBtn.disabled = true;
    setMessage("");
  }

  // Events
  checkBtn.addEventListener("click", checkAnswer);
  revealBtn.addEventListener("click", revealAnswer);
  nextBtn.addEventListener("click", nextRound);
  restartBtn.addEventListener("click", restartGame);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (!nextBtn.disabled) nextRound();
      else checkAnswer();
    }
  });

  // Init
  restartGame();
})();
