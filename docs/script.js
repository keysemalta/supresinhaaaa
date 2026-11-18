/* =========================================================
   1) ESTADO E CONFIGURAÇÕES
   ========================================================= */
const state = { main: false, side: false };

const TOTAL_BRICKS = 300;   // quantidade de tijolos no muro
const BRICK_GOAL = 10;      // quantos precisa transmutar para completar a quest

// SENHA DO BAÚ em base64. Para trocar: no console (F12) digite btoa("novasenha")
// e cole o resultado aqui. (Não é segurança de verdade, só esconde a palavra.)
const SECRET = "Y2hhdmVpcmluaG8=";

// Frases do alquimista: TROQUE por frases suas, bem pessoais!
const phrases = [
  "Este tijolo agora é ouro puro. Assim como você.",
  "Mais um muro que cai. Você merece coisas boas.",
  "Cuidado: ouro demais pode causar autoestima elevada.",
  "Você falou mal de si? O alquimista discorda.",
  "Esse aqui virou ouro por causa da sua bondade.",
  "Lembre-se: quem joga tijolo também sabe construir ponte."
];

// Dados dos tooltips das recompensas (a chave bate com data-item no HTML)
const ITEMS = {
  lamina: {
    name: "Lâmina da Determinação",
    rarity: "epic",
    label: "Épico",
    bind: "Une-se ao ser pego",
    stats: ["+99 Persistência", "+50 Coragem"],
    text: "Forjada para alguém que se recusa a abandonar seus sonhos. Mesmo quando os caminhos são difíceis, você continua avançando, aprendendo e construindo seu próprio destino. Admiro a sua determinação e mal posso esperar para ver o mundo que você ainda vai criar."
  },
  essencia: {
    name: "Essência do Coração Gentil",
    rarity: "rare",
    label: "Raro",
    bind: "",
    stats: ["+80 Gentileza", "+40 Empatia"],
    text: "Há uma beleza rara na maneira como você enxerga e acolhe as pessoas. Sua bondade, sua generosidade e seu cuidado tornam o mundo um lugar melhor. Se existe algo que eu amo profundamente em você, é o seu coração."
  },
  gema: {
    name: "Gema do Encanto Eterno",
    rarity: "legendary",
    label: "Lendário",
    bind: "",
    stats: ["Equipar: ilumina qualquer ambiente."],
    text: "Dizem que algumas luzes são capazes de afastar até a mais longa escuridão. A sua é o seu sorriso. Não importa onde ou como esteja o dia, basta ver você sorrir para tudo ficar mais bonito."
  }
};

/* =========================================================
   2) ELEMENTOS DO HTML
   ========================================================= */
const bgm = document.getElementById("bgm");
const screenHome = document.getElementById("screen-home");
const screenLogin = document.getElementById("screen-login");
const startBtn = document.getElementById("start");
const loginForm = document.getElementById("login-form");
const accountInput = document.getElementById("account");
const game = document.getElementById("game");
const tracker = document.getElementById("tracker");

const banner = document.getElementById("banner");
const bannerTitle = document.getElementById("banner-title");
const bannerSub = document.getElementById("banner-sub");
const tip = document.getElementById("tooltip");

const mainObjectives = document.querySelectorAll("#main-objectives .objective");
const mainButton = document.getElementById("main-complete");
const cancelButton = document.getElementById("quest-cancel");
const closeButton = document.getElementById("quest-close");
const rewards = document.querySelectorAll(".reward");
const sideQuest = document.getElementById("side-quest");

const wall = document.getElementById("wall");
const brickCount = document.getElementById("brick-count");
const brickObjective = document.getElementById("brick-objective");
const brickPhrase = document.getElementById("brick-phrase");
const brickAll = document.getElementById("brick-all");

const chest = document.getElementById("chest");
const chestHint = document.getElementById("chest-hint");
const claim = document.getElementById("claim");

const gate = document.getElementById("gate");
const gateForm = document.getElementById("gate-form");
const gateInput = document.getElementById("gate-input");
const gateError = document.getElementById("gate-error");

const letterModal = document.getElementById("letter-modal");
const letterClose = document.getElementById("letter-close");

/* =========================================================
   3) INTRO: HOME → LOGIN → JOGO (transições suaves)
   ========================================================= */

// Clicar em Start: começa a música, some a home e aparece o login
startBtn.addEventListener("click", function () {
  // navegadores só deixam tocar áudio depois de um clique, por isso é aqui
  bgm.volume = 0.35;
  bgm.play().catch(function () { /* sem arquivo de música: segue sem som */ });

  screenHome.classList.remove("active");
  setTimeout(function () {
    screenLogin.classList.add("active");
    setTimeout(() => accountInput.focus({ preventScroll: true }), 150);
  }, 700);
});

