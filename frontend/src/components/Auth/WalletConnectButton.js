import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCodeIcon, LinkIcon, XMarkIcon } from '@heroicons/react/24/outline';

const WalletConnectButton = ({ onSuccess, mode = 'login' }) => {
  const [showQRModal, setShowQRModal] = useState(false);
  
  // TODO: Replace with your actual wallet QR code and link
  const walletQRData = "YOUR_WALLET_QR_CODE_DATA_HERE";
  const walletLink = "YOUR_WALLET_LINK_HERE";
  const walletAddress = "YOUR_WALLET_ADDRESS_HERE";

  const handleConnect = () => {
    setShowQRModal(true);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    alert('Wallet address copied to clipboard!');
  };

  const handleOpenLink = () => {
    window.open(walletLink, '_blank');
  };

  return (
    <>
      <button
        onClick={handleConnect}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
      >
        <QrCodeIcon className="w-5 h-5" />
        {mode === 'login' ? 'Login with Wallet' : 'Sign up with Wallet'}
      </button>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-exchange-card rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-exchange-text">Connect Wallet</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-1 hover:bg-exchange-bg rounded"
              >
                <XMarkIcon className="w-5 h-5 text-exchange-muted" />
              </button>
            </div>

            <div className="space-y-4">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg flex justify-center">
                <QRCodeSVG 
                  value={walletQRData} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Wallet Address */}
              <div className="bg-exchange-bg p-3 rounded-lg">
                <p className="text-sm text-exchange-muted mb-1">Wallet Address:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-exchange-text flex-1 break-all">
                    {walletAddress}
                  </code>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1 hover:bg-exchange-card rounded text-exchange-muted"
                    title="Copy address"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleOpenLink}
                  className="flex-1 btn btn-primary"
                >
                  Open Wallet
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Close
                </button>
              </div>

              <p className="text-xs text-exchange-muted text-center">
                Scan the QR code or click the link to connect your wallet
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletConnectButton;