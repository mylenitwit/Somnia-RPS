import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import Popup from '../components/Popup';
import '../styles/AdminPage.css';

const RPS_CONTRACT_ADDRESS = "0x258c2a839823a898b6d294515fc3434b06fe590f";

interface GameHistory {
  gameId: number;
  creator: string;
  joiner: string;
  winner: string;
  betAmount: string;
  completedAt: string;
  gameType: number;
}

interface PopupState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contractBalance, setContractBalance] = useState('0');
  const [commissionCollected, setCommissionCollected] = useState('0');
  const [gameHistoryCount, setGameHistoryCount] = useState(0);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLimit] = useState(10);
  const [popup, setPopup] = useState<PopupState>({ show: false, message: '', type: 'info' });
  const [waitingGames, setWaitingGames] = useState<number[]>([]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        if (window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await provider.send("eth_requestAccounts", []);
          
          if (accounts && accounts.length > 0) {
            const signer = provider.getSigner();
            const rpsContract = new ethers.Contract(
              RPS_CONTRACT_ADDRESS,
              [
                "function owner() view returns (address)",
                "function getContractBalance() view returns (uint256)",
                "function getTotalCommissionCollected() view returns (uint256)",
                "function getGameHistoryCount() view returns (uint256)",
                "function getGameHistoryBatch(uint256 startIndex, uint256 count) view returns (uint256[] memory gameIds, address[] memory creators, address[] memory joiners, address[] memory winners, uint256[] memory betAmounts, uint256[] memory completedAts, uint8[] memory gameTypes)",
                "function adminDeposit() payable",
                "function adminWithdraw(uint256 amount)",
                "function adminCancelGame(uint256 gameId)",
                "function adminCancelAllWaitingGames()",
                "function getAvailableGames() view returns (uint256[])"
              ],
              signer
            );
            
            setAccount(accounts[0]);
            setContract(rpsContract);
            
            // Owner check
            const contractOwner = await rpsContract.owner();
            const isOwnerAccount = contractOwner.toLowerCase() === accounts[0].toLowerCase();
            setIsOwner(isOwnerAccount);

            if (!isOwnerAccount) {
              setPopup({
                show: true,
                message: 'You do not have access to this page! Only admin can access.',
                type: 'error'
              });
              setTimeout(() => {
                navigate('/');
              }, 3000);
              return;
            }

            // Load admin data
            await loadAdminData(rpsContract);
          }
        } else {
          setPopup({
            show: true,
            message: 'MetaMask is not installed! Please install MetaMask.',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setPopup({
          show: true,
          message: 'An error occurred: ' + (error as Error).message,
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  const loadAdminData = async (contract: ethers.Contract) => {
    try {
      setLoading(true);
      
      // Contract balance
      const balance = await contract.getContractBalance();
      setContractBalance(ethers.utils.formatEther(balance));
      
      // Total commission
      const commission = await contract.getTotalCommissionCollected();
      setCommissionCollected(ethers.utils.formatEther(commission));
      
      // Game history count
      const historyCount = await contract.getGameHistoryCount();
      setGameHistoryCount(Number(historyCount));
      
      // Get waiting games
      const availableGames = await contract.getAvailableGames();
      setWaitingGames(availableGames.map((game: any) => Number(game)));
      
      // Get game history
      await loadGameHistory(contract);
    } catch (error) {
      console.error('Data loading error:', error);
      setPopup({
        show: true,
        message: 'Error loading data: ' + (error as Error).message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGameHistory = async (contractToUse: ethers.Contract) => {
    try {
      const contractToCheck = contractToUse || contract;
      if (!contractToCheck) return;
      
      const startIndex = historyPage * historyLimit;
      const count = historyLimit;
      
      const historyData = await contractToCheck.getGameHistoryBatch(startIndex, count);
      
      const formattedHistory: GameHistory[] = [];
      for (let i = 0; i < historyData.gameIds.length; i++) {
        formattedHistory.push({
          gameId: Number(historyData.gameIds[i]),
          creator: historyData.creators[i],
          joiner: historyData.joiners[i],
          winner: historyData.winners[i],
          betAmount: ethers.utils.formatEther(historyData.betAmounts[i]),
          completedAt: new Date(Number(historyData.completedAts[i]) * 1000).toLocaleString(),
          gameType: Number(historyData.gameTypes[i])
        });
      }
      
      setGameHistory(formattedHistory);
    } catch (error) {
      console.error('Game history loading error:', error);
      setPopup({
        show: true,
        message: 'Error loading game history: ' + (error as Error).message,
        type: 'error'
      });
    }
  };

  const handleDeposit = async () => {
    if (!contract || !depositAmount) return;
    
    try {
      setLoading(true);
      const amountInWei = ethers.utils.parseEther(depositAmount);
      
      const tx = await contract.adminDeposit({ value: amountInWei });
      await tx.wait();
      
      setPopup({
        show: true,
        message: `${depositAmount} ETH successfully deposited!`,
        type: 'success'
      });
      
      // Refresh data
      await loadAdminData(contract);
      setDepositAmount('');
    } catch (error) {
      console.error('Deposit error:', error);
      setPopup({
        show: true,
        message: 'Error during deposit: ' + (error as Error).message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !withdrawAmount) return;
    
    try {
      setLoading(true);
      const amountInWei = ethers.utils.parseEther(withdrawAmount);
      
      const tx = await contract.adminWithdraw(amountInWei);
      await tx.wait();
      
      setPopup({
        show: true,
        message: `${withdrawAmount} ETH successfully withdrawn!`,
        type: 'success'
      });
      
      // Refresh data
      await loadAdminData(contract);
      setWithdrawAmount('');
    } catch (error) {
      console.error('Withdrawal error:', error);
      setPopup({
        show: true,
        message: 'Error during withdrawal: ' + (error as Error).message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGame = async (gameId: number) => {
    if (!contract) return;
    
    try {
      setLoading(true);
      
      const tx = await contract.adminCancelGame(gameId);
      await tx.wait();
      
      setPopup({
        show: true,
        message: `Game #${gameId} successfully cancelled!`,
        type: 'success'
      });
      
      // Refresh data
      await loadAdminData(contract);
    } catch (error) {
      console.error('Game cancellation error:', error);
      setPopup({
        show: true,
        message: 'Error cancelling game: ' + (error as Error).message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAllGames = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      
      const tx = await contract.adminCancelAllWaitingGames();
      await tx.wait();
      
      setPopup({
        show: true,
        message: 'All waiting games successfully cancelled!',
        type: 'success'
      });
      
      // Refresh data
      await loadAdminData(contract);
    } catch (error) {
      console.error('Mass cancellation error:', error);
      setPopup({
        show: true,
        message: 'Error cancelling games: ' + (error as Error).message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 0 || newPage * historyLimit >= gameHistoryCount) return;
    
    setHistoryPage(newPage);
    if (contract) {
      await loadGameHistory(contract);
    }
  };

  const refreshData = async () => {
    if (!contract) return;
    await loadAdminData(contract);
  };

  if (!isOwner) {
    return (
      <div className="admin-container">
        <h1>Admin Panel</h1>
        <p>Checking authorization...</p>
        {popup.show && <Popup message={popup.message} type={popup.type} onClose={() => setPopup({ ...popup, show: false })} />}
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1>Admin Panel</h1>
      
      <button className="btn back-btn" onClick={() => navigate('/')}>
        <i className="fas fa-arrow-left"></i> Return to Home
      </button>
      
      <button className="btn refresh-btn" onClick={refreshData} disabled={loading}>
        <i className="fas fa-sync-alt"></i> Refresh Data
      </button>
      
      <div className="admin-stats">
        <div className="stat-card">
          <h3>Contract Balance</h3>
          <p>{contractBalance} ETH</p>
        </div>
        <div className="stat-card">
          <h3>Total Commission</h3>
          <p>{commissionCollected} ETH</p>
        </div>
        <div className="stat-card">
          <h3>Total Games</h3>
          <p>{gameHistoryCount}</p>
        </div>
        <div className="stat-card">
          <h3>Waiting Games</h3>
          <p>{waitingGames.length}</p>
        </div>
      </div>
      
      <div className="admin-actions">
        <div className="section deposit-section">
          <h2>Deposit Funds</h2>
          <div className="input-group">
            <input
              type="number"
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="ETH amount"
            />
            <button className="btn action-btn" onClick={handleDeposit} disabled={loading || !depositAmount}>
              Deposit
            </button>
          </div>
        </div>
        
        <div className="section withdraw-section">
          <h2>Withdraw Funds</h2>
          <div className="input-group">
            <input
              type="number"
              step="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="ETH amount"
            />
            <button className="btn action-btn" onClick={handleWithdraw} disabled={loading || !withdrawAmount}>
              Withdraw
            </button>
          </div>
        </div>
      </div>
      
      <div className="waiting-games-section">
        <h2>Waiting Games</h2>
        {waitingGames.length === 0 ? (
          <p>No waiting games.</p>
        ) : (
          <>
            <button className="btn cancel-all-btn" onClick={handleCancelAllGames} disabled={loading}>
              Cancel All Waiting Games
            </button>
            <div className="waiting-games-list">
              {waitingGames.map((gameId) => (
                <div key={gameId} className="waiting-game-item">
                  <span>Game #{gameId}</span>
                  <button className="btn cancel-btn" onClick={() => handleCancelGame(gameId)} disabled={loading}>
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      <div className="game-history-section">
        <h2>Game History</h2>
        {gameHistory.length === 0 ? (
          <p>No game history found.</p>
        ) : (
          <>
            <table className="history-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Creator</th>
                  <th>Joiner</th>
                  <th>Winner</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {gameHistory.map((game) => (
                  <tr key={game.gameId}>
                    <td>{game.gameId}</td>
                    <td>{game.creator.substring(0, 6)}...{game.creator.substring(game.creator.length - 4)}</td>
                    <td>{game.joiner ? `${game.joiner.substring(0, 6)}...${game.joiner.substring(game.joiner.length - 4)}` : 'None'}</td>
                    <td>
                      {game.winner === "0x0000000000000000000000000000000000000000" 
                        ? 'Draw' 
                        : game.winner 
                          ? `${game.winner.substring(0, 6)}...${game.winner.substring(game.winner.length - 4)}`
                          : 'None'}
                    </td>
                    <td>{game.betAmount} ETH</td>
                    <td>{game.completedAt}</td>
                    <td>{game.gameType === 0 ? 'PvP' : 'Bot'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="pagination">
              <button 
                className="btn pagination-btn" 
                onClick={() => handlePageChange(historyPage - 1)} 
                disabled={historyPage === 0 || loading}
              >
                Previous
              </button>
              <span>Page {historyPage + 1} / {Math.ceil(gameHistoryCount / historyLimit) || 1}</span>
              <button 
                className="btn pagination-btn" 
                onClick={() => handlePageChange(historyPage + 1)} 
                disabled={(historyPage + 1) * historyLimit >= gameHistoryCount || loading}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
      
      {popup.show && <Popup message={popup.message} type={popup.type} onClose={() => setPopup({ ...popup, show: false })} />}
      
      {loading && <div className="loading-overlay">Processing...</div>}
    </div>
  );
};

export default AdminPage; 