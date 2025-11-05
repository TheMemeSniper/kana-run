import { hiraganaMonographs, hiraganaDigraphs, katakanaMonographs, katakanaDigraphs, katakanaTrigraphs } from "./modules/kana.js";

// the current kana set for the game
let currentKanaSet = hiraganaMonographs;
window.currentKanaSet = currentKanaSet;

// sounds
const correctSound = new Audio("./audio/correct.mp3");
const incorrectSound = new Audio("./audio/incorrect.mp3");

// main game elements
const kanaElement = document.getElementById("kana-container");
const kanaReader = document.getElementById("kana-reader");

const answerBox = document.getElementById("answer");
const answerContainer = document.getElementById("answers-container");
const answerClearButton = document.getElementById("answers-clear");

const scoreLabel = document.getElementById("score");
const totalCorrectLabel = document.getElementById("total-correct");
const accuracyLabel = document.getElementById("accuracy");

const kanaUpdateButton = document.getElementById("update-kana-sets");

// time trial elements
const startTimeTrialButton = document.getElementById("start-time-trial");
const timeTrialDurationInput = document.getElementById("time-trial-duration");
const timer = document.getElementById("timer");

const answerTemplate = document.createElement("li");
answerTemplate.classList.add("answer-item");
answerTemplate.textContent = "";

// misc
const erudaStartLink = document.getElementById("eruda-start");

// game state
let score = 0;
let totalQuestions = 0;
let correctAnswers = 0;
let lastCorrect = false;

function randomKana() {
    const keys = Object.keys(currentKanaSet);
    const h = keys[Math.floor(Math.random() * keys.length)];
    return h;
}

function question() {
    const kana = randomKana();
    kanaElement.textContent = kana;
    answerBox.value = "";
    let prepend = lastCorrect ? "Correct, " : "Incorrect, ";
    if (totalQuestions === 0) prepend = "";
    kanaReader.textContent = `${prepend}type: ${kana}`;
}

function waitForTyping() {
    return new Promise(resolve => {
        answerBox.addEventListener('keyup', resolve, { once: true });
    });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startTimeTrial() {
    resetGame();
    answerBox.setAttribute("readonly", "true");
    timer.classList.remove("hidden");
    timer.setAttribute("aria-hidden", "false");
    timer.textContent = `Get ready!`;
    await sleep(1000);

    let countdown = 4;
    const timerInterval = setInterval(() => {
        countdown--;
        timer.textContent = `${countdown}...`;
        if(countdown < 0) {
            timer.textContent = `Type!`;
            clearInterval(timerInterval);
        }
    }, 1000);

    await sleep(4000);
    answerBox.removeAttribute("readonly");
    answerBox.focus();
    await waitForTyping();
    timer.textContent = `Type!`;

    let timeLeft = parseInt(timeTrialDurationInput.value) || 60;
    timer.textContent = `Time left: ${timeLeft}s`;
    const interval = setInterval(() => {
        timeLeft--;
        timer.textContent = `Time left: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(interval);
            timer.textContent = "Time's up!";
            answerBox.setAttribute("readonly", "true");
        }
    }, 1000);
}

function checkAnswer() {
    const userAnswer = answerBox.value.trim();
    if (userAnswer === kanaElement.textContent) {
        correctSound.currentTime = 0;
        correctSound.play();
        const correctAnswer = answerTemplate.cloneNode();
        correctAnswer.textContent = `✅ ${userAnswer}`;
        correctAnswer.style.backgroundColor = "lightgreen";
        correctAnswer.setAttribute("aria-label", `Correct answer: ${userAnswer}`);
        answerContainer.prepend(correctAnswer);
        lastCorrect = true;
        setScore(score + 1);
        correctAnswers++;
    } else {
        incorrectSound.currentTime = 0;
        incorrectSound.play();
        const wrongAnswer = answerTemplate.cloneNode();
        wrongAnswer.textContent = `❌ ${userAnswer}:${kanaElement.textContent}・${currentKanaSet[kanaElement.textContent]}`;
        wrongAnswer.style.backgroundColor = "lightcoral";
        wrongAnswer.setAttribute("aria-label", `Incorrect, you answered: ${userAnswer}. Correct answer: ${kanaElement.textContent}, typed as ${currentKanaSet[kanaElement.textContent]}`);
        answerContainer.prepend(wrongAnswer);
        lastCorrect = false;
    }
    totalQuestions++;
    totalCorrectLabel.textContent = `${correctAnswers}/${totalQuestions} correct`;
    totalCorrectLabel.setAttribute("aria-label", `Total correct answers: ${correctAnswers} out of ${totalQuestions}`);
    const accuracy = ((correctAnswers / totalQuestions) * 100).toFixed(2);
    accuracyLabel.textContent = `Accuracy: ${accuracy}%`;
    question();
}

function resetGame() {
    totalCorrectLabel.textContent = "0/0 correct";
    totalCorrectLabel.setAttribute("aria-label", "Total correct answers: 0 out of 0");
    accuracyLabel.textContent = "Accuracy: 0%";
    correctAnswers = 0;
    totalQuestions = 0;
    setScore(0);
    answerContainer.innerHTML = "";
    answerBox.removeAttribute("readonly");
    timer.setAttribute("aria-hidden", "true");
    timer.classList.add("hidden");
    question();
}

function setScore(set) {
    score = set;
    scoreLabel.textContent = "Score: " + set;
}

function updateCharacterSets() {
    let updatedSet = {};
    const checkboxes = document.querySelectorAll('#kana-sets input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        console.log(checkbox.value, checkbox.checked, checkbox.id);
        if (checkbox.checked) {
            switch (checkbox.id) {
                case 'hiragana-monographs':
                    Object.assign(updatedSet, hiraganaMonographs);
                    break;
                case 'hiragana-digraphs':
                    Object.assign(updatedSet, hiraganaDigraphs);
                    break;
                case 'katakana-monographs':
                    Object.assign(updatedSet, katakanaMonographs);
                    break;
                case 'katakana-digraphs':
                    Object.assign(updatedSet, katakanaDigraphs);
                    break;
                case 'katakana-trigraphs':
                    Object.assign(updatedSet, katakanaTrigraphs);
                    break;
            }
        }
    });
    console.log("Updated kana set:", updatedSet);
    currentKanaSet = updatedSet;
    resetGame();
}

answerBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

answerClearButton.addEventListener("click", () => {
    resetGame();
});

startTimeTrialButton.addEventListener("click", () => {
    startTimeTrial();
});

kanaUpdateButton.addEventListener("click", () => {
    updateCharacterSets();
});

erudaStartLink.addEventListener("click", () => {
    eruda.init();
});

resetGame();

navigator.serviceWorker?.register('./sw.js');
