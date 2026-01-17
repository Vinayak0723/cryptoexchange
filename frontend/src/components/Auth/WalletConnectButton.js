import React from 'react';
import { useWallet } from '../../hooks/useWallet';

const WalletConnectButton = ({ onSuccess, mode = 'login' }) => {
  const {
    address,
    isConnecting,
    isMetaMaskInstalled,
    signAndAuthenticate,
    formatAddress,
  } = useWallet();

  const handleClick = async () => {
    const result = await signAndAuthenticate();
    if (result.success && onSuccess) {
      onSuccess(result);
    }
  };

  if (!isMetaMaskInstalled) {
    return (
      <button
        onClick={() => window.open('https://metamask.io/download/', '_blank')}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
      >
        <MetaMaskIcon />
        Install MetaMask
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isConnecting}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <MetaMaskIcon />
      {isConnecting ? (
        'Connecting...'
      ) : address ? (
        `Continue as ${formatAddress(address)}`
      ) : mode === 'login' ? (
        'Login with MetaMask'
      ) : (
        'Sign up with MetaMask'
      )}
    </button>
  );
};

// MetaMask Fox Icon
const MetaMaskIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.6 2L13.5 8.1L15 4.5L21.6 2Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.4 2L10.4 8.2L9 4.5L2.4 2Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.6 16.8L16.5 20.1L21.1 21.4L22.5 16.9L18.6 16.8Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1.5 16.9L2.9 21.4L7.5 20.1L5.4 16.8L1.5 16.9Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.2 10.8L5.8 12.9L10.4 13.1L10.2 8.1L7.2 10.8Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.8 10.8L13.7 8L13.5 13.1L18.2 12.9L16.8 10.8Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 20.1L10.1 18.8L7.8 16.9L7.5 20.1Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.9 18.8L16.5 20.1L16.2 16.9L13.9 18.8Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default WalletConnectButton;