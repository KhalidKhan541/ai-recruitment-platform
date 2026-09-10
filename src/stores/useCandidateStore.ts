import { useState, useCallback } from 'react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  score?: number;
  resumeUrl?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CandidateState {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  loading: boolean;
  error: string | null;
  fetchCandidates: () => Promise<void>;
  addCandidate: (data: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCandidate: (id: string, data: Partial<Candidate>) => void;
  removeCandidate: (id: string) => void;
  selectCandidate: (candidate: Candidate | null) => void;
  filterByStage: (stage: Candidate['stage']) => Candidate[];
}

export function useCandidateStore(): CandidateState {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/candidates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch candidates');
      const data = await res.json();
      setCandidates(data.candidates || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const addCandidate = useCallback(
    (data: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newCandidate: Candidate = {
        ...data,
        id: Math.random().toString(36).slice(2),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCandidates((prev) => [newCandidate, ...prev]);
    },
    []
  );

  const updateCandidate = useCallback((id: string, data: Partial<Candidate>) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data, updatedAt: new Date() } : c))
    );
  }, []);

  const removeCandidate = useCallback((id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const selectCandidate = useCallback((candidate: Candidate | null) => {
    setSelectedCandidate(candidate);
  }, []);

  const filterByStage = useCallback(
    (stage: Candidate['stage']) => candidates.filter((c) => c.stage === stage),
    [candidates]
  );

  return {
    candidates,
    selectedCandidate,
    loading,
    error,
    fetchCandidates,
    addCandidate,
    updateCandidate,
    removeCandidate,
    selectCandidate,
    filterByStage,
  };
}
