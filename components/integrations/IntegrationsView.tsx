'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  Github, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Zap,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Integration } from '@/types';

export const IntegrationsView: React.FC = () => {
  const [state, store] = useAppStore();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const getProviderIcon = (provider: Integration['provider']) => {
    switch (provider) {
      case 'github':
        return Github;
      case 'slack':
        return MessageSquare;
      case 'google_calendar':
        return Calendar;
      case 'notion':
        return FileText;
      case 'linear':
        return Zap;
      default:
        return Sparkles;
    }
  };

  const handleToggleConnect = (intId: string) => {
    const updated = state.integrations.map(item => {
      if (item.id === intId) {
        return {
          ...item,
          connected: !item.connected,
          status: (!item.connected ? 'synced' : 'disconnected') as any
        };
      }
      return item;
    });

    store.setState({ integrations: updated });
  };

  const handleTestSync = (intId: string) => {
    setSyncingId(intId);
    setTimeout(() => {
      setSyncingId(null);
      const updated = state.integrations.map(item => {
        if (item.id === intId) {
          return {
            ...item,
            lastSync: 'Just now',
            status: 'synced' as const
          };
        }
        return item;
      });
      store.setState({ integrations: updated });
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200/70">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase text-zinc-500">
              Ecosystem Connectors
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-xs font-mono text-zinc-500">Extensible Webhook Architecture</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 font-sans">
            Connected Tool Integrations
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Bi-directional sync between external project hubs and AgentPilot WebMCP primitives.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Hackathon MVP: Mock/Demo Adapter Mode</span>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {state.integrations.map(item => {
          const Icon = getProviderIcon(item.provider);
          const isSyncing = syncingId === item.id;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-zinc-900">{item.name}</h3>
                        {item.isMock && (
                          <span className="text-[9px] font-mono uppercase bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200">
                            DEMO
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400 capitalize">
                        {item.provider}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleConnect(item.id)}
                    className="text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    {item.connected ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-zinc-300" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Status Box */}
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/60 font-mono text-[11px] space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Connection:</span>
                    <span className={item.connected ? 'text-emerald-700 font-bold' : 'text-zinc-400'}>
                      {item.connected ? 'Connected (Ready)' : 'Disconnected'}
                    </span>
                  </div>
                  {item.connected && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Last Sync:</span>
                      <span className="text-zinc-700 font-medium">{item.lastSync || 'Never'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-400">
                  Adapter: Webhook V2
                </span>

                {item.connected && (
                  <button
                    disabled={isSyncing}
                    onClick={() => handleTestSync(item.id)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Test Sync'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
