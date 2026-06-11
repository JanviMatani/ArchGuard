import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Loader, CheckCircle, AlertTriangle, GitPullRequest } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Props {
  indexedRepo: string;
}

export default function PRGuardPanel({ indexedRepo }: Props) {
  const [repoName, setRepoName] = useState(indexedRepo || '');
  const [prTitle, setPrTitle] = useState('');
  const [prDescription, setPrDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const examples = [
    {
      title: 'Add synchronous rendering fallback',
      description: 'This PR adds a synchronous rendering mode for simpler components to improve perceived performance'
    },
    {
      title: 'Remove error boundaries from core',
      description: 'Simplify the codebase by removing error boundary logic and handling errors at app level instead'
    },
    {
      title: 'Replace reconciler with simpler stack algorithm',
      description: 'The Fiber reconciler is complex. This PR replaces it with a simpler stack-based approach'
    }
  ];

  const checkPR = async () => {
    if (!prTitle.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await axios.post(`${API}/pr-guard`, {
        repo_name: repoName || 'facebook/react',
        pr_title: prTitle,
        pr_description: prDescription
      });
      setResult(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px' }}>

      {/* Explanation */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start'
      }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'linear-gradient(135deg, var(--accent), var(--green))',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <Shield size={18} color="white" />
        </div>
        <div>
          <div style={{
            fontSize: '14px', fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '6px'
          }}>
            Proactive Architecture Protection
          </div>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            PR Guard checks if your new PR violates any past architectural decisions.
            In production, this runs automatically via <span style={{
              color: 'var(--accent)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px'
            }}>GitHub Actions</span> on every PR open.
          </p>
        </div>
      </div>

      {/* Repo */}
      {!indexedRepo && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block', fontSize: '12px',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            marginBottom: '8px'
          }}>
            REPOSITORY
          </label>
          <input
            value={repoName}
            onChange={e => setRepoName(e.target.value)}
            placeholder="facebook/react"
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
      )}

      {/* Repo badge */}
      {indexedRepo && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'var(--green-dim)',
          border: '1px solid var(--green)',
          borderRadius: '4px',
          padding: '4px 10px',
          fontSize: '12px',
          color: 'var(--green)',
          fontFamily: 'var(--font-mono)',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '6px', height: '6px',
            borderRadius: '50%',
            background: 'var(--green)'
          }} />
          {indexedRepo} indexed
        </div>
      )}

      {/* PR Title */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{
          display: 'block', fontSize: '12px',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          marginBottom: '8px',
          letterSpacing: '0.5px'
        }}>
          PR TITLE
        </label>
        <div style={{ position: 'relative' }}>
          <GitPullRequest size={16} style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-dim)'
          }} />
          <input
            value={prTitle}
            onChange={e => setPrTitle(e.target.value)}
            placeholder="Your pull request title..."
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '12px 12px 12px 38px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </div>

      {/* PR Description */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block', fontSize: '12px',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          marginBottom: '8px',
          letterSpacing: '0.5px'
        }}>
          PR DESCRIPTION (optional)
        </label>
        <textarea
          value={prDescription}
          onChange={e => setPrDescription(e.target.value)}
          placeholder="Describe what this PR does..."
          rows={3}
          style={{
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px 14px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
            transition: 'border 0.2s'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Example PRs */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontSize: '12px', color: 'var(--text-dim)',
          fontFamily: 'var(--font-mono)',
          marginBottom: '8px'
        }}>
          try these examples:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => {
                setPrTitle(ex.title);
                setPrDescription(ex.description);
              }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                (e.currentTarget).style.borderColor = 'var(--accent)';
                (e.currentTarget).style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                (e.currentTarget).style.borderColor = 'var(--border)';
                (e.currentTarget).style.color = 'var(--text-secondary)';
              }}
            >
              <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                PR:{' '}
              </span>
              {ex.title}
            </button>
          ))}
        </div>
      </div>

      {/* Check button */}
      <button
        onClick={checkPR}
        disabled={loading || !prTitle.trim()}
        style={{
          background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
          border: 'none',
          borderRadius: '8px',
          padding: '14px 28px',
          color: 'white',
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          fontSize: '14px',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: loading || !prTitle.trim() ? 0.6 : 1,
          transition: 'all 0.2s',
          marginBottom: '24px'
        }}
      >
        {loading
          ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Checking...</>
          : <><Shield size={14} /> Check PR Safety</>
        }
      </button>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            background: 'var(--red-dim)',
            border: '1px solid var(--red)',
            borderRadius: '8px',
            padding: '14px 16px',
            color: 'var(--red)',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {error}
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Safe / Warning banner */}
            <div style={{
              background: result.safe ? 'var(--green-dim)' : 'var(--red-dim)',
              border: `1px solid ${result.safe ? 'var(--green)' : 'var(--red)'}`,
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              marginBottom: '16px'
            }}>
              {result.safe
                ? <CheckCircle size={22} color="var(--green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                : <AlertTriangle size={22} color="var(--red)" style={{ flexShrink: 0, marginTop: '2px' }} />
              }
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: result.safe ? 'var(--green)' : 'var(--red)',
                  marginBottom: '6px'
                }}>
                  {result.safe ? '✓ Safe to merge' : '⚠ Architectural conflict detected'}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6
                }}>
                  {result.warning || result.recommendation}
                </div>
              </div>
            </div>

            {/* Similar past decisions */}
            {result.similar_past_decisions?.length > 0 && (
              <div>
                <div style={{
                  fontSize: '12px', color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '8px',
                  letterSpacing: '0.5px'
                }}>
                  RELATED PAST DECISIONS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {result.similar_past_decisions.map((d: string, i: number) => (
                    <div key={i} style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-sans)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '6px', height: '6px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        flexShrink: 0
                      }} />
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}