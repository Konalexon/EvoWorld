import Phaser from 'phaser';

export default class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
    }

    preload() {
        this.load.image('background', '/assets/background.png');
    }

    create() {
        // Background
        this.add.tileSprite(0, 0, window.innerWidth, window.innerHeight, 'background').setOrigin(0);

        // Title
        this.add.text(window.innerWidth / 2, 100, 'EvoWorld', {
            fontSize: '64px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Container for UI
        const domElement = this.add.dom(window.innerWidth / 2, window.innerHeight / 2).createFromHTML(`
            <div style="background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px; text-align: center; color: white; font-family: Arial;">
                <h2 style="margin-bottom: 20px;">Join the Garden</h2>
                <input type="text" id="nickname" placeholder="Enter Nickname" style="padding: 10px; width: 200px; margin-bottom: 10px; border-radius: 5px; border: none;">
                <br>
                <select id="server" style="padding: 10px; width: 220px; margin-bottom: 20px; border-radius: 5px; border: none;">
                    <option value="eu">Europe 1 (Recommended)</option>
                    <option value="us">US East</option>
                    <option value="asia">Asia Pacific</option>
                </select>
                <br>
                <button id="playBtn" style="padding: 10px 30px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 18px; font-weight: bold;">PLAY</button>
            </div>
        `);

        domElement.addListener('click');
        domElement.on('click', (event) => {
            if (event.target.id === 'playBtn') {
                const nickname = domElement.getChildByID('nickname').value;
                const server = domElement.getChildByID('server').value;

                if (nickname.trim() !== '') {
                    this.scene.start('GameScene', { nickname: nickname, server: server });
                } else {
                    alert('Please enter a nickname!');
                }
            }
        });
    }
}
