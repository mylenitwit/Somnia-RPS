import React from 'react';
import './GameList.css';

interface Game {
  id: string;
  creator: string;
  betAmount: string;
  state: number;
  gameType: number;
  createdAt: string;
}

interface GameListProps {
  games: Game[];
  account: string;
  joinGame: (gameId: string) => void;
  cancelGame: (gameId: string) => void;
  loading: boolean;
  selectGame: (game: Game) => void;
  showActions: boolean;
}

const GameList: React.FC<GameListProps> = ({
  games,
  account,
  joinGame,
  cancelGame,
  loading,
  selectGame,
  showActions
}) => {
  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Get game state text
  const getGameState = (state: number) => {
    switch(state) {
      case 0: return 'Created';
      case 1: return 'Joined';
      case 2: return 'Completed';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  // Check if user is the creator of a game
  const isCreator = (creator: string) => {
    return creator.toLowerCase() === account.toLowerCase();
  };

  if (games.length === 0) {
    return (
      <div className="no-games">
        <p>No games available</p>
      </div>
    );
  }

  return (
    <div className="game-list">
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Creator</th>
              <th>Bet Amount</th>
              <th>Type</th>
              <th>Status</th>
              <th>Created</th>
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.id}>
                <td>{game.id}</td>
                <td>{formatAddress(game.creator)}</td>
                <td>{game.betAmount} STT</td>
                <td>
                  <span className={`game-type ${game.gameType === 0 ? 'pvp' : 'bot'}`}>
                    {game.gameType === 0 ? 'PvP' : 'Bot'}
                  </span>
                </td>
                <td>{getGameState(game.state)}</td>
                <td>{new Date(game.createdAt).toLocaleString()}</td>
                {showActions && (
                  <td className="actions">
                    {game.state === 0 && !isCreator(game.creator) && (
                      <button
                        className="action-button join"
                        onClick={() => joinGame(game.id)}
                        disabled={loading}
                      >
                        Join
                      </button>
                    )}
                    {game.state === 0 && isCreator(game.creator) && (
                      <button
                        className="action-button cancel"
                        onClick={() => cancelGame(game.id)}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    )}
                    {game.state === 1 && (
                      <button
                        className="action-button play"
                        onClick={() => selectGame(game)}
                        disabled={loading}
                      >
                        Play
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GameList; 