// Clicar em Login (ou Enter): aceita QUALQUER nome e senha
loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  screenLogin.classList.remove("active");

  setTimeout(function () {
    game.hidden = false;
    tracker.hidden = false;
    game.classList.add("fade-in");
    document.body.classList.remove("locked");   // libera a rolagem
    window.scrollTo(0, 0);
  }, 800);
});

// Tecla M liga/desliga o som (fora dos campos de texto)
document.addEventListener("keydown", function (e) {
  if ((e.key === "m" || e.key === "M") && e.target.tagName !== "INPUT") {
    bgm.muted = !bgm.muted;
  }
});

/* =========================================================
   4) FUNÇÕES REUTILIZÁVEIS
   ========================================================= */

// Banner dourado de "Missão Concluída"
function showBanner(title, sub) {
  bannerTitle.textContent = title;
  bannerSub.textContent = sub;
  banner.classList.remove("show");
  void banner.offsetWidth;          // força o navegador a reiniciar a animação
  banner.classList.add("show");
}

// Marca uma quest como concluída (usada pelas duas quests)
function completeQuest(key, questName) {
  if (state[key]) return;
  state[key] = true;

  // a missão principal não tem "!", só a secundária
  const marker = document.querySelector(`[data-marker="${key}"]`);
  if (marker) {
    marker.textContent = "✔";
    marker.classList.add("done");
  }

  document.querySelector(`.tracker [data-q="${key}"]`).classList.add("done");

  showBanner("Missão Concluída", questName);
  checkChest();
}

// Quando as DUAS quests terminam, mostra o painel da senha
function checkChest() {
  if (state.main && state.side) {
    gate.hidden = false;
    chestHint.textContent = "Uma runa sela o baú. Diga a palavra certa para abri-lo.";
    setTimeout(() => gate.scrollIntoView({ behavior: "smooth", block: "center" }), 3300);
  }
}

/* =========================================================
   5) MAIN QUEST: objetivos, recompensas e botões
   ========================================================= */
mainObjectives.forEach(function (obj) {
  obj.addEventListener("click", function () {
    if (state.main) return;                 // depois de entregar, não muda mais
    obj.classList.toggle("done");

    const allDone = [...mainObjectives].every(o => o.classList.contains("done"));
    mainButton.disabled = !allDone;
  });
});

// Clicar numa recompensa só liga/desliga o destaque dourado
rewards.forEach(function (reward) {
  reward.addEventListener("click", function () {
    if (state.main) return;
    reward.classList.toggle("selected");
  });
});

// Complete Quest: todas as recompensas são "resgatadas" de uma vez
mainButton.addEventListener("click", function () {
  rewards.forEach(r => r.classList.add("selected", "claimed"));
  mainButton.disabled = true;
  completeQuest("main", "Beyond the Horizon");

  // depois do banner, desce suavemente para a missão secundária
  setTimeout(() => sideQuest.scrollIntoView({ behavior: "smooth" }), 3000);
});

// Cancel e X: brincadeira, a missão não pode ser abandonada
function tryCancel() {
  if (state.main) return;
  showBanner("Missão Indisponível", "Um verdadeiro herói não abandona a sua jornada!");
}
cancelButton.addEventListener("click", tryCancel);
closeButton.addEventListener("click", tryCancel);

/* =========================================================
   6) TOOLTIPS DAS RECOMPENSAS
   ========================================================= */
function showTip(key) {
  const it = ITEMS[key];
  const stats = it.stats.map(s => `<span class="stat">${s}</span>`).join("");
  tip.innerHTML =
    `<strong class="${it.rarity}">${it.name}</strong>` +
    `<span>${it.label}</span>` +
    (it.bind ? `<span>${it.bind}</span>` : "") +
    stats +
    `<span class="flavor">${it.text}</span>`;
  tip.hidden = false;
}

// põe o tooltip perto de (x, y) sem deixar sair da tela
function moveTip(x, y) {
  const pad = 18;
  const box = tip.getBoundingClientRect();
  let left = x + pad;
  let top = y + pad;
  if (left + box.width > window.innerWidth - 8) left = x - box.width - pad;
  if (top + box.height > window.innerHeight - 8) top = window.innerHeight - box.height - 8;
  tip.style.left = Math.max(8, left) + "px";
  tip.style.top = Math.max(8, top) + "px";
}

