import Phaser from 'phaser';
import LobbyScene from './LobbyScene.js';
import GameScene from './game.js';

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#2d2d2d',
    parent: 'app',
    dom: {
        createContainer: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [LobbyScene, GameScene]
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
