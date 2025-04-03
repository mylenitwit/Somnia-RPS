import React from 'react';
import './WalletConnector.css';

interface WalletConnectorProps {
  account: string | null;
  connectWallet: () => void;
  loading: boolean;
}

const WalletConnector: React.FC<WalletConnectorProps> = ({
  account,
  connectWallet,
  loading
}) => {
  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="wallet-connector">
      {account ? (
        <div className="wallet-info">
          <span className="label">Connected Wallet:</span>
          <span className="address">{formatAddress(account)}</span>
        </div>
      ) : (
        <button
          className="connect-button"
          onClick={connectWallet}
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
};

export default WalletConnector; 