// src/styles/styleManager.js
export class StyleManager {
    static initializeStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .game-layout {
                display: flex;
                height: 90vh;
                width: 100%;
                gap: 20px;
            }

            .sidebar {
                width: 25%;
                min-width: 250px;
                max-width: 300px;
                background-color: #f8f3e9;
                border-right: 1px solid #d4c5b9;
                padding: 20px;
                box-sizing: border-box;
                overflow-y: auto;
            }

            .main-area {
                flex: 1;
                position: relative;
                padding: 20px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                min-width: 0;
                width: 100%;
                max-height: 100vh;
                overflow: hidden;
            }

            .center-area {
                position: relative;
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 0;
                padding: 10px 0;
                z-index: 1;
                overflow: visible;
                width: 100%;
            }

            .top-ai {
                position: relative;
                width: 100%;
                text-align: center;
                margin-bottom: 10px;
                z-index: 2;
            }
            
            .top-ai .card {
                margin: 0 -25px;
                transition: transform 0.2s;
                position: relative;
            }
            
            .top-ai .card:hover {
                transform: translateY(-20px);
                z-index: 3;
            }

            .side-ai-container {
                width: 15%;
                min-width: 100px;
                max-width: 140px;
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                z-index: 2;
            }

            .side-ai-info {
                position: absolute;
                width: 100%;
                text-align: center;
                z-index: 2;
            }

            .side-ai-cards {
                margin-top: 60px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .side-cards-wrapper {
                display: flex;
                justify-content: center;
                max-width: 100px;
                position: relative;
            }

            .hidden-card.overlapped {
                margin: -80px 0 0 0;
            }

            #trick-area {
                width: 100%;
                max-width: 800px;
                aspect-ratio: 16/9;
                border: 1px solid #d4c5b9;
                border-radius: 12px;
                margin: 0 auto;
                position: relative;
                z-index: 2;
                background-color: rgba(248, 243, 233, 0.5);
            }

            #card-slot {
                display: none;
                position: absolute;
                left: 50%;
                bottom: 10px;
                transform: translateX(-50%);
                width: 100px;
            }

            .player-area {
                position: relative;
                margin-top: 10px;
                text-align: center;
                width: 100%;
            }

            #player-hand {
                display: flex;
                justify-content: center;
                gap: 5px;
                margin-top: 10px;
            }

            #player-hand .card {
                margin: 0 -15px;
                transition: transform 0.2s;
            }

            #player-hand .card:hover {
                transform: translateY(-20px);
                z-index: 3;
            }

            .score-table {
                width: 100%;
                border-collapse: collapse;
            }

            .score-table th {
                position: sticky;
                top: 0;
                background-color: #f8f9fa;
                z-index: 1;
            }

            .score-table td, .score-table th {
                padding: 8px;
                border: 1px solid #ddd;
            }

            button {
                background-color: #6b4d3c;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-family: 'Crimson Text', Georgia, serif;
            }

            button:hover {
                background-color: #2c1810;
            }

            input[type="number"] {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-right: 10px;
            }

            #floating-card {
                pointer-events: none;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            }

            .speed-control {
                margin-top: 20px;
                padding: 15px;
                border-top: 1px solid #d4c5b9;
            }
            
            .speed-slider {
                width: 100%;
                margin: 10px 0;
            }
            
            .speed-label {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }

            @media (max-width: 1024px) {
                .game-layout {
                    flex-direction: column;
                }
                .sidebar {
                    width: 100%;
                    max-width: none;
                    border-right: none;
                    border-bottom: 1px solid #d4c5b9;
                }
                .main-area {
                    height: 70vh;
                }
            }
        `;
        document.head.appendChild(style);
    }
}