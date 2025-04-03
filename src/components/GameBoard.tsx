import React, { useState, useEffect } from 'react';
import './GameBoard.css';
import { ethers } from 'ethers';
import RockSVG from '../svg/rock.svg';
import PaperSVG from '../svg/paper.svg';
import ScissorsSVG from '../svg/scissors.svg';
import logo from '../svg/logo.png';

// Choices
const CHOICES = {
  ROCK: 1,
  PAPER: 2,
  SCISSORS: 3
};

// Choice names and SVG images
type ChoiceDataType = {
  [key: number]: { name: string; emoji: string; svg: string }
};

const CHOICE_DATA: ChoiceDataType = {
  1: { name: 'Rock', emoji: '🪨', svg: RockSVG },
  2: { name: 'Paper', emoji: '📄', svg: PaperSVG },
  3: { name: 'Scissors', emoji: '✂️', svg: ScissorsSVG }
};

// Logo SVG component - Now replaced with imported logo
const Logo = () => (
  <img src={logo} alt="Logo" className="header-logo" style={{ width: '40px', height: '40px' }} />
);

type GameBoardProps = {
  game: any;
  account: string;
  contract: ethers.Contract | null;
  onMakeChoice: (choice: number) => void;
  onResetGame: () => void;
  onCancelGame?: () => void;
  loading: boolean;
  result: string | null;
};

