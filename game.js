class MonkeyLetterGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.instructions = document.getElementById('instructions');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        
        // Game states
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        
        // Game configuration - balanced for good gameplay
        this.config = {
            monkey: {
                width: 60,
                height: 60,
                speed: 4, // Moderate speed - not too fast
                color: '#8B4513'
            },
            letter: {
                width: 30,
                height: 30,
                speed: 1.5, // Slower falling speed for better gameplay
                spawnRate: 0.004, // Even lower spawn rate (roughly every 12-15 seconds at 60fps)
                maxLetters: 5, // Limit letters on screen to avoid overwhelming
                fontSize: 24,
                color: '#FF4500'
            },
            ground: {
                height: 100
            },
            points: {
                perLetter: 3
            }
        };
        
        // Game objects
        this.monkey = {
            x: this.canvas.width / 2 - this.config.monkey.width / 2,
            y: this.canvas.height - this.config.ground.height - this.config.monkey.height,
            width: this.config.monkey.width,
            height: this.config.monkey.height
        };
        
        this.letters = [];
        this.keys = {};
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.gameTime = 0;
        
        // Available letters
        this.availableLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        
        this.initializeEventListeners();
        this.gameLoop();
    }
    
    initializeEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameState === 'start' || this.gameState === 'gameOver') {
                    this.startGame();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.letters = [];
        this.monkey.x = this.canvas.width / 2 - this.config.monkey.width / 2;
        this.instructions.classList.add('hidden');
        this.updateUI();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.instructions.classList.remove('hidden');
        this.instructions.innerHTML = `
            <h2>Game Over!</h2>
            <p>Pontuação Final: ${this.score}</p>
            <p><strong>Pressione ESPAÇO para jogar novamente</strong></p>
        `;
    }
    
    updateMonkey() {
        if (this.gameState !== 'playing') return;
        
        // Horizontal movement with smooth controls
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.monkey.x -= this.config.monkey.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            this.monkey.x += this.config.monkey.speed;
        }
        
        // Keep monkey within bounds
        if (this.monkey.x < 0) {
            this.monkey.x = 0;
        }
        if (this.monkey.x > this.canvas.width - this.monkey.width) {
            this.monkey.x = this.canvas.width - this.monkey.width;
        }
    }
    
    spawnLetter() {
        if (this.gameState !== 'playing') return;
        if (this.letters.length >= this.config.letter.maxLetters) return;
        
        // Spawn letters at a balanced rate
        if (Math.random() < this.config.letter.spawnRate) {
            const letter = {
                x: Math.random() * (this.canvas.width - this.config.letter.width),
                y: -this.config.letter.height,
                width: this.config.letter.width,
                height: this.config.letter.height,
                char: this.availableLetters[Math.floor(Math.random() * this.availableLetters.length)],
                speed: this.config.letter.speed + (this.gameTime * 0.00005) // Very gradual speed increase
            };
            this.letters.push(letter);
        }
    }
    
    updateLetters() {
        if (this.gameState !== 'playing') return;
        
        for (let i = this.letters.length - 1; i >= 0; i--) {
            const letter = this.letters[i];
            letter.y += letter.speed;
            
            // Check if letter hit the ground
            if (letter.y + letter.height >= this.canvas.height - this.config.ground.height) {
                this.letters.splice(i, 1);
                this.lives--;
                this.updateUI();
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
                continue;
            }
            
            // Check collision with monkey
            if (this.checkCollision(this.monkey, letter)) {
                this.letters.splice(i, 1);
                this.score += this.config.points.perLetter;
                this.updateUI();
                this.playCollectSound();
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    playCollectSound() {
        // Simple audio feedback using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio not supported, silent fail
        }
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = this.lives;
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(0, this.canvas.height - this.config.ground.height, this.canvas.width, this.config.ground.height);
        
        // Draw monkey
        this.ctx.fillStyle = this.config.monkey.color;
        this.ctx.fillRect(this.monkey.x, this.monkey.y, this.monkey.width, this.monkey.height);
        
        // Draw simple monkey face
        this.ctx.fillStyle = '#F4A460';
        this.ctx.fillRect(this.monkey.x + 10, this.monkey.y + 10, this.monkey.width - 20, this.monkey.height - 20);
        
        // Eyes
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(this.monkey.x + 15, this.monkey.y + 15, 8, 8);
        this.ctx.fillRect(this.monkey.x + 37, this.monkey.y + 15, 8, 8);
        
        // Mouth
        this.ctx.beginPath();
        this.ctx.arc(this.monkey.x + 30, this.monkey.y + 35, 8, 0, Math.PI);
        this.ctx.stroke();
        
        // Draw letters
        this.ctx.font = `${this.config.letter.fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (const letter of this.letters) {
            // Letter background
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(letter.x, letter.y, letter.width, letter.height);
            
            // Letter border
            this.ctx.strokeStyle = this.config.letter.color;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(letter.x, letter.y, letter.width, letter.height);
            
            // Letter text
            this.ctx.fillStyle = this.config.letter.color;
            this.ctx.fillText(
                letter.char,
                letter.x + letter.width / 2,
                letter.y + letter.height / 2
            );
        }
    }
    
    update() {
        if (this.gameState === 'playing') {
            this.gameTime++;
            this.spawnLetter();
            this.updateMonkey();
            this.updateLetters();
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new MonkeyLetterGame();
});