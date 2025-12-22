// Game class is now global from game.js

// Popular baby boy names
const ENGLISH_BOY_NAMES = [
    'Liam', 'Noah', 'Oliver', 'Elijah', 'James',
    'William', 'Benjamin', 'Lucas', 'Henry', 'Theodore',
    'Jack', 'Levi', 'Alexander', 'Jackson', 'Mateo',
    // ... more names could be added
];

const SPANISH_BOY_NAMES = [
    'Mateo', 'Santiago', 'Sebastián', 'Matías', 'Diego',
    'Nicolás', 'Samuel', 'Alejandro', 'Daniel', 'David',
    'Lucas', 'Gabriel', 'Benjamín', 'Martín', 'Leonardo',
    // ... more names could be added
];

const TEXTS = {
    en: {
        tapToStart: 'Tap to Start!',
        helpTeddy: 'Help the teddy bear collect name balloons!',
        clickTap: 'Click/Tap to make the teddy bear fly!',
        scoreMessageOne: 'Great job! You scored 1 point! Share your favorite baby name ideas with us.',
        scoreMessageMany: (score) => `Great job! You scored ${score} points! Share your favorite baby name ideas with us.`,
        gameOverTitle: 'Oops! Nap time.',
        gameOverMessage: 'You hit a cloud! But look at all the names you found for the baby!',
        scoreLabel: 'Your Score',
        collectedNamesLabel: 'Collected Names:',
        playAgain: 'Play Again',
        saveNames: 'Save Names & Exit',
        formBadge: 'Baby Name Submission Form',
        formTitle: 'Help Us Name Our Little One!',
        formFooter: '❤️ P.S. Thank you all for being a part of our journey!',
        defaultScoreMessage: "We are so excited to welcome our baby into the world. Share your favorite baby name ideas with us!"
    },
    es: {
        tapToStart: '¡Toca para comenzar!',
        helpTeddy: '¡Ayuda al osito a recoger globos con nombres!',
        clickTap: '¡Haz clic/Toca para hacer volar al osito!',
        scoreMessageOne: '¡Gran trabajo! ¡Obtuviste 1 punto! Compártenos tus ideas de nombres favoritos.',
        scoreMessageMany: (score) => `¡Gran trabajo! ¡Obtuviste ${score} puntos! Compártenos tus ideas de nombres favoritos.`,
        gameOverTitle: '¡Ups! Hora de la siesta.',
        gameOverMessage: '¡Chocaste con una nube! ¡Pero mira todos los nombres que encontraste para el bebé!',
        scoreLabel: 'Tu Puntuación',
        collectedNamesLabel: 'Nombres Recopilados:',
        playAgain: 'Jugar de Nuevo',
        saveNames: 'Guardar Nombres y Salir',
        formBadge: 'Formulario de Envío de Nombres',
        formTitle: '¡Ayúdanos a Nombrar a Nuestro Pequeño!',
        formFooter: '❤️ P.D. ¡Gracias a todos por ser parte de nuestro viaje!',
        defaultScoreMessage: "Estamos muy emocionados de dar la bienvenida a nuestro bebé. ¡Compártenos tus ideas de nombres favoritos!"
    }
};

