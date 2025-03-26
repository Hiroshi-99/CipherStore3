import React, { useState, useEffect } from 'react';
import { X, Server, MessageSquare, Info, Users, Loader, Copy, ExternalLink } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServerStatus {
  online: boolean;
  players: {
    online: number;
    max: number;
  };
  icon?: string;
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchServerStatus();
    }
  }, [isOpen]);

  const fetchServerStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      // Using mcapi.us to fetch Minecraft server status
      // Replace "play.ciphercraft.net" with your actual server address
      const response = await fetch('https://mcapi.us/server/status?ip=unicornmc.club');
      const data = await response.json();
      
      if (data.status === 'success') {
        setServerStatus({
          online: data.online,
          players: {
            online: data.players.now,
            max: data.players.max
          },
          icon: data.favicon
        });
      } else {
        throw new Error('Failed to fetch server status');
      }
    } catch (err) {
      setError('Could not connect to the Minecraft server');
      console.error('Error fetching server status:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedText(label);
        setTimeout(() => setCopiedText(null), 2000);
      })
      .catch(err => console.error('Failed to copy text: ', err));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800/95 rounded-2xl p-8 max-w-md w-full m-4 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Info className="text-emerald-400" size={28} />
          <h2 className="text-2xl font-bold text-white">About Us</h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <Server size={20} className="text-emerald-400 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">UnicornMC</h3>
                {loading && (
                  <Loader className="animate-spin text-emerald-400" size={16} />
                )}
              </div>
              
              {/* Clickable Server Address */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => copyToClipboard('unicornmc.club', 'server')}
                  className="text-gray-300 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <span>unicornmc.club</span>
                  <Copy size={14} />
                </button>
                {copiedText === 'server' && (
                  <span className="text-xs text-emerald-400">Copied!</span>
                )}
              </div>
              
              {/* Server Status */}
              <div className="mt-2">
                {error ? (
                  <p className="text-red-400 text-sm">{error}</p>
                ) : serverStatus ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${serverStatus.online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-gray-300">
                        {serverStatus.online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    
                    {serverStatus.online && (
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-emerald-400" />
                        <span className="text-sm text-gray-300">
                          {serverStatus.players.online}/{serverStatus.players.max} players
                        </span>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              
              {/* Server Icon */}
              {serverStatus?.icon && (
                <div className="mt-2 flex justify-center">
                  <img 
                    src={serverStatus.icon} 
                    alt="Server Icon" 
                    className="w-16 h-16 rounded-md border border-gray-700"
                  />
                </div>
              )}
              
              <p className="text-sm text-gray-400 mt-2">
                Join our UnicornMC server for an enhanced gameplay experience!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MessageSquare size={20} className="text-emerald-400 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white">Discord</h3>
              
              {/* Clickable Discord Link */}
              <div className="flex items-center gap-2">
                <a 
                  href="https://discord.gg/UddHeYzXJr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <span>contact us on Discord.</span>
                  <ExternalLink size={14} />
                </a>
              </div>
              
              <p className="text-sm text-gray-400 mt-1">Join our community for support, updates, and connect with other players.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-center text-gray-400 text-sm">
            For business inquiries or partnerships, contact us on Discord.
          </p>
        </div>
      </div>
    </div>
  );
} 