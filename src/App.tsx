import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

import Popup from './components/Popup';
import GamePage from './pages/GamePage';
import AdminPage from './pages/AdminPage';
import { ethers } from 'ethers';
import logo from './svg/logo.png';

// Kontrat adresini güncelle
const RPS_CONTRACT_ADDRESS = "0x258c2a839823a898b6d294515fc3434b06fe590f";

// Kontrat ABI'sini güncelle - yeni admin fonksiyonlarını içeriyor
const contractABI = [
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
        "internalType": "uint8",
        "name": "gameType",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "betAmount",
        "type": "uint256"
      }
    ],
    "name": "createGameWithType",
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
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserGames",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAvailableGames",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Admin fonksiyonları
  {
    "inputs": [],
    "name": "adminDeposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "adminWithdraw",
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
    "name": "adminCancelGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "adminCancelAllWaitingGames",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalCommissionCollected",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getGameHistoryCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
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
        "name": "startIndex",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "count",
        "type": "uint256"
      }
    ],
    "name": "getGameHistoryBatch",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "gameIds",
        "type": "uint256[]"
      },
      {
        "internalType": "address[]",
        "name": "creators",
        "type": "address[]"
      },
      {
        "internalType": "address[]",
        "name": "joiners",
        "type": "address[]"
      },
      {
        "internalType": "address[]",
        "name": "winners",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "betAmounts",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "completedAts",
        "type": "uint256[]"
      },
      {
        "internalType": "uint8[]",
        "name": "gameTypes",
        "type": "uint8[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "betAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "gameType",
        "type": "uint8"
      }
    ],
    "name": "GameCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "joiner",
        "type": "address"
      }
    ],
    "name": "GameJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "GameCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "choice",
        "type": "uint8"
      }
    ],
    "name": "ChoiceMade",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "winner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "round",
        "type": "uint8"
      }
    ],
    "name": "RoundCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "winner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "prize",
        "type": "uint256"
      }
    ],
    "name": "GameCompleted",
    "type": "event"
  }
];

declare global {
  interface Window {
    ethereum?: any;
  }
}


const SOMNIA_CHAIN_ID = '50312'; // Somnia testnet chain ID
const SOMNIA_RPC = 'https://rpc.ankr.com/somnia_testnet/3c762a03e25b498bc79b874a461257b419f03ca1d479b5ef998e3d87cada0964';

const somniaNetworkParams = {
  chainId: SOMNIA_CHAIN_ID,
  chainName: 'Somnia Testnet',
  nativeCurrency: {
    name: 'STT',
    symbol: 'STT',
    decimals: 18,
  },
  rpcUrls: [SOMNIA_RPC],
  blockExplorerUrls: ['https://shannon-explorer.somnia.network'],
};

// Oyun durumu için yardımcı fonksiyon
const getGameStatus = (game: any) => {
    if (game.state === 2) return 'Completed';
    if (game.state === 1) return 'In Progress';
    return 'Waiting';
};

// Oyun kapasitesi için yardımcı fonksiyon
const getGameCapacity = (game: any) => {
    if (game.state === 2) return '2/2';
    if (game.state === 1) return '2/2';
    return '1/2';
};

// Oyun durumu için stil sınıfı
const getGameStatusClass = (game: any) => {
    if (game.state === 2) return 'status-completed';
    if (game.state === 1) return 'status-full';
    return 'status-available';
};