const GameBoard: React.FC<GameBoardProps> = ({ 
  game, 
  account, 
  contract, 
  onMakeChoice, 
  onResetGame,
  onCancelGame,
  loading,
  result
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [roundResultTimer, setRoundResultTimer] = useState<number | null>(null);
  const [waitingTime, setWaitingTime] = useState<number>(0);
  const [player1Choices, setPlayer1Choices] = useState<number[]>([]);
  const [player2Choices, setPlayer2Choices] = useState<number[]>([]);
  const [roundHistory, setRoundHistory] = useState<Array<{round: number, userChoice: number, opponentChoice: number}>>([]);
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);

  // Check if user is the creator of the game
  const isCreator = account.toLowerCase() === game.creator.toLowerCase();
  

  
  // Determine if it's the player's turn
  const isUserTurn = isCreator 
    ? !game.creatorConfirmed 
    : !game.joinerConfirmed;

  // Get user's and opponent's wins
  const userWins = isCreator ? game.creatorWins : game.joinerWins;
  const opponentWins = isCreator ? game.joinerWins : game.creatorWins;

  // Get user's and opponent's choices
  const userChoice = isCreator ? game.creatorChoice : game.joinerChoice;
  const opponentChoice = isCreator ? game.joinerChoice : game.creatorChoice;

  // Get user's and opponent's confirmation status
  const userConfirmed = isCreator ? game.creatorConfirmed : game.joinerConfirmed;
  const opponentConfirmed = isCreator ? game.joinerConfirmed : game.creatorConfirmed;

  useEffect(() => {
    // Reset countdown when the round changes or when a choice is made
    setCountdown(null);
  }, [game.currentRound, userChoice, opponentChoice]);

  // Handle countdown timer
  useEffect(() => {
    if (game.state === 2) {
      // Game is completed, no countdown needed
      return;
    }

    if (isUserTurn && !userConfirmed && !countdown) {
      // Start countdown for player's turn
      setCountdown(30);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isUserTurn, userConfirmed, countdown, game.state]);

  // Format the account address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Determine the winner of a round
  const getRoundWinner = () => {
    if (!userChoice || !opponentChoice) return null;
    
    if (userChoice === opponentChoice) {
      return 'draw';
    } else if (
      (userChoice === CHOICES.ROCK && opponentChoice === CHOICES.SCISSORS) ||
      (userChoice === CHOICES.PAPER && opponentChoice === CHOICES.ROCK) ||
      (userChoice === CHOICES.SCISSORS && opponentChoice === CHOICES.PAPER)
    ) {
      return 'user';
    } else {
      return 'opponent';
    }
  };

  // CSS class for choice icons based on winner
  const getChoiceIconClass = (isUserChoice: boolean) => {
    const winner = getRoundWinner();
    
    // If it's a draw, both should get the 'won' class
    if (winner === 'draw') {
      return 'won';
    }
    
    // Otherwise, only add 'won' to the winner's choice
    if (isUserChoice) {
      return winner === 'user' ? 'won' : '';
    } else {
      return winner === 'opponent' ? 'won' : '';
    }
  };

  // Get the game status text
  const getGameStatus = () => {
    // If a player reaches 3, the game should end
    if (userWins >= 3 || opponentWins >= 3) {
      return userWins >= 3 ? 'Congratulations! You won the game!' : 'Sorry. You lost the game.';
    }
    
    // Check for a draw (2-2 score ends the game)
    if (userWins === 2 && opponentWins === 2) {
      return 'Game ended with a 2-2 draw!';
    }
    
    if (game.state === 2) {
      // Game is completed
      if (userWins > opponentWins) {
        return 'Congratulations! You won the game!';
      } else if (opponentWins > userWins) {
        return 'Sorry. You lost the game.';
      } else {
        return 'The game ended in a draw.';
      }
    } else if (game.state === 0) {
      // Game is waiting for opponent
      return 'Waiting for opponent to join...';
    } else {
      // Game is in progress
      if (userConfirmed && opponentConfirmed) {
        // Both players have confirmed, show round result
        const winner = getRoundWinner();
        if (winner === 'draw') {
          return 'This round ended in a draw.';
        } else if (winner === 'user') {
          return 'You won this round!';
        } else {
          return 'You lost this round.';
        }
      } else if (userConfirmed) {
        return "Waiting for opponent's choice... Please be patient.";
      } else if (opponentConfirmed) {
        return 'Your turn to choose!';
      } else {
        return 'Both players need to make a choice.';
      }
    }
  };

  // Check if game was cancelled
  const isGameCancelled = () => {
    // Game is cancelled if:
    // 1. Game state is 0 AND joiner address is empty/null/zero address
    // 2. AND the current user is not the creator of the game (creators should see their own game)
    return game.state === 0 && 
           (!game.joiner || game.joiner === ethers.constants.AddressZero || 
            game.joiner === '0x0000000000000000000000000000000000000000') &&
           account.toLowerCase() !== game.creator.toLowerCase(); // Creator should see the waiting screen, not cancelled
  };

  // Add a timer effect for showing round results
  useEffect(() => {
    // If both players made choices, start a timer to automatically move to next round
    if (userConfirmed && opponentConfirmed && game.state === 1) {
      // Reset any existing timer
      if (roundResultTimer) {
        clearTimeout(roundResultTimer);
      }
      
      // Set a new timer to move to the next round automatically
      const timer = setTimeout(() => {
        // This will be triggered after 3 seconds of seeing the round result
        console.log("Moving to next round automatically");
        setRoundResultTimer(null);
      }, 3000);
      
      setRoundResultTimer(timer as unknown as number);
      
      return () => {
        if (roundResultTimer) {
          clearTimeout(roundResultTimer);
        }
      };
    }
  }, [userConfirmed, opponentConfirmed, game.state]);

  // Add a timer effect when waiting for opponent
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    // If user made a choice but opponent hasn't, start a timer to track waiting time
    if (userConfirmed && !opponentConfirmed && game.state === 1) {
      timer = setInterval(() => {
        setWaitingTime(prev => prev + 1);
      }, 1000);
    } else {
      // Reset waiting time when no longer waiting
      setWaitingTime(0);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [userConfirmed, opponentConfirmed, game.state]);

  useEffect(() => {
    // Getting choices from contract data
    if (!game) return;
    
    console.log("Updating game status:", {
      currentRound: game.currentRound,
      creatorChoice: game.creatorChoice,
      joinerChoice: game.joinerChoice,
      creatorWins: game.creatorWins,
      joinerWins: game.joinerWins,
      roundHistory: game.roundHistory
    });
    
    // DÜZELTME: Dogru sırada seçimleri tutacak diziler
    const p1Choices: number[] = [0, 0, 0]; // [1.tur, 2.tur, 3.tur]
    const p2Choices: number[] = [0, 0, 0]; // [1.tur, 2.tur, 3.tur]
    
    // Tur geçmişini doğru şekilde işleyelim
    if (game.roundHistory && Array.isArray(game.roundHistory)) {
      console.log("Round history array:", game.roundHistory);
      
      // Tüm turları işle
      for (let i = 0; i < 3; i++) {
        // Geçmiş tur verilerini doğru sırada işle
        if (i < game.roundHistory.length && game.roundHistory[i] > 0) {
          const creatorChoice = game.roundHistory[i];
          let joinerChoice = 0;
          
          // Kazanan bilgisine göre karşı tarafın seçimini hesapla
          if (i < game.creatorWins && i < game.joinerWins) {
            // Berabere - aynı seçim yapılmış
            joinerChoice = creatorChoice;
          } else if (i < game.creatorWins) {
            // Creator kazanmış
            if (creatorChoice === 1) joinerChoice = 3; // Rock beats Scissors
            else if (creatorChoice === 2) joinerChoice = 1; // Paper beats Rock
            else if (creatorChoice === 3) joinerChoice = 2; // Scissors beats Paper
          } else if (i < game.joinerWins) {
            // Joiner kazanmış
            if (creatorChoice === 1) joinerChoice = 2; // Paper beats Rock
            else if (creatorChoice === 2) joinerChoice = 3; // Scissors beats Paper
            else if (creatorChoice === 3) joinerChoice = 1; // Rock beats Scissors
          }
          
          // Kullanıcı rolüne göre seçimleri ata
          if (isCreator) {
            p1Choices[i] = creatorChoice;
            p2Choices[i] = joinerChoice;
          } else {
            p1Choices[i] = joinerChoice;
            p2Choices[i] = creatorChoice;
          }
        }
      }
    }
    
    // Mevcut tur için seçimleri ekle
    if (game.creatorChoice > 0 || game.joinerChoice > 0) {
      const currentRoundIdx = game.currentRound - 1;
      
      if (currentRoundIdx >= 0 && currentRoundIdx < 3) {
        if (isCreator) {
          p1Choices[currentRoundIdx] = game.creatorChoice || 0;
          p2Choices[currentRoundIdx] = game.joinerChoice || 0;
        } else {
          p1Choices[currentRoundIdx] = game.joinerChoice || 0;
          p2Choices[currentRoundIdx] = game.creatorChoice || 0;
        }
        
        console.log(`Current round ${game.currentRound} choices updated:`, {
          currentRoundIdx,
          p1: p1Choices[currentRoundIdx],
          p2: p2Choices[currentRoundIdx]
        });
      }
    }
    
    // Bot oyunu için özel durum
    if (game.gameType === 1) { // Bot oyunu
      const currentRoundIdx = game.currentRound - 1;
      if (currentRoundIdx >= 0 && currentRoundIdx < 3) {
        if (isCreator) {
          // Bot'un seçimini doğrudan al
          p2Choices[currentRoundIdx] = game.joinerChoice || 0;
        } else {
          // Bot'un seçimini doğrudan al
          p1Choices[currentRoundIdx] = game.creatorChoice || 0;
        }
      }
    }
    
    console.log("Final calculated choices:", { 
      player1: p1Choices, 
      player2: p2Choices,
      currentRound: game.currentRound
    });
    
    // State'leri güncelle
    setPlayer1Choices(p1Choices);
    setPlayer2Choices(p2Choices);
    setPlayer1Score(userWins);
    setPlayer2Score(opponentWins);
    
    // Round history for display
    const history: Array<{round: number, userChoice: number, opponentChoice: number}> = [];
    
    // Fill in history for rounds that have occurred
    for (let i = 0; i < Math.min(game.currentRound, 3); i++) {
      const userChoice = isCreator ? p1Choices[i] : p2Choices[i];
      const opponentChoice = isCreator ? p2Choices[i] : p1Choices[i];
      
      if (userChoice > 0 || opponentChoice > 0) {
        history.push({
          round: i + 1,
          userChoice,
          opponentChoice
        });
      }
    }
    
    // En son turlar en üstte gösterilsin
    history.sort((a, b) => b.round - a.round);
    setRoundHistory(history);
  }, [game, isCreator, userWins, opponentWins]);

  // Determine if the game is really over (based on score, not just game.state)
  const isGameReallyOver = () => {
    return userWins >= 3 || opponentWins >= 3 || game.state === 2;
  };

  // Render choice using SVG instead of emoji
  const renderChoice = (choice: number, isUser: boolean = true) => {
    if (!choice) return null;
    
    return (
      <div className={`choice-display ${getChoiceIconClass(isUser)}`}>
        <img 
          src={CHOICE_DATA[choice]?.svg} 
          alt={CHOICE_DATA[choice]?.name || 'Unknown'} 
          className="choice-svg"
        />
        <div className="choice-name">
          {CHOICE_DATA[choice]?.name || 'Unknown'}
        </div>
      </div>
    );
  };

  if (isGameCancelled()) {
    return (
      <div className="game-board canceled">
        <div className="game-header">
          <div className="logo-container">
            <Logo />
            <h1 className="game-title">ROCK PAPER SCISSORS</h1>
          </div>
          <h2>Game #{game.id}</h2>
          <p className="cancel-message">This game has been cancelled</p>
          <button className="back-button" onClick={onResetGame}>Home Page</button>
        </div>
      </div>
    );
  }
  
  // If user is creator and game is waiting for opponent, show waiting screen
  if (game.state === 0 && isCreator) {
    return (
      <div className="game-board waiting">
        <div className="game-header">
          <div className="logo-container">
            <Logo />
            <h1 className="game-title">ROCK PAPER SCISSORS</h1>
          </div>
          <h2>Rock Paper Scissors - Game #{game.id}</h2>
          <p>Bet Amount: {game.betAmount} STT</p>
          <p className="waiting-message">Waiting for opponent...</p>
          <p className="waiting-info">Share your Game ID with friends to play together!</p>
          <div className="game-id-container">
            <span className="game-id">Game ID: {game.id}</span>
          </div>
          <button className="cancel-game-button" onClick={onCancelGame || onResetGame}>
            Cancel Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-board">
      <div className="game-header">
        <div className="logo-container">
          <Logo />
          <h1 className="game-title">ROCK PAPER SCISSORS</h1>
        </div>
        <h2>Rock Paper Scissors - Game #{game.id}</h2>
        <p>Bet Amount: {game.betAmount} STT</p>
        <p>Round: {game.currentRound}</p>
        <p className="score-summary">Score: {player1Score} - {player2Score}</p>

        <p className="turn-indicator">{getGameStatus()}</p>
      </div>
      
      <div className="game-status">
        <div className="player-score">
          <span className="player-name">You ({formatAddress(account)})</span>
          <div className="score-bars">
            {[0, 1, 2].map((index) => {
              // Doğru indeks için seçimleri al
              const p1Choice = player1Choices[index] || 0;
              const p2Choice = player2Choices[index] || 0;
              
              // Skor çubuğu görseli için sınıf hesaplama
              let barClass = '';
              
              // Eğer her iki oyuncu da seçim yaptıysa sonucu göster
              if (p1Choice > 0 && p2Choice > 0) {
                if (p1Choice === p2Choice) {
                  barClass = 'draw';
                } else if (
                  (p1Choice === CHOICES.ROCK && p2Choice === CHOICES.SCISSORS) ||
                  (p1Choice === CHOICES.PAPER && p2Choice === CHOICES.ROCK) ||
                  (p1Choice === CHOICES.SCISSORS && p2Choice === CHOICES.PAPER)
                ) {
                  barClass = 'won';
                } else {
                  barClass = 'lost';
                }
              }
              // Eğer kazanan sayısı bu turdan fazlaysa (skor gösterir)
              else if (index < player1Score) {
                barClass = 'won';
              }
              
              // Seçim görselini gösterme kontrolü
              const isCurrentRound = index === game.currentRound - 1;
              const shouldShowChoice = p1Choice > 0 || (isCurrentRound && userChoice > 0);
              
              return (
                <div key={index} className={`score-bar ${barClass}`}>
                  {shouldShowChoice && (
                    <span className="score-bar-emoji">
                      {p1Choice > 0 ? (
                        <img 
                          src={CHOICE_DATA[p1Choice]?.svg} 
                          alt={CHOICE_DATA[p1Choice]?.name || 'Unknown'} 
                          className="choice-svg-small"
                        />
                      ) : (
                        isCurrentRound && userChoice > 0 ? (
                          <img 
                            src={CHOICE_DATA[userChoice]?.svg} 
                            alt={CHOICE_DATA[userChoice]?.name || 'Unknown'} 
                            className="choice-svg-small"
                          />
                        ) : ''
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="player-score">
          <span className="player-name">Opponent ({formatAddress(isCreator ? game.joiner : game.creator)})</span>
          <div className="score-bars">
            {[0, 1, 2].map((index) => {
              // Doğru indeks için seçimleri al
              const p1Choice = player1Choices[index] || 0;
              const p2Choice = player2Choices[index] || 0;
              
              // Skor çubuğu görseli için sınıf hesaplama
              let barClass = '';
              
              // Eğer her iki oyuncu da seçim yaptıysa sonucu göster
              if (p1Choice > 0 && p2Choice > 0) {
                if (p1Choice === p2Choice) {
                  barClass = 'draw';
                } else if (
                  (p2Choice === CHOICES.ROCK && p1Choice === CHOICES.SCISSORS) ||
                  (p2Choice === CHOICES.PAPER && p1Choice === CHOICES.ROCK) ||
                  (p2Choice === CHOICES.SCISSORS && p1Choice === CHOICES.PAPER)
                ) {
                  barClass = 'won';
                } else {
                  barClass = 'lost';
                }
              }
              // Eğer kazanan sayısı bu turdan fazlaysa (skor gösterir)
              else if (index < player2Score) {
                barClass = 'won';
              }
              
              // Seçim görselini gösterme kontrolü
              const isCurrentRound = index === game.currentRound - 1;
              const shouldShowChoice = p2Choice > 0 || (isCurrentRound && opponentChoice > 0);
              
              return (
                <div key={index} className={`score-bar ${barClass}`}>
                  {shouldShowChoice && (
                    <span className="score-bar-emoji">
                      {p2Choice > 0 ? (
                        <img 
                          src={CHOICE_DATA[p2Choice]?.svg} 
                          alt={CHOICE_DATA[p2Choice]?.name || 'Unknown'} 
                          className="choice-svg-small"
                        />
                      ) : (
                        isCurrentRound && opponentChoice > 0 ? (
                          <img 
                            src={CHOICE_DATA[opponentChoice]?.svg} 
                            alt={CHOICE_DATA[opponentChoice]?.name || 'Unknown'} 
                            className="choice-svg-small"
                          />
                        ) : ''
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {userChoice > 0 && opponentChoice > 0 && (
        <div className="choices-display">
          <div className="choice">
            <h3>Your Choice</h3>
            <div className={`choice-icon ${getChoiceIconClass(true)} ${CHOICE_DATA[userChoice]?.name?.toLowerCase() || ''}`}>
              <img 
                src={CHOICE_DATA[userChoice]?.svg} 
                alt={CHOICE_DATA[userChoice]?.name || 'Unknown'} 
                className="choice-svg-large"
              />
              {CHOICE_DATA[userChoice]?.name || 'Unknown'}
            </div>
          </div>
          
          <div className="vs">VS</div>
          
          <div className="choice">
            <h3>Opponent's Choice</h3>
            <div className={`choice-icon ${getChoiceIconClass(false)} ${CHOICE_DATA[opponentChoice]?.name?.toLowerCase() || ''}`}>
              <img 
                src={CHOICE_DATA[opponentChoice]?.svg} 
                alt={CHOICE_DATA[opponentChoice]?.name || 'Unknown'} 
                className="choice-svg-large"
              />
              {CHOICE_DATA[opponentChoice]?.name || 'Unknown'}
            </div>
          </div>
        </div>
      )}
      
      {!userConfirmed && game.state === 1 && (
        <div className="choice-buttons">
          <button 
            className="choice-button rock" 
            onClick={() => onMakeChoice(CHOICES.ROCK)}
            disabled={loading || !isUserTurn}
          >
            <img 
              src={CHOICE_DATA[CHOICES.ROCK].svg} 
              alt="Rock" 
              className="choice-svg-button"
            />
            Rock
          </button>
          <button 
            className="choice-button paper" 
            onClick={() => onMakeChoice(CHOICES.PAPER)}
            disabled={loading || !isUserTurn}
          >
            <img 
              src={CHOICE_DATA[CHOICES.PAPER].svg} 
              alt="Paper" 
              className="choice-svg-button"
            />
            Paper
          </button>
          <button 
            className="choice-button scissors" 
            onClick={() => onMakeChoice(CHOICES.SCISSORS)}
            disabled={loading || !isUserTurn}
          >
            <img 
              src={CHOICE_DATA[CHOICES.SCISSORS].svg} 
              alt="Scissors" 
              className="choice-svg-button"
            />
            Scissors
          </button>
        </div>
      )}
      
      {userConfirmed && !opponentConfirmed && game.state === 1 && (
        <div className="waiting-for-opponent">
          <div className="loading-spinner"></div>
          <h3>Waiting for Opponent's Move</h3>
          <p>Your opponent is making their choice. This may take a moment...</p>
          <p className="waiting-time">Waiting time: {waitingTime} seconds</p>
        </div>
      )}
      
      {game.state === 2 && (
        <div className="game-result">
          <h3>{getGameStatus()}</h3>
          <button className="new-game-button" onClick={onResetGame}>
            Return to Home Page
          </button>
        </div>
      )}
    </div>
  );
};

export default GameBoard; 
