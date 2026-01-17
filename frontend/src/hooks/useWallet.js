import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { authAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export const useWallet = () => {
  const [address, setAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [chainId, setChainId] = useState(null);

  const { walletLogin, isAuthenticated } = useAuthStore();

  // Check if MetaMask is installed
  useEffect(() => {
    const checkMetaMask = () => {
      const { ethereum } = window;
      setIsMetaMaskInstalled(!!ethereum && ethereum.isMetaMask);
    };

    checkMetaMask();

    // Check if already connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          }
        })
        .catch(console.error);

      // Get chain ID
      window.ethereum.request({ method: 'eth_chainId' })
        .then(chainId => setChainId(parseInt(chainId, 16)))
        .catch(console.error);
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        toast.error('Wallet disconnected');
      } else {
        setAddress(accounts[0]);
      }
    };

    const handleChainChanged = (chainId) => {
      setChainId(parseInt(chainId, 16));
      // Reload page on chain change as recommended by MetaMask
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask!');
      window.open('https://metamask.io/download/', '_blank');
      return null;
    }

    setIsConnecting(true);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const walletAddress = accounts[0];
      setAddress(walletAddress);

      toast.success('Wallet connected!');
      return walletAddress;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else {
        toast.error('Failed to connect wallet');
      }
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Sign message and authenticate
  const signAndAuthenticate = useCallback(async () => {
    if (!address) {
      const connectedAddress = await connectWallet();
      if (!connectedAddress) return { success: false };
    }

    const walletAddress = address || (await connectWallet());
    if (!walletAddress) return { success: false };

    setIsConnecting(true);

    try {
      // Step 1: Get nonce from backend
      const nonceResponse = await authAPI.getWalletNonce(walletAddress);
      const { nonce, message } = nonceResponse.data;

      // Step 2: Sign the message with MetaMask
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const signature = await signer.signMessage(message);

      // Step 3: Verify signature with backend and get JWT
      const result = await walletLogin(walletAddress, signature, nonce);

      if (result.success) {
        toast.success(result.isNewUser ? 'Account created with wallet!' : 'Logged in with wallet!');
        return { success: true, isNewUser: result.isNewUser };
      } else {
        toast.error(result.error || 'Authentication failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error during wallet authentication:', error);
      if (error.code === 4001) {
        toast.error('Signature rejected by user');
      } else {
        toast.error('Authentication failed');
      }
      return { success: false, error: error.message };
    } finally {
      setIsConnecting(false);
    }
  }, [address, connectWallet, walletLogin]);

  // Disconnect wallet (just clears local state)
  const disconnectWallet = useCallback(() => {
    setAddress(null);
    toast.success('Wallet disconnected');
  }, []);

  // Format address for display
  const formatAddress = useCallback((addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  return {
    address,
    isConnecting,
    isMetaMaskInstalled,
    chainId,
    connectWallet,
    disconnectWallet,
    signAndAuthenticate,
    formatAddress,
  };
};