import React from 'react';
import PhaserGame from './components/PhaserGame';
import './App.css';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>Hilltop Rampage v1.2 (Multi-Touch)</h1>
            </header>
            <main>
                <PhaserGame />
            </main>
            <footer>
                <p>Press TAB for Shop | WASD to Move | SPACE to Shoot</p>
            </footer>
        </div>
    );
}

export default App;
