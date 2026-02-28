import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import GameScene from '../game/GameScene.js';

const PhaserGame = () => {
    const gameRef = useRef(null);

    useEffect(() => {
        if (!gameRef.current) {
            const config = {
                type: Phaser.AUTO,
                width: 1100,
                height: 640,
                backgroundColor: '#90c978',
                parent: 'game-container',
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH
                },
                input: {
                    activePointers: 3
                },
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { y: 0 },
                        debug: false
                    }
                },
                scene: [GameScene]
            };

            gameRef.current = new Phaser.Game(config);
        }

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return <div id="game-container" style={{ width: '100dvw', height: '100dvh', backgroundColor: '#000' }} />;
};

export default PhaserGame;
