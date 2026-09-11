import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "active" | "passive" | "hired" | "archived";
  skills: string[];
  experience: number;
  location: string;
}

interface CandidateStore {
  candidates: Candidate[];
  loading: boolean;
  error: string | null;
  selectedCandidate: Candidate | null;
  setCandidates: (candidates: Candidate[]) => void;
  addCandidate: (candidate: Candidate) => void;
  updateCandidate: (id: string, data: Partial<Candidate>) => void;
  removeCandidate: (id: string) => void;
  selectCandidate: (id: string) => void;
  filterByStatus: (status: Candidate["status"]) => Candidate[];
  searchCandidates: (query: string) => Candidate[];
}

function createCandidateStore(): CandidateStore {
  let candidates: Candidate[] = [];
  let loading = false;
  let error: string | null = null;
  let selectedCandidate: Candidate | null = null;

  return {
    get candidates() { return candidates; },
    get loading() { return loading; },
    get error() { return error; },
    get selectedCandidate() { return selectedCandidate; },

    setCandidates: (newCandidates: Candidate[]) => {
      candidates = newCandidates;
    },

    addCandidate: (candidate: Candidate) => {
      candidates = [...candidates, candidate];
    },

    updateCandidate: (id: string, data: Partial<Candidate>) => {
      candidates = candidates.map((c) =>
        c.id === id ? { ...c, ...data } : c
      );
    },

    removeCandidate: (id: string) => {
      candidates = candidates.filter((c) => c.id !== id);
    },

    selectCandidate: (id: string) => {
      selectedCandidate = candidates.find((c) => c.id === id) || null;
    },

    filterByStatus: (status: Candidate["status"]) => {
      return candidates.filter((c) => c.status === status);
    },

    searchCandidates: (query: string) => {
      const q = query.toLowerCase();
      return candidates.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    },
  };
}

describe("useCandidateStore", () => {
  let store: CandidateStore;

  beforeEach(() => {
    store = createCandidateStore();
  });

  it("starts with empty candidates", () => {
    expect(store.candidates).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it("sets candidates", () => {
    const candidates: Candidate[] = [
      { id: "1", firstName: "Alice", lastName: "Smith", email: "alice@test.com", status: "active", skills: ["TypeScript"], experience: 5, location: "Remote" },
      { id: "2", firstName: "Bob", lastName: "Jones", email: "bob@test.com", status: "passive", skills: ["Python"], experience: 3, location: "New York" },
    ];

    store.setCandidates(candidates);
    expect(store.candidates).toHaveLength(2);
  });

  it("adds a candidate", () => {
    const candidate: Candidate = {
      id: "3",
      firstName: "Charlie",
      lastName: "Brown",
      email: "charlie@test.com",
      status: "active",
      skills: ["React"],
      experience: 2,
      location: "San Francisco",
    };

    store.addCandidate(candidate);
    expect(store.candidates).toHaveLength(1);
    expect(store.candidates[0].firstName).toBe("Charlie");
  });

  it("updates a candidate", () => {
    store.setCandidates([
      { id: "1", firstName: "Alice", lastName: "Smith", email: "alice@test.com", status: "active", skills: [], experience: 5, location: "Remote" },
    ]);

    store.updateCandidate("1", { status: "hired" });
    expect(store.candidates[0].status).toBe("hired");
  });

  it("removes a candidate", () => {
    store.setCandidates([
      { id: "1", firstName: "Alice", lastName: "Smith", email: "alice@test.com", status: "active", skills: [], experience: 5, location: "Remote" },
      { id: "2", firstName: "Bob", lastName: "Jones", email: "bob@test.com", status: "active", skills: [], experience: 3, location: "NYC" },
    ]);

    store.removeCandidate("1");
    expect(store.candidates).toHaveLength(1);
    expect(store.candidates[0].id).toBe("2");
  });

  it("selects a candidate", () => {
    store.setCandidates([
      { id: "1", firstName: "Alice", lastName: "Smith", email: "alice@test.com", status: "active", skills: [], experience: 5, location: "Remote" },
    ]);

    store.selectCandidate("1");
    expect(store.selectedCandidate?.firstName).toBe("Alice");
  });

  it("filters candidates by status", () => {
    store.setCandidates([
      { id: "1", firstName: "Alice", status: "active", firstName: "Alice", lastName: "A", email: "a@test.com", skills: [], experience: 5, location: "R" } as any,
      { id: "2", firstName: "Bob", status: "hired", firstName: "Bob", lastName: "B", email: "b@test.com", skills: [], experience: 3, location: "NY" } as any,
      { id: "3", firstName: "Charlie", status: "active", firstName: "Charlie", lastName: "C", email: "c@test.com", skills: [], experience: 2, location: "SF" } as any,
    ]);

    const active = store.filterByStatus("active");
    expect(active).toHaveLength(2);
  });

  it("searches candidates by name", () => {
    store.setCandidates([
      { id: "1", firstName: "Alice", lastName: "Smith", email: "alice@test.com", status: "active", skills: [], experience: 5, location: "Remote" },
      { id: "2", firstName: "Bob", lastName: "Jones", email: "bob@test.com", status: "active", skills: [], experience: 3, location: "NYC" },
    ]);

    const results = store.searchCandidates("alice");
    expect(results).toHaveLength(1);
    expect(results[0].firstName).toBe("Alice");
  });

  it("searches candidates by email", () => {
    store.setCandidates([
      { id: "1", firstName: "Alice", lastName: "Smith", email: "alice@test.com", status: "active", skills: [], experience: 5, location: "Remote" },
      { id: "2", firstName: "Bob", lastName: "Jones", email: "bob@test.com", status: "active", skills: [], experience: 3, location: "NYC" },
    ]);

    const results = store.searchCandidates("bob@test");
    expect(results).toHaveLength(1);
    expect(results[0].email).toBe("bob@test.com");
  });

  it("returns empty for no search matches", () => {
    store.setCandidates([
      { id: "1", firstName: "Alice", lastName: "Smith", email: "alice@test.com", status: "active", skills: [], experience: 5, location: "Remote" },
    ]);

    const results = store.searchCandidates("nonexistent");
    expect(results).toHaveLength(0);
  });
});
