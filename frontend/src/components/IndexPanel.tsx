import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Loader, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Props {
  onIndexed: (repo: string) => void;
}

export default function IndexPanel({ onIndexed }: Props) {
  const [repoName, setRepoName] = useState('facebook/react');
  const [status, setStatus] = useState<'idle' | 'loading' | 'polling' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const suggestions = [
    'facebook/react',
    'microsoft/vscode',
    'torvalds/linux',
    'vercel/next.js'
  ];

  const startIndexing = async () => {
    if (!repoName.trim()) return;
    setStatus('loading');
    setMessage('Sending request...');

    try {
      await axios.post(`${API}/index`, { repo_name: repoName });
      setStatus('polling');
      setMessage('Fetching commits, PRs, issues from GitHub...');
      pollStatus();
    } catch (e) {
      setStatus('error');
      setMessage('Failed to start indexing. Is the backend running?');
    }
  };

  const pollStatus = () => {
    const [owner, repo] = repoName.split('/');
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/status/${owner}/${repo}`);
        if (res.data.ready) {
          clearInterval(interval);
          setStatus('done');
          setMessage(`${repoName} is ready!`);
          setTimeout(() => onIndexed(repoName), 1000);
        } else if (res.data.status.startsWith('error')) {
          clearInterval(interval);
          setStatus('error');
          setMessage(res.data.status);
        } else {
          setMessage('Embedding documents into vector database...');
        }
      } catch {
        clearInterval(interval);
        setStatus('error');
        setMessage('Lost connection to backend.');
      }
    }, 3000);
  };

  return (
    <div style={{ maxWidth: '600px' }}>

      {/* Explanation */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '14px',
          lineHeight: 1.7
        }}>
          ArchGuard will fetch the repository's <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>commits</span>,{' '}
          <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>pull requests</span>, and{' '}
          <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>issues</span> — then embed them
          into a vector database so the reasoning agent can search across the entire decision history.
        </p>
      </div>

      {/* Input */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          marginBottom: '8px',
          letterSpacing: '0.5px'
        }}>
          GITHUB REPOSITORY
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <GitBranch
              size={16}
              style={{
                position: 'absolute', left: '12px', top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }}
            />
            <input
              value={repoName}
              onChange={e => setRepoName(e.target.value)}
              placeholder="owner/repository"
              disabled={status === 'loading' || status === 'polling'}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px 12px 12px 38px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <button
            onClick={startIndexing}
            disabled={status === 'loading' || status === 'polling' || status === 'done'}
            style={{
              background: status === 'done'
                ? 'var(--green)'
                : 'linear-gradient(135deg, var(--accent), #8b5cf6)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              color: 'white',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: status === 'loading' || status === 'polling' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: status === 'loading' || status === 'polling' ? 0.7 : 1,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {status === 'loading' || status === 'polling'
              ? <><Loader size={14} className="spin" /> Indexing...</>
              : status === 'done'
              ? <><CheckCircle size={14} /> Indexed!</>
              : <>Index Repo <ChevronRight size={14} /></>
            }
          </button>
        </div>
      </div>

      {/* Suggestions */}
      <div style={{
        display: 'flex', gap: '8px', flexWrap: 'wrap',
        marginBottom: '24px'
      }}>
        <span style={{
          fontSize: '12px', color: 'var(--text-dim)',
          fontFamily: 'var(--font-mono)', alignSelf: 'center'
        }}>
          try:
        </span>
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => setRepoName(s)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px 10px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.borderColor = 'var(--accent)';
              (e.target as HTMLElement).style.color = 'var(--accent)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.borderColor = 'var(--border)';
              (e.target as HTMLElement).style.color = 'var(--text-secondary)';
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Status */}
      {status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: status === 'error' ? 'var(--red-dim)' : 'var(--bg-card)',
            border: `1px solid ${status === 'error' ? 'var(--red)' : status === 'done' ? 'var(--green)' : 'var(--border)'}`,
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          {status === 'loading' || status === 'polling'
            ? <Loader size={16} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
            : status === 'done'
            ? <CheckCircle size={16} color="var(--green)" />
            : <AlertCircle size={16} color="var(--red)" />
          }
          <div>
            <div style={{
              fontSize: '13px',
              color: status === 'error' ? 'var(--red)' : status === 'done' ? 'var(--green)' : 'var(--text-primary)',
              fontFamily: 'var(--font-mono)'
            }}>
              {message}
            </div>
            {(status === 'loading' || status === 'polling') && (
              <div style={{
                marginTop: '8px',
                height: '3px',
                background: 'var(--border)',
                borderRadius: '2px',
                overflow: 'hidden',
                width: '300px'
              }}>
                <motion.div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--accent), var(--green))',
                    borderRadius: '2px'
                  }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}