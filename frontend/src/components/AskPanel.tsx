import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader, ExternalLink, ChevronDown, ChevronUp, Zap, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Citation {
  number: number;
  type: string;
  title: string;
  author: string;
  date: string;
  url: string;
  relevance_score: number;
}

interface ReasoningStep {
  step: string;
  input?: string;
  output?: string[];
  queries_used?: string[];
  documents_found?: number;
  top_sources?: string[];
  model_used?: string;
}

interface Answer {
  question: string;
  repo: string;
  answer: string;
  citations: Citation[];
  confidence: 'high' | 'medium' | 'low';
  reasoning_steps: ReasoningStep[];
}

interface Props {
  indexedRepo: string;
}

export default function AskPanel({ indexedRepo }: Props) {
  const [question, setQuestion] = useState('');
  const [repoName, setRepoName] = useState(indexedRepo || '');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState('');
  const [showSteps, setShowSteps] = useState(false);

  const suggestions = [
    'Why did React switch to Fiber architecture?',
    'Why was concurrent mode introduced?',
    'Why are hooks designed this way?',
    'What motivated the server components decision?'
  ];

  const askQuestion = async () => {
    if (!question.trim() || !repoName.trim()) return;
    setLoading(true);
    setError('');
    setAnswer(null);

    try {
      const res = await axios.post(`${API}/ask`, {
        repo_name: repoName,
        question: question
      });
      setAnswer(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Something went wrong. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const confidenceColor = {
    high: 'var(--green)',
    medium: 'var(--yellow)',
    low: 'var(--red)'
  };

  const typeColor: Record<string, string> = {
    commit: 'var(--accent)',
    pull_request: 'var(--green)',
    issue: 'var(--yellow)'
  };

  return (
    <div style={{ maxWidth: '720px' }}>

      {/* Repo input — only if not already indexed */}
      {!indexedRepo && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block', fontSize: '12px',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            marginBottom: '8px'
          }}>
            REPOSITORY (index it first)
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

      {/* Repo badge — if already indexed */}
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
          {indexedRepo} indexed and ready
        </div>
      )}

      {/* Question input */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block', fontSize: '12px',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          marginBottom: '8px',
          letterSpacing: '0.5px'
        }}>
          YOUR QUESTION
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{
              position: 'absolute', left: '14px', top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)'
            }} />
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askQuestion()}
              placeholder="Why was this architectural decision made?"
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '14px 14px 14px 42px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '15px',
                outline: 'none',
                transition: 'border 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <button
            onClick={askQuestion}
            disabled={loading || !question.trim()}
            style={{
              background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 24px',
              color: 'white',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {loading
              ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Reasoning...</>
              : <><Zap size={14} /> Ask WHY</>
            }
          </button>
        </div>
      </div>

      {/* Suggestions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => setQuestion(s)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px 10px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left'
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

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            background: 'var(--red-dim)',
            border: '1px solid var(--red)',
            borderRadius: '8px',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: '10px',
            color: 'var(--red)', fontSize: '14px',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <AlertCircle size={16} />
          {error}
        </motion.div>
      )}

      {/* Loading state */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px'
          }}
        >
          {['Decomposing question into search queries...', 'Searching vector database...', 'Retrieving relevant decisions...', 'Reasoning across evidence...', 'Generating cited answer...'].map((step, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.4 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: '12px',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: '12px', height: '12px' }}
              >
                <Loader size={12} color="var(--accent)" />
              </motion.div>
              {step}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Answer */}
      <AnimatePresence>
        {answer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Confidence + meta */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '12px', color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)'
              }}>
                {answer.citations.length} sources · {answer.reasoning_steps.length} reasoning steps
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px',
                color: confidenceColor[answer.confidence],
                fontFamily: 'var(--font-mono)',
                background: `${confidenceColor[answer.confidence]}22`,
                border: `1px solid ${confidenceColor[answer.confidence]}`,
                borderRadius: '4px',
                padding: '3px 8px'
              }}>
                confidence: {answer.confidence}
              </div>
            </div>

            {/* Answer text */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
              fontSize: '15px',
              lineHeight: 1.8,
              color: 'var(--text-primary)'
            }}>
              {answer.answer}
            </div>

            {/* Citations */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '12px', color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '10px',
                letterSpacing: '0.5px'
              }}>
                SOURCES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {answer.citations.map(c => (
                  <motion.a
                    key={c.number}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: c.number * 0.05 }}
                    style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      gap: '12px'
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      {/* Citation number */}
                      <div style={{
                        width: '22px', height: '22px',
                        borderRadius: '4px',
                        background: 'var(--accent-dim)',
                        border: '1px solid var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', color: 'var(--accent)',
                        fontFamily: 'var(--font-mono)',
                        flexShrink: 0
                      }}>
                        {c.number}
                      </div>

                      {/* Type badge */}
                      <div style={{
                        fontSize: '10px',
                        color: typeColor[c.type] || 'var(--text-dim)',
                        fontFamily: 'var(--font-mono)',
                        background: `${typeColor[c.type]}22` || 'var(--bg-hover)',
                        border: `1px solid ${typeColor[c.type]}` || 'var(--border)',
                        borderRadius: '3px',
                        padding: '2px 6px',
                        flexShrink: 0,
                        textTransform: 'uppercase'
                      }}>
                        {c.type.replace('_', ' ')}
                      </div>

                      {/* Title */}
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {c.title}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      {/* Score */}
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--text-dim)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {(c.relevance_score * 100).toFixed(0)}% match
                      </div>
                      <ExternalLink size={12} color="var(--text-dim)" />
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Reasoning steps toggle */}
            <button
              onClick={() => setShowSteps(!showSteps)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'none', border: 'none',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '8px 0',
                letterSpacing: '0.5px'
              }}
            >
              {showSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showSteps ? 'HIDE' : 'SHOW'} REASONING STEPS
            </button>

            <AnimatePresence>
              {showSteps && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginTop: '8px'
                  }}>
                    {answer.reasoning_steps.map((step, i) => (
                      <div key={i} style={{
                        marginBottom: i < answer.reasoning_steps.length - 1 ? '16px' : 0,
                        paddingBottom: i < answer.reasoning_steps.length - 1 ? '16px' : 0,
                        borderBottom: i < answer.reasoning_steps.length - 1
                          ? '1px solid var(--border)' : 'none'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--accent)',
                          fontFamily: 'var(--font-mono)',
                          marginBottom: '6px',
                          letterSpacing: '0.5px'
                        }}>
                          STEP {i + 1}: {step.step.toUpperCase()}
                        </div>
                        {step.output && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {step.output.map((q, j) => (
                              <span key={j} style={{
                                background: 'var(--accent-dim)',
                                border: '1px solid var(--accent)',
                                borderRadius: '4px',
                                padding: '2px 8px',
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                fontFamily: 'var(--font-mono)'
                              }}>
                                {q}
                              </span>
                            ))}
                          </div>
                        )}
                        {step.documents_found !== undefined && (
                          <div style={{
                            fontSize: '12px', color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {step.documents_found} documents retrieved
                          </div>
                        )}
                        {step.model_used && (
                          <div style={{
                            fontSize: '12px', color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            model: {step.model_used}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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