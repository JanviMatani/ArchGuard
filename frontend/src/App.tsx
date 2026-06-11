import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, GitBranch, Search, Zap, ChevronRight } from 'lucide-react';
import IndexPanel from './components/IndexPanel';
import AskPanel from './components/AskPanel';
import PRGuardPanel from './components/PRGuardPanel';

type Tab = 'index' | 'ask' | 'prguard';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('index');
  const [indexedRepo, setIndexedRepo] = useState<string>('');

  const tabs = [
    {
      id: 'index' as Tab,
      label: 'Index Repo',
      icon: <GitBranch size={16} />,
      description: 'Connect a GitHub repository'
    },
    {
      id: 'ask' as Tab,
      label: 'Ask WHY',
      icon: <Search size={16} />,
      description: 'Reason across decisions'
    },
    {
      id: 'prguard' as Tab,
      label: 'PR Guard',
      icon: <Shield size={16} />,
      description: 'Protect architecture'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* ── HEADER ── */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
        background: 'var(--bg-secondary)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, var(--accent), var(--green))',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={18} color="white" />
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            fontSize: '18px',
            letterSpacing: '-0.5px'
          }}>
            Arch<span style={{ color: 'var(--accent)' }}>Guard</span>
          </span>
        </div>

        {/* Status pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--green-dim)',
          border: '1px solid var(--green)',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '12px',
          color: 'var(--green)',
          fontFamily: 'var(--font-mono)'
        }}>
          <div style={{
            width: '6px', height: '6px',
            borderRadius: '50%',
            background: 'var(--green)',
            animation: 'pulse 2s infinite'
          }} />
          agent online
        </div>
      </header>

      {/* ── HERO ── */}
      <div style={{
        padding: '48px 32px 32px',
        maxWidth: '860px',
        margin: '0 auto',
        width: '100%'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent)',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '11px',
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
            marginBottom: '16px',
            letterSpacing: '0.5px'
          }}>
            <Zap size={10} />
            REASONING AGENT · MULTI-HOP RAG · PR GUARD
          </div>

          <h1 style={{
            fontSize: '42px',
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: '16px',
            letterSpacing: '-1px'
          }}>
            Why is your codebase<br />
            <span style={{
              background: 'linear-gradient(90deg, var(--accent), var(--green))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              the way it is?
            </span>
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '16px',
            lineHeight: 1.6,
            maxWidth: '560px'
          }}>
            ArchGuard reasons across your GitHub history — commits, PRs, issues —
            to reconstruct <em>why</em> architectural decisions were made.
            With citations.
          </p>
        </motion.div>

        {/* ── TABS ── */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginTop: '40px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id
                  ? '2px solid var(--accent)'
                  : '2px solid transparent',
                color: activeTab === tab.id
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-1px'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}
        <div style={{ marginTop: '32px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'index' && (
                <IndexPanel
                  onIndexed={(repo) => {
                    setIndexedRepo(repo);
                    setActiveTab('ask');
                  }}
                />
              )}
              {activeTab === 'ask' && (
                <AskPanel indexedRepo={indexedRepo} />
              )}
              {activeTab === 'prguard' && (
                <PRGuardPanel indexedRepo={indexedRepo} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border)',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        color: 'var(--text-dim)',
        fontSize: '12px',
        fontFamily: 'var(--font-mono)'
      }}>
        <span>archguard</span>
        <span>·</span>
        <span>agents league hackathon 2026</span>
        <span>·</span>
        <span style={{ color: 'var(--accent)' }}>reasoning agent</span>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}