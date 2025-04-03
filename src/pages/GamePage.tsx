import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import GameBoard from '../components/GameBoard';
import Popup from '../components/Popup';

const RPS_CONTRACT_ADDRESS = "0x258c2a839823a898b6d294515fc3434b06fe590f";
const contractABI: ethers.ContractInterface = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "betAmount",
        "type": "uint256"
      }
    ],
    "name": "createGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "joinGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "choice",
        "type": "uint8"
      }
    ],
    "name": "makeChoice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "cancelGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "getGameBasicDetails",
    "outputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "joiner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "betAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "state",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "gameType",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "getGameRoundDetails",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "currentRound",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "creatorWins",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "joinerWins",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "creatorChoice",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "joinerChoice",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "creatorConfirmed",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "joinerConfirmed",
        "type": "bool"
      },
      {
        "internalType": "uint8[3]",
        "name": "roundHistory",
        "type": "uint8[3]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

function GamePage() {
  const { id } = useParams();
  const [game, setGame] = useState<any>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        if (!window.ethereum) {
          throw new Error("Please install MetaMask!");
        }

        // Önceden bağlı hesabı kontrol et
        const savedAccount = localStorage.getItem('connectedAccount');
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        let localContract: ethers.Contract | null = null;
        let localAccount: string | null = null;
        
        // Öncelikle listAccounts ile izin istemeden hesapları kontrol edelim
        const accounts = await provider.listAccounts();
        
        // Eğer hesaplar varsa ve localStorage'daki hesap ile eşleşiyorsa, doğrudan kullan
        if (accounts.length > 0 && savedAccount && accounts[0].toLowerCase() === savedAccount.toLowerCase()) {
          const signer = provider.getSigner();
          localContract = new ethers.Contract(RPS_CONTRACT_ADDRESS, contractABI, signer);
          localAccount = accounts[0];
        } else {
          // Hesap bulunamadı veya eşleşmedi, kullanıcıdan izin iste
          const requestedAccounts = await provider.send("eth_requestAccounts", []);
          const signer = provider.getSigner();
          localContract = new ethers.Contract(RPS_CONTRACT_ADDRESS, contractABI, signer);
          localAccount = requestedAccounts[0];
          
          // Bağlantı bilgisini güncelle
          localStorage.setItem('connectedAccount', requestedAccounts[0]);
        }
        
        // State'leri güncelle
        setAccount(localAccount);
        setContract(localContract);

        // Önce basic details'i almaya çalış
        let basicDetails;
        try {
          basicDetails = await localContract.getGameBasicDetails(id);
        } catch (error) {
          console.error("Error fetching basic game details:", error);
          setError("Game details could not be loaded. Please try again later or check your game ID.");
          return; // Basic details olmazsa devam etmeye gerek yok
        }
        
        // Eğer basic details başarılı ise, round details'i almaya çalış
        let roundDetails;
        try {
          roundDetails = await localContract.getGameRoundDetails(id);
        } catch (error) {
          console.error("Error fetching round details:", error);
          // Round details'i alamazsak varsayılan değerlerle devam et
          roundDetails = {
            currentRound: 0,
            creatorWins: 0,
            joinerWins: 0,
            creatorChoice: 0,
            joinerChoice: 0,
            creatorConfirmed: false,
            joinerConfirmed: false,
            roundHistory: [0, 0, 0]
          };
        }

        setGame({
          id,
          creator: basicDetails.creator,
          joiner: basicDetails.joiner,
          betAmount: ethers.utils.formatEther(basicDetails.betAmount),
          state: basicDetails.state,
          currentRound: roundDetails.currentRound || 0,
          creatorWins: roundDetails.creatorWins || 0,
          joinerWins: roundDetails.joinerWins || 0,
          creatorChoice: roundDetails.creatorChoice || 0,
          joinerChoice: roundDetails.joinerChoice || 0,
          creatorConfirmed: roundDetails.creatorConfirmed || false,
          joinerConfirmed: roundDetails.joinerConfirmed || false,
          roundHistory: roundDetails.roundHistory || [0, 0, 0]
        });

      } catch (error: any) {
        console.error("Initialization error:", error);
        setError(error.message);
      }
    };

    init();
  }, [id]);

  useEffect(() => {
    if (!contract || !game) return;

    // Poll for updates more frequently (every 0.5 second)
    const pollInterval = setInterval(updateGameState, 500);

    return () => {
      clearInterval(pollInterval);
    };
  }, [contract, game, account]);

  const updateGameState = async () => {
    if (!contract || !game) return;

    try {
      console.log("Updating game state for game:", game.id);
      
      // Önce basic details'i almaya çalış
      let basicDetails;
      let roundDetails;
      
      try {
        basicDetails = await contract.getGameBasicDetails(game.id);
      } catch (error) {
        console.error("Error fetching basic details:", error);
        return; // Basic details alınamazsa işlemi durdur
      }
      
      // Eğer basic details başarılı ise, round details'i almaya çalış
      try {
        roundDetails = await contract.getGameRoundDetails(game.id);
      } catch (error) {
        console.error("Error fetching round details:", error);
        // Round details alınamadıysa mevcut değerleri koru
        roundDetails = {
          currentRound: game.currentRound || 0,
          creatorWins: game.creatorWins || 0,
          joinerWins: game.joinerWins || 0,
          creatorChoice: game.creatorChoice || 0,
          joinerChoice: game.joinerChoice || 0,
          creatorConfirmed: game.creatorConfirmed || false,
          joinerConfirmed: game.joinerConfirmed || false,
          roundHistory: game.roundHistory || [0, 0, 0]
        };
      }

      console.log("Game details from contract:", {
        state: basicDetails.state,
        creator: basicDetails.creator,
        joiner: basicDetails.joiner,
        currentRound: roundDetails.currentRound,
        creatorWins: roundDetails.creatorWins,
        joinerWins: roundDetails.joinerWins
      });

      // Check if the round has changed, which means both players have made choices
      const isNewRound = game.currentRound !== roundDetails.currentRound;
      const bothPlayersConfirmed = roundDetails.creatorConfirmed && roundDetails.joinerConfirmed;
      
      // Update game state
      const updatedGame = {
        ...game,
        creator: basicDetails.creator,
        joiner: basicDetails.joiner,
        state: basicDetails.state,
        currentRound: roundDetails.currentRound,
        creatorWins: roundDetails.creatorWins,
        joinerWins: roundDetails.joinerWins,
        creatorChoice: roundDetails.creatorChoice,
        joinerChoice: roundDetails.joinerChoice,
        creatorConfirmed: roundDetails.creatorConfirmed,
        joinerConfirmed: roundDetails.joinerConfirmed,
        roundHistory: roundDetails.roundHistory || [0, 0, 0]
      };

      setGame(updatedGame);

      // If we have a new round and both players confirmed, show a round result popup
      if (isNewRound && bothPlayersConfirmed && basicDetails.state === 1) {
        const isCreator = account?.toLowerCase() === basicDetails.creator.toLowerCase();
        const userWins = isCreator ? roundDetails.creatorWins : roundDetails.joinerWins;
        const opponentWins = isCreator ? roundDetails.joinerWins : roundDetails.creatorWins;
        
        // Determine who won the previous round
        if (userWins > game.creatorWins || userWins > game.joinerWins) {
          setPopup({
            message: 'You won the round!',
            type: 'success'
          });
        } else if (opponentWins > game.creatorWins || opponentWins > game.joinerWins) {
          setPopup({
            message: 'You lost the round.',
            type: 'info'
          });
        } else {
          setPopup({
            message: 'The round ended in a draw.',
            type: 'info'
          });
        }
      }

      // Show result if game is completed
      if (basicDetails.state === 2) {
        const isCreator = account?.toLowerCase() === basicDetails.creator.toLowerCase();
        let resultMessage = '';
        
        if (roundDetails.creatorWins > roundDetails.joinerWins) {
          resultMessage = isCreator ? '🎉 You won the game!' : '😔 You lost the game!';
        } else if (roundDetails.joinerWins > roundDetails.creatorWins) {
          resultMessage = isCreator ? '😔 You lost the game!' : '🎉 You won the game!';
        } else {
          resultMessage = '🤝 The game ended in a draw!';
        }

        setPopup({
          message: resultMessage,
          type: 'info'
        });

        // Cüzdan bağlantısını koruyarak ana sayfaya dön
        setTimeout(() => {
          navigate('/', { 
            state: { 
              refresh: true,
              keepConnection: true // Bağlantıyı korumak için yeni bir bayrak
            } 
          });
        }, 3000);
      }
    } catch (error) {
      console.error("Error updating game state:", error);
      // Genel hata durumunda oyun verilerini güncelleme
    }
  };

  const makeChoice = async (choice: number) => {
    if (!contract || !game) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const tx = await contract.makeChoice(game.id, choice, { gasLimit: 500000 });
      await tx.wait();
      
      // Update game state after making a choice
      await updateGameState();

    } catch (error: any) {
      console.error("Error making choice:", error);
      setPopup({
        message: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGame = async () => {
    if (!contract || !game) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const tx = await contract.cancelGame(game.id, { gasLimit: 500000 });
      await tx.wait();
      
      setPopup({
        message: 'Game cancelled successfully!',
        type: 'success'
      });
      
      // Cüzdan bağlantısını koruyarak ana sayfaya dön
      setTimeout(() => {
        navigate('/', { 
          state: { 
            refresh: true,
            keepConnection: true 
          } 
        });
      }, 2000);
      
    } catch (error: any) {
      console.error("Error cancelling game:", error);
      setPopup({
        message: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/', { 
          state: { 
            refresh: true,
            keepConnection: true 
          } 
        })}>Back to Home</button>
      </div>
    );
  }

  if (!game) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="game-page">
      <GameBoard
        game={game}
        account={account || ''}
        contract={contract}
        onMakeChoice={makeChoice}
        onResetGame={() => navigate('/', { 
          state: { 
            refresh: true,
            keepConnection: true 
          } 
        })}
        onCancelGame={handleCancelGame}
        loading={loading}
        result={null}
      />

      {popup && (
        <Popup
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}

export default GamePage; 