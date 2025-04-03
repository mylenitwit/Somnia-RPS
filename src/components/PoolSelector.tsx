import React from 'react';
import './PoolSelector.css';

interface PoolSelectorProps {
  pools: string[];
  selectedPool: string;
  setSelectedPool: (pool: string) => void;
  loading: boolean;
}

const PoolSelector: React.FC<PoolSelectorProps> = ({
  pools,
  selectedPool,
  setSelectedPool,
  loading
}) => {
  return (
    <div className="pool-selector">
      <h2>Select Bet Amount (STT)</h2>
      <div className="pool-options">
        {pools.map((pool) => (
          <button
            key={pool}
            className={`pool-button ${selectedPool === pool ? 'selected' : ''}`}
            onClick={() => setSelectedPool(pool)}
            disabled={loading}
          >
            {pool} STT
          </button>
        ))}
      </div>
    </div>
  );
};

export default PoolSelector; 