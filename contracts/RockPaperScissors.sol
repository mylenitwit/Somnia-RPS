// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RockPaperScissors is Ownable, ReentrancyGuard {
    enum GameType { PVP, BOT }
    enum Choice { NONE, ROCK, PAPER, SCISSORS }
    enum GameState { WAITING, ACTIVE, COMPLETED, CANCELLED }
    
    struct GameBasic {
        address creator;
        address joiner;
        uint256 betAmount;
        GameState state;
        GameType gameType;
        uint256 createdAt;
    }
    
    struct GameRound {
        uint8 currentRound;
        uint8 creatorWins;
        uint8 joinerWins;
        Choice creatorChoice;
        Choice joinerChoice;
        bool creatorConfirmed;
        bool joinerConfirmed;
        Choice[3] roundHistory;
    }
    

    struct GameHistory {
        uint256 gameId;
        address creator;
        address joiner;
        address winner;
        uint256 betAmount;
        uint256 completedAt;
        GameType gameType;
    }
    
    mapping(uint256 => GameBasic) public gameBasics;
    mapping(uint256 => GameRound) public gameRounds;
    uint256 public gameCount;
    uint256 public constant COMMISSION_RATE = 10;
    uint256 public constant MAX_ROUNDS = 3;
    

    uint256 public totalCommissionCollected; 
    GameHistory[] public gameHistory; 
    
    event GameCreated(uint256 indexed gameId, address indexed creator, uint256 betAmount, GameType gameType);
    event GameJoined(uint256 indexed gameId, address indexed joiner);
    event GameCancelled(uint256 indexed gameId, address indexed creator);
    event ChoiceMade(uint256 indexed gameId, address indexed player, Choice choice);
    event RoundCompleted(uint256 indexed gameId, address indexed winner, uint8 round);
    event GameCompleted(uint256 indexed gameId, address indexed winner, uint256 prize);
    

    event AdminDeposit(address indexed admin, uint256 amount);
    event AdminWithdraw(address indexed admin, uint256 amount);
    event AdminCancelledGame(uint256 indexed gameId);
    
    constructor() Ownable(msg.sender) {}
    

    function adminDeposit() external payable onlyOwner {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        emit AdminDeposit(msg.sender, msg.value);
    }
    

    function adminWithdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Withdraw amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient contract balance");
        
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdraw failed");
        
        emit AdminWithdraw(msg.sender, amount);
    }
    

    function adminCancelGame(uint256 gameId) external onlyOwner {
        GameBasic storage game = gameBasics[gameId];
        require(game.state == GameState.WAITING, "Game is not in waiting state");
        
        game.state = GameState.CANCELLED;
        

        (bool success, ) = game.creator.call{value: game.betAmount}("");
        require(success, "Transfer failed");
        
        emit AdminCancelledGame(gameId);
    }
    

    function adminCancelAllWaitingGames() external onlyOwner {
        for (uint256 i = 0; i < gameCount; i++) {
            GameBasic storage game = gameBasics[i];
            if (game.state == GameState.WAITING) {
                game.state = GameState.CANCELLED;
                

                (bool success, ) = game.creator.call{value: game.betAmount}("");
                require(success, "Transfer failed");
                
                emit AdminCancelledGame(i);
            }
        }
    }
    
    function getTotalCommissionCollected() external view onlyOwner returns (uint256) {
        return totalCommissionCollected;
    }

    function getGameHistoryCount() external view onlyOwner returns (uint256) {
        return gameHistory.length;
    }
    

    function getGameHistoryBatch(uint256 startIndex, uint256 count) external view onlyOwner 
        returns (
            uint256[] memory gameIds,
            address[] memory creators,
            address[] memory joiners,
            address[] memory winners,
            uint256[] memory betAmounts,
            uint256[] memory completedAts,
            uint8[] memory gameTypes
        ) 
    {
        require(startIndex < gameHistory.length, "Start index out of bounds");
        
        uint256 endIndex = startIndex + count;
        if (endIndex > gameHistory.length) {
            endIndex = gameHistory.length;
        }
        
        uint256 actualCount = endIndex - startIndex;
        
        gameIds = new uint256[](actualCount);
        creators = new address[](actualCount);
        joiners = new address[](actualCount);
        winners = new address[](actualCount);
        betAmounts = new uint256[](actualCount);
        completedAts = new uint256[](actualCount);
        gameTypes = new uint8[](actualCount);
        
        for (uint256 i = 0; i < actualCount; i++) {
            GameHistory memory game = gameHistory[startIndex + i];
            gameIds[i] = game.gameId;
            creators[i] = game.creator;
            joiners[i] = game.joiner;
            winners[i] = game.winner;
            betAmounts[i] = game.betAmount;
            completedAts[i] = game.completedAt;
            gameTypes[i] = uint8(game.gameType);
        }
        
        return (gameIds, creators, joiners, winners, betAmounts, completedAts, gameTypes);
    }
    
    function createGame(uint256 betAmount) external payable nonReentrant {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(msg.value == betAmount, "Sent amount must match bet amount");
        
        uint256 gameId = gameCount++;
        gameBasics[gameId] = GameBasic({
            creator: msg.sender,
            joiner: address(0),
            betAmount: msg.value,
            state: GameState.WAITING,
            gameType: GameType.PVP,
            createdAt: block.timestamp
        });
        
        gameRounds[gameId] = GameRound({
            currentRound: 0,
            creatorWins: 0,
            joinerWins: 0,
            creatorChoice: Choice.NONE,
            joinerChoice: Choice.NONE,
            creatorConfirmed: false,
            joinerConfirmed: false,
            roundHistory: [Choice.NONE, Choice.NONE, Choice.NONE]
        });
        
        emit GameCreated(gameId, msg.sender, msg.value, GameType.PVP);
    }
    

    function createGameWithType(uint8 gameType, uint256 betAmount) external payable nonReentrant {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(msg.value == betAmount, "Sent amount must match bet amount");
        require(gameType < 2, "Invalid game type");
        
        GameType actualGameType = GameType(gameType);
        

        if (actualGameType == GameType.BOT) {
            require(address(this).balance >= betAmount * 2, "Insufficient contract balance for bot game");
        }
        
        uint256 gameId = gameCount++;
        gameBasics[gameId] = GameBasic({
            creator: msg.sender,
            joiner: actualGameType == GameType.BOT ? address(this) : address(0), 
            betAmount: msg.value,
            state: actualGameType == GameType.BOT ? GameState.ACTIVE : GameState.WAITING,
            gameType: actualGameType,
            createdAt: block.timestamp
        });
        
        gameRounds[gameId] = GameRound({
            currentRound: 0,
            creatorWins: 0,
            joinerWins: 0,
            creatorChoice: Choice.NONE,
            joinerChoice: Choice.NONE,
            creatorConfirmed: false,
            joinerConfirmed: false,
            roundHistory: [Choice.NONE, Choice.NONE, Choice.NONE]
        });
        
        emit GameCreated(gameId, msg.sender, msg.value, actualGameType);
        

        if (actualGameType == GameType.BOT) {
            emit GameJoined(gameId, address(this));
        }
    }
    
    function joinGame(uint256 gameId) external payable nonReentrant {
        GameBasic storage game = gameBasics[gameId];
        require(game.state == GameState.WAITING, "Game is not available");
        require(msg.value == game.betAmount, "Incorrect bet amount");
        require(msg.sender != game.creator, "Cannot join your own game");
        
        game.joiner = msg.sender;
        game.state = GameState.ACTIVE;
        
        emit GameJoined(gameId, msg.sender);
    }
    
    function cancelGame(uint256 gameId) external nonReentrant {
        GameBasic storage game = gameBasics[gameId];
        require(game.state == GameState.WAITING, "Game is not cancellable");
        require(msg.sender == game.creator, "Only creator can cancel");
        
        game.state = GameState.CANCELLED;
        
        // Return bet to creator
        (bool success, ) = game.creator.call{value: game.betAmount}("");
        require(success, "Transfer failed");
        
        emit GameCancelled(gameId, msg.sender);
    }
    
    function makeChoice(uint256 gameId, Choice choice) external nonReentrant {
        GameBasic storage game = gameBasics[gameId];
        GameRound storage round = gameRounds[gameId];
        
        require(game.state == GameState.ACTIVE, "Game is not active");
        require(choice != Choice.NONE, "Invalid choice");
        
        if (msg.sender == game.creator) {
            require(!round.creatorConfirmed, "Creator already made choice");
            round.creatorChoice = choice;
            round.creatorConfirmed = true;
        } else if (msg.sender == game.joiner) {
            require(!round.joinerConfirmed, "Joiner already made choice");
            round.joinerChoice = choice;
            round.joinerConfirmed = true;
        } else {
            revert("Not a player in this game");
        }
        
        emit ChoiceMade(gameId, msg.sender, choice);
        

        if (game.gameType == GameType.BOT && game.joiner == address(this) && round.creatorConfirmed && !round.joinerConfirmed) {

            uint256 randomChoice = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, gameId, round.currentRound))) % 3 + 1;
            round.joinerChoice = Choice(randomChoice);
            round.joinerConfirmed = true;
            
            emit ChoiceMade(gameId, game.joiner, Choice(randomChoice));
        }
        

        if (game.gameType == GameType.BOT && game.creator != address(this) && round.creatorConfirmed && round.joinerConfirmed) {
            _processRound(gameId);
        }

        else if (round.creatorConfirmed && round.joinerConfirmed) {
            _processRound(gameId);
        }
    }
    
    function _processRound(uint256 gameId) private {
        GameRound storage round = gameRounds[gameId];
        
        require(round.creatorConfirmed && round.joinerConfirmed, "Both players must confirm");
        
        if (round.currentRound < 3) {
            round.roundHistory[round.currentRound] = round.creatorChoice;
        }
        
        address winner = _determineWinner(round.creatorChoice, round.joinerChoice);
        
        if (winner == address(0)) {
            round.creatorWins++;
            round.joinerWins++;
        } else if (winner == address(1)) {
            round.creatorWins++;
        } else if (winner == address(2)) {
            round.joinerWins++;
        }
        
        round.currentRound++;
        round.creatorChoice = Choice.NONE;
        round.joinerChoice = Choice.NONE;
        round.creatorConfirmed = false;
        round.joinerConfirmed = false;
        
        emit RoundCompleted(gameId, winner, round.currentRound);
        
if (round.currentRound >= MAX_ROUNDS || 
    round.creatorWins >= 3 || 
    round.joinerWins >= 3) {
    _completeGame(gameId);
}
        
        GameBasic storage game = gameBasics[gameId];
        if (game.gameType == GameType.BOT && game.state == GameState.ACTIVE && game.joiner == address(this)) {
            // Bot logic
        }
    }
    
    function _determineWinner(Choice choice1, Choice choice2) private pure returns (address) {
        if (choice1 == choice2) return address(0);
        
        if ((choice1 == Choice.ROCK && choice2 == Choice.SCISSORS) ||
            (choice1 == Choice.PAPER && choice2 == Choice.ROCK) ||
            (choice1 == Choice.SCISSORS && choice2 == Choice.PAPER)) {
            return address(1); 
        }
        
        return address(2); 
    }
    
    function _completeGame(uint256 gameId) private {
        GameBasic storage game = gameBasics[gameId];
        GameRound storage round = gameRounds[gameId];
        game.state = GameState.COMPLETED;
        
        uint256 totalPrize = game.betAmount * 2; 
        uint256 commission = (totalPrize * COMMISSION_RATE) / 100; 
        uint256 winnerPrize = totalPrize - commission; 
        
        address winner;
        if (round.creatorWins > round.joinerWins) {
            winner = game.creator;
        } else if (round.joinerWins > round.creatorWins) {
            winner = game.joiner;
        } else {

            if (game.gameType == GameType.PVP) {

                (bool success1, ) = game.creator.call{value: game.betAmount}("");
                (bool success2, ) = game.joiner.call{value: game.betAmount}("");
                require(success1 && success2, "Transfer failed");
            } else if (game.gameType == GameType.BOT) {

                (bool success, ) = game.creator.call{value: game.betAmount}("");
                require(success, "Transfer failed");
            }
            

            gameHistory.push(GameHistory({
                gameId: gameId,
                creator: game.creator,
                joiner: game.joiner,
                winner: address(0),
                betAmount: game.betAmount,
                completedAt: block.timestamp,
                gameType: game.gameType
            }));
            
            emit GameCompleted(gameId, address(0), 0);
            return;
        }
        

        totalCommissionCollected += commission;
        
        if (game.gameType == GameType.PVP) {

            (bool success3, ) = owner().call{value: commission}("");
            require(success3, "Commission transfer failed");
            

            (bool success4, ) = winner.call{value: winnerPrize}("");
            require(success4, "Prize transfer failed");
        } else if (game.gameType == GameType.BOT) {

            if (winner == game.creator) {

                (bool success, ) = winner.call{value: winnerPrize}("");
                require(success, "Prize transfer failed");
                

                (bool success2, ) = owner().call{value: commission}("");
                require(success2, "Commission transfer failed");
            }
 
        }
        

        gameHistory.push(GameHistory({
            gameId: gameId,
            creator: game.creator,
            joiner: game.joiner,
            winner: winner,
            betAmount: game.betAmount,
            completedAt: block.timestamp,
            gameType: game.gameType
        }));
        
        emit GameCompleted(gameId, winner, winnerPrize);
    }
    
    function getGameBasicDetails(uint256 gameId) external view returns (
        address creator,
        address joiner,
        uint256 betAmount,
        GameState state,
        GameType gameType,
        uint256 createdAt
    ) {
        GameBasic storage game = gameBasics[gameId];
        return (
            game.creator,
            game.joiner,
            game.betAmount,
            game.state,
            game.gameType,
            game.createdAt
        );
    }

    function getGameRoundDetails(uint256 gameId) external view returns (
        uint8 currentRound,
        uint8 creatorWins,
        uint8 joinerWins,
        Choice creatorChoice,
        Choice joinerChoice,
        bool creatorConfirmed,
        bool joinerConfirmed,
        Choice[3] memory roundHistory
    ) {
        GameRound storage round = gameRounds[gameId];
        return (
            round.currentRound,
            round.creatorWins,
            round.joinerWins,
            round.creatorChoice,
            round.joinerChoice,
            round.creatorConfirmed,
            round.joinerConfirmed,
            round.roundHistory
        );
    }
    
    function getUserGames(address user) external view returns (uint256[] memory) {
        uint256[] memory temp = new uint256[](gameCount);
        uint256 count = 0;
        
        for (uint256 i = 0; i < gameCount; i++) {
            if (gameBasics[i].creator == user || gameBasics[i].joiner == user) {
                temp[count++] = i;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        
        return result;
    }
    
    function getAvailableGames() external view returns (uint256[] memory) {
        uint256[] memory temp = new uint256[](gameCount);
        uint256 count = 0;
        
        for (uint256 i = 0; i < gameCount; i++) {
            if (gameBasics[i].state == GameState.WAITING) {
                temp[count++] = i;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        
        return result;
    }
    

    function getContractBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }
} 