// Wallet address formatter function
const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPool, setSelectedPool] = useState<string>("0.5");
  const [myGames, setMyGames] = useState<any[]>([]);
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastGames, setLastGames] = useState<Array<{
    id: number;
    result: string;
    betAmount: string;
    date: string;
  }>>([]);
  const [popup, setPopup] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const navigate = useNavigate();
  const [isAvailableGamesOpen, setIsAvailableGamesOpen] = useState(true);
  const [isUserGamesOpen, setIsUserGamesOpen] = useState(true);
  const location = useLocation();
  const [isOwner, setIsOwner] = useState(false);

  // Available pool options in STT
  const poolOptions = ["0.5", "1", "5", "10"];

  const switchToSomniaNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SOMNIA_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // Ağ henüz eklenmemişse, ekleyelim
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [somniaNetworkParams],
          });
        } catch (addError) {
          console.error('Ağ eklenemedi:', addError);
        }
      }
      console.error('Ağ değiştirilemedi:', switchError);
    }
  };

  useEffect(() => {
    // Sayfa yüklendiğinde veya yenilendiğinde cüzdan durumunu kontrol et
    const checkWalletConnection = async () => {
      try {
        // Daha önce bağlanmış bir hesap var mı kontrol et
        const savedAccount = localStorage.getItem('connectedAccount');
        
        if (savedAccount && window.ethereum) {
          // Ethereum sağlayıcısı varsa ve önceden bağlı hesap varsa, otomatik bağlanmayı dene
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          
          // Mevcut hesapları kontrol et (kullanıcıdan izin istemeden)
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0 && accounts[0].toLowerCase() === savedAccount.toLowerCase()) {
            // Kullanıcı hala bağlı, sözleşme nesnesini oluştur
            setAccount(accounts[0]);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(RPS_CONTRACT_ADDRESS, contractABI, signer);
            setContract(contract);
            setProvider(provider);
            console.log("Wallet re-connected automatically:", accounts[0]);
          } else {
            // Kullanıcı artık bağlı değil veya hesap değişti
            localStorage.removeItem('connectedAccount');
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
        localStorage.removeItem('connectedAccount');
      }
    };
    
    checkWalletConnection();
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      setLoading(true);

      // Önce Somnia ağına geçmeyi deneyelim
      await switchToSomniaNetwork();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(RPS_CONTRACT_ADDRESS, contractABI, signer);
        setContract(contract);
        setProvider(provider);
        
        // Bağlantı bilgisini yerel depolamada sakla
        localStorage.setItem('connectedAccount', accounts[0]);
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Could not connect wallet. Please make sure you are on the Somnia network.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setContract(null);
    setProvider(null);
    
    // Bağlantı bilgisini yerel depolamadan sil
    localStorage.removeItem('connectedAccount');
  };

  // Ağ değişikliğini dinleyelim
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      });
    }
  }, []);

  // Event listener'ı ekleyelim
  useEffect(() => {
    if (contract && account) {
      // GameJoined event'ini dinle
      const handleGameJoined = async (gameId: any, joiner: string, event: any) => {
        console.log("Oyuna katılım oldu:", { 
          gameId: gameId.toString(), 
          joiner,
          creator: event.args?.creator,
          blockNumber: event.blockNumber 
        });
        
        try {
          // Oyun detaylarını al
          const game = await contract.getGameDetails(gameId);
          console.log("Oyun detayları:", game);
          
          // Eğer oyunu oluşturan kişi bu kullanıcıysa veya katılan kişi bu kullanıcıysa
          if (game.creator.toLowerCase() === account.toLowerCase() || 
              joiner.toLowerCase() === account.toLowerCase()) {
            
            const gameData = {
              id: gameId.toString(),
              creator: game.creator,
              joiner: game.joiner,
              betAmount: ethers.utils.formatEther(game.betAmount),
              state: game.state,
              currentRound: game.currentRound,
              creatorWins: game.creatorWins,
              joinerWins: game.joinerWins,
              creatorConfirmed: game.creatorConfirmed,
              joinerConfirmed: game.joinerConfirmed,
              creatorChoice: game.creatorChoice,
              joinerChoice: game.joinerChoice,
              createdAt: new Date(game.createdAt.toNumber() * 1000).toLocaleString()
            };
            
            console.log("Oyun verisi hazırlandı:", gameData);
            
            // Oyun ekranını göster
            setCurrentGame(gameData);
            
            // Kullanıcıya bildirim göster
            if (game.creator.toLowerCase() === account.toLowerCase()) {
              alert("Rakip oyuna katıldı! Oyun başlıyor...");
            } else if (joiner.toLowerCase() === account.toLowerCase()) {
              alert("Oyuna başarıyla katıldınız! Oyun başlıyor...");
            }
            
            // Oyun listelerini güncelle
            await loadUserGames(account, contract);
            await loadAvailableGames(account, contract);
          }
        } catch (error) {
          console.error("Oyun detayları alınırken hata:", error);
        }
      };

      // Event listener'ı ekle
      contract.on("GameJoined", handleGameJoined);

      // Başlangıçta mevcut oyunları yükle
      loadUserGames(account, contract);
      loadAvailableGames(account, contract);

      // Cleanup
      return () => {
        contract.off("GameJoined", handleGameJoined);
      };
    }
  }, [contract, account]);

  // Load available games
  const loadAvailableGames = async (account: string, contract: ethers.Contract) => {
    console.log("Mevcut oyunlar yükleniyor...");
    
    if (!contract) {
      console.log("Kontrat bulunamadı");
      setAvailableGames([]);
      return;
    }
    
    try {
      // Debug: Kontrat adresini ve mevcut havuzları görelim
      console.log("Kontrat adresi:", contract.address);
      console.log("Kontrat fonksiyonları:", Object.keys(contract.functions));
      
      // getAvailableGames fonksiyonunu çağır
      const gameIds = await contract.getAvailableGames();
      console.log("Bulunan oyun ID'leri:", gameIds.map((id: any) => id.toString()));
      
      // Her bir oyun için detayları getir
      const games = await Promise.all(
        gameIds.map(async (id: any) => {
          try {
            const [basicDetails, roundDetails] = await Promise.all([
              contract.getGameBasicDetails(id),
              contract.getGameRoundDetails(id)
            ]);
            
            // Sadece WAITING durumundaki oyunları göster
            if (basicDetails.state === 0) {
              return {
                id: id.toString(),
                creator: basicDetails.creator,
                joiner: basicDetails.joiner,
                betAmount: ethers.utils.formatEther(basicDetails.betAmount),
                state: basicDetails.state,
                gameType: basicDetails.gameType,
                currentRound: roundDetails.currentRound,
                creatorWins: roundDetails.creatorWins,
                joinerWins: roundDetails.joinerWins,
                creatorConfirmed: roundDetails.creatorConfirmed,
                joinerConfirmed: roundDetails.joinerConfirmed,
                creatorChoice: roundDetails.creatorChoice,
                joinerChoice: roundDetails.joinerChoice,
                createdAt: new Date(basicDetails.createdAt.toNumber() * 1000)
              };
            }
            return null;
          } catch (error) {
            console.error(`Oyun detayları alınamadı (ID: ${id}):`, error);
            return null;
          }
        })
      );
      
      // null değerleri filtrele ve tarihe göre sırala
      const availableGames = games
        .filter(game => game !== null)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(game => ({
          ...game,
          createdAt: game.createdAt.toLocaleString()
        }));

      console.log("Kullanılabilir oyunlar:", availableGames);
      setAvailableGames(availableGames);
      
    } catch (error: any) {
      console.error("Error loading available games:", error);
      setError("Mevcut oyunlar yüklenirken hata: " + error.message);
      setAvailableGames([]);
    }
  };

  // Create a new game
  const createGame = async (gameType: number) => {
    if (!contract || !account) return;
    
    try {
      setLoading(true);
      
      const betAmountInEther = selectedPool;
      const betAmountInWei = ethers.utils.parseEther(betAmountInEther);
      
      // Show popup before transaction
      setPopup({
        message: gameType === 1 ? 'Creating a game against bot...' : 'Creating new PvP game...',
        type: 'info'
      });
      
      // Using the createGameWithType function for better control over game type
      const tx = await contract.createGameWithType(
        gameType,  // 0 for PvP, 1 for Bot
        betAmountInWei, 
        { 
          value: betAmountInWei,
          gasLimit: 500000
        }
      );
      
      await tx.wait();
      
      // After successful creation, reload games
      if (account && contract) {
        await Promise.all([
          loadAvailableGames(account, contract),
          loadUserGames(account, contract)
        ]);
      }
      
      // Show success message after transaction completes
      setPopup({
        message: gameType === 1 
          ? 'Game against bot created successfully!' 
          : 'PvP game created successfully!',
        type: 'success'
      });

      // Get latest game ID and navigate after a short delay
      const userGames = await contract.getUserGames(account);
      const latestGameId = userGames[userGames.length - 1].toNumber();
      
      // Add a short delay so user can see the success message
      setTimeout(() => {
        navigate(`/game/${latestGameId}`);
      }, 1500);
      
    } catch (error: any) {
      console.error("Failed to create game:", error);
      setPopup({
        message: `Error creating game: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Join an existing game
  const joinGame = async (gameId: number) => {
    if (!contract || !account) return;
    
    try {
      setLoading(true);
      
      // Show popup before transaction
      setPopup({
        message: 'Joining game...',
        type: 'info'
      });
      
      // Get the game details to determine the bet amount
      const gameDetails = await contract.getGameBasicDetails(gameId);
      const betAmount = gameDetails.betAmount;
      
      const tx = await contract.joinGame(gameId, {
        value: betAmount,
        gasLimit: 500000
      });
      
      await tx.wait();
      
      // Show success message after transaction completes
      setPopup({
        message: 'Joined the game successfully!',
        type: 'success'
      });
      
      // Add a short delay so user can see the success message
      setTimeout(() => {
        navigate(`/game/${gameId}`);
      }, 1500);
      
    } catch (error: any) {
      console.error("Failed to join game:", error);
      setPopup({
        message: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Make a choice in a game (Rock, Paper, or Scissors)
  const makeChoice = async (gameId: number, choice: number) => {
    if (!contract) {
        console.error('Kontrat bağlantısı yok');
        return;
    }

    try {
        setLoading(true);
        console.log('Seçim yapılıyor:', { gameId, choice, account });

        if (choice > 0) { // Sadece gerçek seçim yapıldığında transaction gönder
            const tx = await contract.makeChoice(gameId, choice, { gasLimit: 500000 });
            console.log('Transaction gönderildi:', tx.hash);
            await tx.wait();
            console.log('Transaction onaylandı');
        }

        // Oyun durumunu güncelle
        const [basicDetails, roundDetails] = await Promise.all([
            contract.getGameBasicDetails(gameId),
            contract.getGameRoundDetails(gameId)
        ]);

        const updatedGame = {
            ...currentGame,
            state: basicDetails.state,
            currentRound: roundDetails.currentRound,
            creatorWins: roundDetails.creatorWins,
            joinerWins: roundDetails.joinerWins,
            creatorChoice: roundDetails.creatorChoice,
            joinerChoice: roundDetails.joinerChoice,
            creatorConfirmed: roundDetails.creatorConfirmed,
            joinerConfirmed: roundDetails.joinerConfirmed
        };

        setCurrentGame(updatedGame);

        // Oyun bittiyse sonucu göster ve GameBoard'u kapat
        if (basicDetails.state === 2) { // COMPLETED
            const isCreator = account?.toLowerCase() === basicDetails.creator.toLowerCase();
            let resultMessage = '';
            
            if (roundDetails.creatorWins > roundDetails.joinerWins) {
                if (isCreator) {
                    resultMessage = '🎉 Oyunu kazandınız!';
                } else {
                    resultMessage = '😔 Oyunu kaybettiniz!';
                }
            } else if (roundDetails.joinerWins > roundDetails.creatorWins) {
                if (isCreator) {
                    resultMessage = '😔 Oyunu kaybettiniz!';
                } else {
                    resultMessage = '🎉 Oyunu kazandınız!';
                }
            } else {
                resultMessage = '🤝 Oyun berabere bitti!';
            }

            // Son oyunları güncelle
            setLastGames(prev => [{
                id: gameId,
                result: resultMessage,
                betAmount: ethers.utils.formatEther(basicDetails.betAmount),
                date: new Date().toLocaleString()
            }, ...prev].slice(0, 10)); // Son 10 oyunu tut

            alert(resultMessage);
            setCurrentGame(null); // GameBoard'u kapat
        }
    } catch (error: any) {
        console.error('Seçim yapılırken hata:', error);
        if (error.message.includes('revert')) {
            alert('İşlem başarısız oldu. Lütfen tekrar deneyin.');
        } else if (error.code === 4001) { // Kullanıcı işlemi iptal etti
            setPopup({
                message: 'Transaction cancelled',
                type: 'info'
            });
        } else {
            alert('Bir hata oluştu: ' + error.message);
        }
    } finally {
        setLoading(false);
    }
  };

  // Cancel a game
  const cancelGame = async (gameId: number) => {
    if (!contract || !account) return;
    
    try {
      setLoading(true);
      
      const tx = await contract.cancelGame(gameId, { gasLimit: 500000 });
      await tx.wait();
      
      // After successful cancellation, reload games and show success popup
      if (account && contract) {
        await Promise.all([
          loadAvailableGames(account, contract),
          loadUserGames(account, contract)
        ]);
      }
      
      setPopup({
        message: 'Game cancelled successfully!',
        type: 'success'
      });
      
    } catch (error: any) {
      console.error("Failed to cancel game:", error);
      setPopup({
        message: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // When pool selection changes
  useEffect(() => {
    if (contract && account) {
      loadAvailableGames(account, contract);
    }
  }, [selectedPool, contract, account]);

  // loadUserGames fonksiyonunu güncelle
  const loadUserGames = async (userAddress: string, contract: ethers.Contract) => {
    try {
      if (!contract) return;
      
      console.log("Kullanıcı oyunları yükleniyor...");
      const gameIds = await contract.getUserGames(userAddress);
      console.log("Bulunan oyun ID'leri:", gameIds.map((id: any) => id.toString()));
      
      const games = await Promise.all(
        gameIds.map(async (id: any) => {
          try {
            const [basicDetails, roundDetails] = await Promise.all([
              contract.getGameBasicDetails(id),
              contract.getGameRoundDetails(id)
            ]);
            
            return {
              id: id.toString(),
              creator: basicDetails.creator,
              joiner: basicDetails.joiner,
              betAmount: ethers.utils.formatEther(basicDetails.betAmount),
              state: basicDetails.state,
              gameType: basicDetails.gameType,
              currentRound: roundDetails.currentRound,
              creatorWins: roundDetails.creatorWins,
              joinerWins: roundDetails.joinerWins,
              creatorConfirmed: roundDetails.creatorConfirmed,
              joinerConfirmed: roundDetails.joinerConfirmed,
              creatorChoice: roundDetails.creatorChoice,
              joinerChoice: roundDetails.joinerChoice,
              createdAt: new Date(basicDetails.createdAt.toNumber() * 1000)
            };
          } catch (error) {
            console.error(`Oyun detayları alınamadı (ID: ${id}):`, error);
            return null;
          }
        })
      );
      
      // null değerleri filtrele ve tarihe göre sırala
      const userGames = games
        .filter(game => game !== null)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(game => ({
          ...game,
          createdAt: game.createdAt.toLocaleString()
        }));

      console.log("Kullanıcı oyunları:", userGames);
      setMyGames(userGames);
      
    } catch (error) {
      console.error("Error loading user games:", error);
      setMyGames([]);
    }
  };

  const toggleAvailableGames = () => {
    setIsAvailableGamesOpen(!isAvailableGamesOpen);
  };

  const toggleUserGames = () => {
    setIsUserGamesOpen(!isUserGamesOpen);
  };

  const refreshAvailableGames = async () => {
    if (account && contract) {
      await loadAvailableGames(account, contract);
    }
  };

  const refreshUserGames = async () => {
    if (account && contract) {
      await loadUserGames(account, contract);
    }
  };

  // Oyun listelerini yenilemek için fonksiyon
  const refreshAllGames = async () => {
    if (!account || !contract) return;
    
    try {
      setLoading(true);
      
      // Tüm oyun listelerini yenile
      await Promise.all([
        loadAvailableGames(account, contract),
        loadUserGames(account, contract)
      ]);
      
      console.log("All game lists refreshed");
    } catch (error) {
      console.error("Error refreshing games:", error);
    } finally {
      setLoading(false);
    }
  };

  // Route değişikliklerini dinle ve gerekirse verileri yenile
  useEffect(() => {
    // Sayfa yüklendiğinde veya location değiştiğinde kontrol et
    console.log("Location changed:", location);
    const state = location.state as any;

    if (state?.refresh) {
      if (contract && account) {
        console.log("Refreshing data after navigation");
        refreshAllGames();
      }
    }

    // Eğer kayıtlı hesap varsa ve bağlantı korunacaksa
    if (state?.keepConnection) {
      const savedAccount = localStorage.getItem('connectedAccount');
      console.log("Keep connection flag detected, checking saved account:", savedAccount);
      
      if (savedAccount && !account) {
        console.log("Attempting to reconnect wallet after navigation");
        connectWallet();
      }
    }
  }, [location, contract, account]);

  // Cüzdan bağlandığında owner mı kontrol et
  useEffect(() => {
    const checkIfOwner = async () => {
      if (account && contract) {
        try {
          const contractOwner = await contract.owner();
          setIsOwner(contractOwner.toLowerCase() === account.toLowerCase());
        } catch (error) {
          console.error("Owner kontrolü yapılamadı:", error);
        }
      } else {
        setIsOwner(false);
      }
    };

    checkIfOwner();
  }, [account, contract]);

  // Available games için otomatik yenileme
  useEffect(() => {
    const fetchAvailableGames = async () => {
      if (!contract) return;
      
      try {
        const games = await contract.getAvailableGames();
        setAvailableGames(games);
      } catch (error) {
        console.error('Available games yenilenirken hata:', error);
      }
    };

    // İlk yükleme
    fetchAvailableGames();

    // 15 saniyede bir yenileme
    const interval = setInterval(fetchAvailableGames, 15000);

    // Component unmount olduğunda interval'i temizle
    return () => clearInterval(interval);
  }, [contract]);

  // Wallet connection section
  const renderWalletSection = () => {
    return (
      <div className="wallet-section">
        <div className="section-header">
          <h2>Wallet</h2>
        </div>
        <div className="wallet-info">
          <div className="wallet-left">
            <span className="wallet-label">Wallet Address</span>
            <span className="wallet-address">
              {account ? formatAddress(account) : "Wallet not connected"}
            </span>
          </div>
          <div className="wallet-right">
            {account ? (
              <>
                <button className="disconnect-button" onClick={disconnectWallet}>
                  Disconnect
                </button>
                {isOwner && (
                  <button className="admin-button" onClick={() => navigate('/admin')}>
                    Admin Panel
                  </button>
                )}
              </>
            ) : (
              <button className="connect-button" onClick={connectWallet}>
                <span className="connect-icon">⚡</span> Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <header>
        <div className="logo-container">
          <img src={logo} alt="Logo" className="header-logo" />
          <h1>ROCK PAPER SCISSORS</h1>
        </div>
        {renderWalletSection()}
      </header>

      <Routes>
        <Route path="/" element={
          <>
            <section className="bet-section">
              <h2>Select Bet Amount (STT)</h2>
              <div className="bet-options">
                <button 
                  className={`bet-button ${selectedPool === '0.5' ? 'selected' : ''}`}
                  onClick={() => setSelectedPool('0.5')}
                >
                  0.5 STT
                </button>
                <button 
                  className={`bet-button ${selectedPool === '1' ? 'selected' : ''}`}
                  onClick={() => setSelectedPool('1')}
                >
                  1 STT
                </button>
                <button 
                  className={`bet-button ${selectedPool === '5' ? 'selected' : ''}`}
                  onClick={() => setSelectedPool('5')}
                >
                  5 STT
                </button>
                <button 
                  className={`bet-button ${selectedPool === '10' ? 'selected' : ''}`}
                  onClick={() => setSelectedPool('10')}
                >
                  10 STT
                </button>
              </div>

              <div className="game-options">
                <button 
                  className="create-game-button pvp-button"
                  onClick={() => createGame(0)}
                  disabled={!account || loading}
                >
                  Create PvP Game
                </button>
                <button 
                  className="create-game-button bot-button"
                  onClick={() => createGame(1)}
                  disabled={!account || loading}
                >
                  Play Against Bot
                </button>
              </div>
            </section>

            <section className="games-section">
              <div className="section-header">
                <h2>Available Games</h2>
                <div className="section-controls">
                  <button className="refresh-button" onClick={refreshAvailableGames}>
                    Refresh
                  </button>
                  <button className="toggle-button" onClick={toggleAvailableGames}>
                    {isAvailableGamesOpen ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              {isAvailableGamesOpen && (
                <div className="available-games">
                  <div className="games-list">
                    {availableGames?.slice(0, 5).map((gameId: any) => (
                      <div key={gameId} className="game-item">
                        <span>Game #{gameId}</span>
                        <button 
                          onClick={() => joinGame(parseInt(gameId))}
                          disabled={loading}
                        >
                          Join
                        </button>
                      </div>
                    ))}
                    {(!availableGames || availableGames.length === 0) && (
                      <div className="no-games">No available games</div>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="games-section">
              <div className="section-header">
                <h2>My Games</h2>
                <div className="section-controls">
                  <button className="refresh-button" onClick={refreshUserGames}>
                    Refresh
                  </button>
                  <button className="toggle-button" onClick={toggleUserGames}>
                    {isUserGamesOpen ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              {isUserGamesOpen && (
                <table className="games-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Creator</th>
                      <th>Bet</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Result</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myGames.map((game) => (
                      <tr key={game.id}>
                        <td>{game.id}</td>
                        <td>{game.creator.slice(0, 6)}...{game.creator.slice(-4)}</td>
                        <td>{game.betAmount} STT</td>
                        <td>
                          <span className={`game-type-badge ${game.gameType === 1 ? 'bot-badge' : 'pvp-badge'}`}>
                            {game.gameType === 1 ? 'Bot' : 'PvP'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${getGameStatusClass(game)}`}>
                            {getGameStatus(game)}
                          </span>
                        </td>
                        <td>
                          {game.state === 2 && (
                            <span className={`status-badge ${
                              game.creatorWins > game.joinerWins 
                                ? (game.creator.toLowerCase() === account?.toLowerCase() ? 'status-won' : 'status-lost')
                                : game.joinerWins > game.creatorWins
                                  ? (game.creator.toLowerCase() === account?.toLowerCase() ? 'status-lost' : 'status-won')
                                  : 'status-draw'
                            }`}>
                              {game.creatorWins > game.joinerWins 
                                ? (game.creator.toLowerCase() === account?.toLowerCase() ? 'Won' : 'Lost')
                                : game.joinerWins > game.creatorWins
                                  ? (game.creator.toLowerCase() === account?.toLowerCase() ? 'Lost' : 'Won')
                                  : 'Draw'}
                            </span>
                          )}
                        </td>
                        <td>{game.createdAt}</td>
                        <td>
                          {game.state === 0 && game.creator.toLowerCase() === account?.toLowerCase() ? (
                            <button 
                              className="cancel-button"
                              onClick={() => cancelGame(parseInt(game.id))}
                              disabled={loading}
                            >
                              Cancel
                            </button>
                          ) : game.state === 1 ? (
                            <button 
                              className="play-button"
                              onClick={() => navigate(`/game/${game.id}`)}
                            >
                              Play
                            </button>
                          ) : (
                            <span className="completed-text">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {popup && (
              <Popup
                message={popup.message}
                type={popup.type}
                onClose={() => setPopup(null)}
              />
            )}
          </>
        } />
        <Route path="/game/:id" element={<GamePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/game/:id" element={<GamePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default AppWrapper;
