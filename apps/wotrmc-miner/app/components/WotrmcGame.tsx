'use client';

import Image from 'next/image';
import { useState } from 'react';
import styles from './wotrmcgame.module.css';
import useGameStorage from '../util/our-game-state';

type FloatingText = {
  id: number;
  x: number;
  y: number;
  text?: string;
  image?: string;
  offsetX: number;
  rotation: number;
  color?: string;
};

export function WotrmcGame() {
  const comicWords = ['Pow', 'Bing', "Bop", "Boom", "Bam"];
  const maxHits = 10;

  const [gameState, setGameState] = useGameStorage();

  const [activeTab, setActiveTab] = useState('actions');
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [nextId, setNextId] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  function showFloatingText(e: React.MouseEvent, text?: string, color: string = '#FFFFFF', image?: string) {
    const newText: FloatingText = {
      id: nextId,
      x: e.clientX,
      y: e.clientY,
      text: text,
      offsetX: Math.random() * 100 - 50,
      rotation: Math.random() * 30 - 15,
      color: color,
      image: image
    };

    setFloatingTexts([...floatingTexts, newText]);
    setNextId(nextId + 1);

    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== newText.id));
    }, 2000);
  }

  function hitTree(e: React.MouseEvent) {
    if (isAnimating) return;

    let woodHitVal = 1;
    if (gameState.equippedTool === 'wooden_axe') {
      const chance10 = Math.random() < 0.10;
      if (chance10) {
        woodHitVal = 2;
      }
    }

    const newWoodHit = gameState.woodHit + woodHitVal;

    if (newWoodHit >= maxHits) {
      setIsAnimating(true);
      setGameState(prev => ({
        ...prev,
        wood: prev.wood + 1,
        woodHit: 0
      }));
      showFloatingText(e, '+1 Wood', '#FFD700', '/images/log.png');

      setTimeout(() => {
        if (newWoodHit > maxHits) {
          const diff = newWoodHit - maxHits;
          setGameState(prev => ({ ...prev, woodHit: diff }));
        }
        setIsAnimating(false);
      }, 100);
    } else {
      setGameState(prev => ({ ...prev, woodHit: newWoodHit }));
      const random = Math.floor(Math.random() * comicWords.length);
      const word = comicWords[random];
      showFloatingText(e, woodHitVal > 1 ? word + '! (bonus)' : word + '!', woodHitVal > 1 ? '#4169E1' : '#FFFFFF');
    }
  }

  function sellWood(e: React.MouseEvent) {
    if (gameState.wood >= 10) {
      setGameState(prev => ({
        ...prev,
        wood: prev.wood - 10,
        coins: prev.coins + 5
      }));

      // Spawn coins with delays
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          showFloatingText(e, '', '#FFFFFF', '/images/coin_1.png');
        }, i * 100);
      }
    }
  }

  function craftPlanks(e: React.MouseEvent) {
    if (gameState.wood >= 10) {
      setGameState(prev => ({
        ...prev,
        wood: prev.wood - 10,
        planks: prev.planks + 2
      }));
      showFloatingText(e, '+2 Planks', '#FFFFFF', '/images/planks.png');
    }
  }

  function craftSticks(e: React.MouseEvent) {
    if (gameState.planks >= 2) {
      setGameState(prev => ({
        ...prev,
        planks: prev.planks - 2,
        sticks: prev.sticks + 4
      }));

      // Spawn 4 sticks at cursor position in rapid succession
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          showFloatingText(e, '', '#FFFFFF', '/images/stick.png');
        }, i * 50);
      }
    }
  }

  function craftEquipWoodenAxe(e: React.MouseEvent) {
    if (gameState.planks >= 2 && gameState.sticks >= 2) {
      setGameState(prev => ({
        ...prev,
        planks: prev.planks - 2,
        sticks: prev.sticks - 2,
        equippedTool: 'wooden_axe'
      }));

      // Spawn 4 axes at cursor position in rapid succession
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          showFloatingText(e, '', '#FFFFFF', '/images/wooden_axe.png');
        }, i * 50);
      }
    }
  }

  function upgradeAdd(e: React.MouseEvent, upgrade: string) {
    if (upgrade === 'lucky_number_sticks' && gameState.coins >= 10) {
      setGameState(prev => ({
        ...prev,
        coins: prev.coins - 10
      }));
      //TODO - Drewyor: Add the upgrade logic, we will store as 'upgradeType', then a 'level' to multiple that value
      //      sticks, 1 = 10% chance for 1 free stick on wood fell
      //      sticks, 2 = 10% chance for 1 extra strick on crafting
      showFloatingText(e, 'Upgrade Purchased!', '#FFD700');
    }
  }

  function restartGame() {
    if (confirm('Are you sure you want to restart? All progress will be lost!')) {
      // Clear localStorage
      localStorage.removeItem('wotrmcGameState');

      // Reset state to defaults
      setGameState({
        wood: 0,
        woodHit: 0,
        planks: 0,
        sticks: 0,
        coins: 0,
        equippedTool: 'hands'
      });

      // Optional: Show feedback
      alert('Game restarted successfully!');
    }
  }

  const progress = (gameState.woodHit / maxHits) * 100;
  const isComplete = gameState.woodHit === maxHits;

  return (
    <div className={styles.container}>

      {/* Floating Texts */}
      {floatingTexts.map(ft => (
        <div
          key={ft.id}
          className={styles.floatingText}
          style={{
            left: ft.x,
            top: ft.y,
            color: ft.color,
            animation: `float-up-${ft.id} 2s ease-out forwards`
          }}
        >
          {ft.image ? (
            <Image
              src={ft.image}
              alt="Resource"
              width={32}
              height={32}
              style={{display: 'block'}}
            />
          ) : (
            ft.text
          )}

          <style jsx>{`
            @keyframes float-up-${ft.id} {
              0% {
                transform: translate(0, 0) rotate(0deg);
                opacity: 1;
              }
              100% {
                transform: translate(${ft.offsetX}px, -150px) rotate(${ft.rotation}deg);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      ))}

      {/* Sidebar */}
      <div className={styles.sidebar}>
        <h2>🌲 Wood Empire</h2>
        <div className={styles.resources}>
          <h3>Resources</h3>
          <p>
            <Image src="/images/coin_1.png" alt="Coins" width={32} height={32} style={{display: 'inline', marginRight: '8px'}} />
            Coins: {gameState.coins}
          </p>
          ------------
          <p>
            <Image src="/images/log.png" alt="Wood" width={16} height={16} style={{display: 'inline', marginRight: '8px'}} />
            Wood: {gameState.wood}
          </p>
          <p>
            <Image src="/images/planks.png" alt="Planks" width={16} height={16} style={{display: 'inline', marginRight: '8px'}} />
             Planks: {gameState.planks}
          </p>
          <p>
            <Image src="/images/stick.png" alt="Sticks" width={16} height={16} style={{display: 'inline', marginRight: '8px'}} />
            Sticks: {gameState.sticks}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.main}>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab('actions')}
            className={activeTab === 'actions' ? `${styles.tabActive} ${styles.actions}` : styles.tab}
          >
            Actions
          </button>
          <button
            onClick={() => setActiveTab('crafting')}
            className={activeTab === 'crafting' ? `${styles.tabActive} ${styles.crafting}` : styles.tab}
          >
            Crafting
          </button>
          <button
            onClick={() => setActiveTab('upgrades')}
            className={activeTab === 'upgrades' ? `${styles.tabActive} ${styles.upgrades}` : styles.tab}
          >
            Upgrades
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>

          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <div>
              <h2>⚒️ Actions</h2>
              <button
                onClick={hitTree}
                disabled={isAnimating}
                className={`${styles.btn} ${styles.btnGreen} ${styles.btnProgress} ${gameState.equippedTool === 'wooden_axe' ? styles.cursorToolWoodAxe : ''}`}>
                <div
                  className={`${styles.progressFill} ${isComplete ? styles.progressFillComplete : ''}`}
                  style={{ width: `${progress}%`}}
                />
                <span className={styles.btnContent}>
                  <Image src="/images/tree.png" alt="Tree" width={32} height={32} style={{display: 'inline', marginBottom: '8px'}} />
                  Hit Tree
                  <div className={styles.btnHint}>
                    {gameState.woodHit}/{maxHits} hits → +1 wood
                  </div>
                </span>
              </button>
              <button
                onClick={sellWood}
                disabled={gameState.wood < 10}
                className={`${styles.btn} ${gameState.wood >= 10 ? styles.btnOrange : styles.btnGray}`}
              >
                <Image src="/images/coin_1.png" alt="Tree" width={32} height={32} style={{display: 'inline', marginRight: '8px'}} />
                Sell Wood
                <div className={styles.btnHint}>
                  {gameState.wood >= 10 ? '10 wood → 5 coins' : 'Need ' + (10 - gameState.wood) + ' wood - 10 in total'}
                </div>
              </button>
            </div>
          )}

          {/* Crafting Tab */}
          {activeTab === 'crafting' && (
            <div>
              <h2>🔨 Crafting</h2>

              <button
                onClick={craftPlanks}
                disabled={gameState.wood < 10}
                className={`${styles.btn} ${gameState.wood >= 10 ? styles.btnBlue : styles.btnGray}`}
              >
                <Image src="/images/planks.png" alt="Planks" width={32} height={32} style={{display: 'inline', marginRight: '8px'}} />
                Craft Planks
                <div className={styles.btnHint}>
                  {gameState.wood >= 10 ? '10 wood → 2 planks' : 'Need ' + (10 - gameState.wood) + ' wood - 10 in total'}
                </div>
              </button>

              <button
                onClick={craftSticks}
                disabled={gameState.planks < 2}
                className={`${styles.btn} ${gameState.planks >= 2 ? styles.btnPurple : styles.btnGray}`}
              >
                <Image src="/images/stick.png" alt="Sticks" width={32} height={32} style={{display: 'inline', marginBottom: '8px'}} />
                Craft Sticks
                <div className={styles.btnHint}>
                  {gameState.planks >= 2 ? '2 planks → 4 sticks' : 'Need ' + (2 - gameState.planks) + ' planks - 2 in total'}
                </div>
              </button>

              <button
                onClick={craftEquipWoodenAxe}
                disabled={gameState.planks < 2 || gameState.sticks < 2}
                className={`${styles.btn} ${gameState.planks >= 2 && gameState.sticks >= 2 ? styles.btnBrown : styles.btnGray}`}
              >
                <Image src="/images/wooden_axe.png" alt="Wooden Axe" width={32} height={32} style={{display: 'inline', marginBottom: '8px'}} />
                Craft and Equip Wooden Axe
                <div className={styles.btnHint}>
                  {gameState.planks >= 2 && gameState.sticks >= 2 ? '2 planks & 2 Sticks → 1 Wooden Axe' : 'Need ' + Math.max(0, 2 - gameState.planks) + ' planks and ' + Math.max(0, 2 - gameState.sticks) + ' sticks'}
                </div>
                <div className={styles.btnHint}>
                  When crafted, instantly equips to give 10% chance to do 1 extra damage to a tree
                </div>
              </button>
            </div>
          )}

          {/* Upgrades Tab */}
          {activeTab === 'upgrades' && (
            <div>
              <h2>Upgrades</h2>
              <button
                onClick={(e) => upgradeAdd(e, 'lucky_number_sticks')}
                disabled={gameState.coins < 10}
                className={`${styles.btn} ${gameState.coins >= 10 ? styles.btnPurple : styles.btnGray}`}
              >
                <Image src="/images/coin_10.png" alt="Sticks" width={32} height={32} style={{display: 'inline', marginRight: '8px'}} />
                Lucky Number Sticks
                <div className={styles.btnHint}>
                  {gameState.coins >= 10 ? 'Cost: 10 coins' : 'Need ' + (10 - gameState.coins) + ' coins - 10 in total'}
                </div>
                <div className={styles.btnHint}>
                  Permanent +10% chance to drop a Stick when a Log has been felled
                </div>
              </button>
            </div>
          )}
          {/* Footer with Buttons */}
          <div className={styles.footer}>
            <button
              onClick={restartGame}
              className={`${styles.btn} ${styles.btnRed}`}
            >
              🔄 Restart Game
            </button>

            <button
              className={`${styles.btn} ${styles.btnGold}`}
            >
              👑 Update the King
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