rewards.forEach(function (reward) {
  const key = reward.dataset.item;

  reward.addEventListener("mouseenter", function (e) { showTip(key); moveTip(e.clientX, e.clientY); });
  reward.addEventListener("mousemove", function (e) { moveTip(e.clientX, e.clientY); });
  reward.addEventListener("mouseleave", function () { tip.hidden = true; });

  // teclado (Tab) e toque no celular
  reward.addEventListener("focus", function () {
    showTip(key);
    const r = reward.getBoundingClientRect();
    moveTip(r.left + r.width / 2, r.bottom);
  });
  reward.addEventListener("blur", function () { tip.hidden = true; });
});

/* =========================================================
   7) QUEST SECUNDÁRIA: muro de tijolos
   ========================================================= */
let goldCount = 0;

for (let i = 0; i < TOTAL_BRICKS; i++) {
  const brick = document.createElement("div");
  brick.className = "brick";
  wall.appendChild(brick);
}

function updateBrickUI() {
  brickCount.textContent = `Tijolos transmutados: ${goldCount} / ${TOTAL_BRICKS}`;
  const shown = Math.min(goldCount, BRICK_GOAL);
  brickObjective.textContent = `Transmutar tijolos em ouro (${shown}/${BRICK_GOAL})`;
  if (goldCount >= BRICK_GOAL) brickObjective.classList.add("done");
}

function turnGold(brick) {
  if (brick.classList.contains("gold")) return;
  brick.classList.add("gold");
  goldCount++;
  updateBrickUI();
  if (goldCount >= BRICK_GOAL) completeQuest("side", "O Muro de Tijolos");
}

// um único "ouvinte" no muro cuida de todos os tijolos (delegação de eventos)
wall.addEventListener("click", function (event) {
  if (!event.target.classList.contains("brick")) return;
  if (event.target.classList.contains("gold")) return;

  turnGold(event.target);

  const random = phrases[Math.floor(Math.random() * phrases.length)];
  brickPhrase.textContent = random;
  brickPhrase.classList.remove("fade");
  void brickPhrase.offsetWidth;
  brickPhrase.classList.add("fade");
});

brickAll.addEventListener("click", function () {
  const all = wall.querySelectorAll(".brick:not(.gold)");
  all.forEach(function (brick, index) {
    setTimeout(() => turnGold(brick), index * 12);
  });
  brickPhrase.textContent = "Todo o muro virou ouro. Isso é o que eu vejo em você.";
  brickAll.disabled = true;
});

/* =========================================================
   8) BAÚ, SENHA E CARTA
   ========================================================= */
let opened = false;
let gateOpen = false;

// limpa o texto digitado: sem espaços, sem acento, minúsculo
function normalize(text) {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "");
}

gateForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (btoa(normalize(gateInput.value)) === SECRET) {
    gateOpen = true;
    gateError.textContent = "";
    gate.hidden = true;
    chest.classList.remove("locked");
    chest.classList.add("unlocked");
    chestHint.textContent = "A runa se desfez... O baú está se abrindo!";
    showBanner("Baú Destrancado", "A palavra certa foi dita");
    setTimeout(tryClaim, 1800);
  } else {
    gateError.textContent = "A runa não reage. Tente lembrar com mais carinho...";
    gateInput.classList.remove("shake");
    void gateInput.offsetWidth;
    gateInput.classList.add("shake");
    gateInput.select();
  }
});

function tryClaim() {
  if (!(state.main && state.side)) {
    chest.classList.add("shake");
    setTimeout(() => chest.classList.remove("shake"), 400);
    chestHint.textContent = "Trancado! Faltam missões: complete a principal e a secundária.";
    return;
  }

  if (!gateOpen) {
    chest.classList.add("shake");
    setTimeout(() => chest.classList.remove("shake"), 400);
    chestHint.textContent = "A runa selada impede. Descubra a senha.";
    gateInput.focus();
    return;
  }

  if (!opened) {
    opened = true;
    chest.classList.remove("unlocked");
    chest.classList.add("open");
    claim.textContent = "Ler a Carta Novamente";
    setTimeout(openLetter, 1100);
  } else {
    openLetter();
  }
}

function openLetter() { letterModal.classList.add("open"); }
function closeLetter() { letterModal.classList.remove("open"); }

chest.addEventListener("click", tryClaim);
claim.addEventListener("click", tryClaim);
chest.addEventListener("keydown", e => { if (e.key === "Enter") tryClaim(); });

letterClose.addEventListener("click", closeLetter);
letterModal.addEventListener("click", e => { if (e.target === letterModal) closeLetter(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeLetter(); });

/* =========================================================
   9) SEÇÕES APARECEM SUAVEMENTE AO ROLAR
   ========================================================= */
const observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