class App {
    constructor() {
        // Screens
        this.languageScreen = document.getElementById('language-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.nameFormScreen = document.getElementById('name-form-screen');

        // UI Elements
        this.canvas = document.getElementById('game-canvas');
        this.scoreDisplay = document.getElementById('final-score');
        this.collectedNamesList = document.getElementById('collected-names-list');
        this.collectedNamesContainer = document.getElementById('collected-names-container');
        this.formScoreMessage = document.getElementById('form-score-message');

        // Text Elements
        this.tapToStartText = document.getElementById('tap-to-start-text');
        this.helpTeddyText = document.getElementById('help-teddy-text');
        this.clickTapText = document.getElementById('click-tap-text');

        // New Text Elements
        this.gameOverTitle = document.getElementById('game-over-title');
        this.gameOverMessage = document.getElementById('game-over-message');
        this.scoreLabel = document.getElementById('score-label');
        this.collectedNamesLabel = document.getElementById('collected-names-label');
        this.btnPlayAgain = document.getElementById('btn-play-again');
        this.btnSaveNames = document.getElementById('btn-save-names');
        this.formBadge = document.getElementById('form-badge');
        this.formTitle = document.getElementById('form-title');
        this.formFooter = document.getElementById('form-footer');
        this.btnFormPlayAgain = document.getElementById('btn-form-play-again');

        // State
        this.language = 'en';
        this.game = null;
        this.lastScore = 0;

        this.bindEvents();

        // Check for saved language
        const savedLanguage = localStorage.getItem('teddyGameLang');
        if (savedLanguage) {
            this.selectLanguage(savedLanguage);
        }
    }

    bindEvents() {
        // Language Selection
        document.getElementById('lang-en').addEventListener('click', () => this.selectLanguage('en'));
        document.getElementById('lang-es').addEventListener('click', () => this.selectLanguage('es'));

        // Game Over Actions
        document.getElementById('btn-play-again').addEventListener('click', () => this.startGame());
        document.getElementById('btn-save-names').addEventListener('click', () => this.showNameForm());

        // Form Actions
        document.getElementById('btn-form-play-again').addEventListener('click', () => this.startGame());
    }

    selectLanguage(lang) {
        this.language = lang;
        localStorage.setItem('teddyGameLang', lang);
        this.updateTexts();
        this.startGame();
    }

    updateTexts() {
        const t = TEXTS[this.language];
        this.tapToStartText.textContent = t.tapToStart;
        this.helpTeddyText.textContent = t.helpTeddy;
        this.clickTapText.textContent = t.clickTap;

        this.gameOverTitle.textContent = t.gameOverTitle;
        this.gameOverMessage.textContent = t.gameOverMessage;
        this.scoreLabel.textContent = t.scoreLabel;
        this.collectedNamesLabel.textContent = t.collectedNamesLabel;
        this.btnPlayAgain.textContent = t.playAgain;
        this.btnSaveNames.textContent = t.saveNames;
        this.formBadge.textContent = t.formBadge;
        this.formTitle.textContent = t.formTitle;
        this.formFooter.textContent = t.formFooter;
        this.btnFormPlayAgain.textContent = t.playAgain;
    }

    showScreen(screen) {
        [this.languageScreen, this.gameScreen, this.gameOverScreen, this.nameFormScreen].forEach(s => {
            s.classList.remove('active');
            s.classList.add('hidden');
        });
        screen.classList.remove('hidden');
        screen.classList.add('active');
    }

    startGame() {
        this.showScreen(this.gameScreen);

        // Destroy previous game instance if exists
        if (this.game) {
            this.game.destroy();
        }

        const babyNames = this.language === 'en' ? ENGLISH_BOY_NAMES : SPANISH_BOY_NAMES;

        this.game = new TeddyBearGame(this.canvas, {
            babyNames,
            onGameOver: (score, collectedNames) => this.handleGameOver(score, collectedNames)
        });
    }

    handleGameOver(score, collectedNames) {
        this.lastScore = score;
        this.scoreDisplay.textContent = score;

        // Show collected names
        this.collectedNamesList.innerHTML = '';
        if (collectedNames && collectedNames.length > 0) {
            this.collectedNamesContainer.classList.remove('hidden');
            collectedNames.forEach(name => {
                const span = document.createElement('span');
                span.className = 'name-badge';
                span.innerHTML = `<span>❤️</span> ${name}`;
                this.collectedNamesList.appendChild(span);
            });
        } else {
            this.collectedNamesContainer.classList.add('hidden');
        }

        this.showScreen(this.gameOverScreen);
    }

    showNameForm() {
        const t = TEXTS[this.language];
        const score = this.lastScore;

        if (score === 1) {
            this.formScoreMessage.textContent = t.scoreMessageOne;
        } else if (score > 1) {
            this.formScoreMessage.textContent = t.scoreMessageMany(score);
        } else {
            this.formScoreMessage.textContent = t.defaultScoreMessage;
        }

        this.showScreen(this.nameFormScreen);
    }
}

// Initialize App
new App();
