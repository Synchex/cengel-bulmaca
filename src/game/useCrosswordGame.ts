import { useState, useCallback, useRef, useEffect } from 'react';
import { CellData, Direction, GameState, LevelData, Word } from './types';

function buildGrid(level: LevelData): CellData[][] {
  const { gridSize, words } = level;
  const grid: CellData[][] = Array.from({ length: gridSize }, (_, r) =>
    Array.from({ length: gridSize }, (_, c) => ({
      row: r,
      col: c,
      letter: '',
      userLetter: '',
      isBlack: true,
      wordIds: [],
      isLocked: false,
      isRevealed: false,
    }))
  );

  for (const word of words) {
    for (let i = 0; i < word.answer.length; i++) {
      const r = word.direction === 'down' ? word.startRow + i : word.startRow;
      const c = word.direction === 'across' ? word.startCol + i : word.startCol;
      // Bounds check — skip words that somehow exceed grid dimensions
      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) continue;
      const cell = grid[r][c];
      cell.isBlack = false;
      cell.letter = word.answer[i];
      if (!cell.wordIds.includes(word.id)) {
        cell.wordIds.push(word.id);
      }
      if (i === 0) {
        cell.number = word.num;
      }
    }
  }
  return grid;
}

function getWordCells(word: Word): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = [];
  for (let i = 0; i < word.answer.length; i++) {
    cells.push({
      row: word.direction === 'down' ? word.startRow + i : word.startRow,
      col: word.direction === 'across' ? word.startCol + i : word.startCol,
    });
  }
  return cells;
}

export function useCrosswordGame(level: LevelData) {
  const wordMap = useRef<Map<string, Word>>(new Map());
  const [state, setState] = useState<GameState>(() => {
    const map = new Map<string, Word>();
    level.words.forEach((w) => map.set(w.id, w));
    wordMap.current = map;
    return {
      grid: buildGrid(level),
      selectedCell: null,
      selectedWordId: null,
      selectedDirection: 'across',
      score: 0,
      timeElapsed: 0,
      isComplete: false,
      lockedWordIds: new Set(),
    };
  });

  // Timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setState((s) => (s.isComplete ? s : { ...s, timeElapsed: s.timeElapsed + 1 }));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const selectCell = useCallback(
    (row: number, col: number) => {
      setState((s) => {
        const cell = s.grid[row]?.[col];
        if (!cell || cell.isBlack) return s;

        // If tapping the same cell, toggle direction
        if (s.selectedCell?.row === row && s.selectedCell?.col === col) {
          const otherDir: Direction = s.selectedDirection === 'across' ? 'down' : 'across';
          const otherWordId = cell.wordIds.find((id) => {
            const w = wordMap.current.get(id);
            return w?.direction === otherDir;
          });
          if (otherWordId) {
            return { ...s, selectedDirection: otherDir, selectedWordId: otherWordId };
          }
          return s;
        }

        // Find the best word for this cell
        let dir = s.selectedDirection;
        let wordId = cell.wordIds.find((id) => wordMap.current.get(id)?.direction === dir);
        if (!wordId) {
          dir = dir === 'across' ? 'down' : 'across';
          wordId = cell.wordIds.find((id) => wordMap.current.get(id)?.direction === dir);
        }

        return {
          ...s,
          selectedCell: { row, col },
          selectedWordId: wordId ?? null,
          selectedDirection: dir,
        };
      });
    },
    []
  );

  const typeLetter = useCallback(
    (letter: string) => {
      setState((s) => {
        if (!s.selectedCell || !s.selectedWordId) return s;
        const word = wordMap.current.get(s.selectedWordId);
        if (!word) return s;
        if (s.lockedWordIds.has(s.selectedWordId)) return s;

        const { row, col } = s.selectedCell;
        const cell = s.grid[row][col];
        if (cell.isLocked) return s;

        // Update cell
        const newGrid = s.grid.map((r) => r.map((c) => ({ ...c })));
        newGrid[row][col].userLetter = letter;

        // Advance to next cell in word
        const cells = getWordCells(word);
        const idx = cells.findIndex((c) => c.row === row && c.col === col);
        let nextCell = s.selectedCell;
        for (let i = idx + 1; i < cells.length; i++) {
          const nc = newGrid[cells[i].row][cells[i].col];
          if (!nc.isLocked) {
            nextCell = { row: cells[i].row, col: cells[i].col };
            break;
          }
        }

        return { ...s, grid: newGrid, selectedCell: nextCell };
      });
    },
    []
  );

  const backspace = useCallback(() => {
    setState((s) => {
      if (!s.selectedCell || !s.selectedWordId) return s;
      const word = wordMap.current.get(s.selectedWordId);
      if (!word) return s;
      if (s.lockedWordIds.has(s.selectedWordId)) return s;

      const { row, col } = s.selectedCell;
      const newGrid = s.grid.map((r) => r.map((c) => ({ ...c })));

      if (newGrid[row][col].userLetter) {
        newGrid[row][col].userLetter = '';
        return { ...s, grid: newGrid };
      }

      // Move back
      const cells = getWordCells(word);
      const idx = cells.findIndex((c) => c.row === row && c.col === col);
      if (idx > 0) {
        const prev = cells[idx - 1];
        if (!newGrid[prev.row][prev.col].isLocked) {
          newGrid[prev.row][prev.col].userLetter = '';
          return { ...s, grid: newGrid, selectedCell: { row: prev.row, col: prev.col } };
        }
      }
      return { ...s, grid: newGrid };
    });
  }, []);

  const checkWord = useCallback((): { result: 'correct' | 'wrong' | null; cells: Array<{ row: number; col: number; isCorrect: boolean }> } => {
    let result: 'correct' | 'wrong' | null = null;
    let cellResults: Array<{ row: number; col: number; isCorrect: boolean }> = [];
    setState((s) => {
      if (!s.selectedWordId) return s;
      const word = wordMap.current.get(s.selectedWordId);
      if (!word || s.lockedWordIds.has(s.selectedWordId)) return s;

      const cells = getWordCells(word);
      const userAnswer = cells.map((c) => s.grid[c.row][c.col].userLetter).join('');

      // Build per-cell correctness
      cellResults = cells.map((c) => ({
        row: c.row,
        col: c.col,
        isCorrect: s.grid[c.row][c.col].userLetter === s.grid[c.row][c.col].letter,
      }));

      if (userAnswer.length < word.answer.length) {
        result = 'wrong';
        return s;
      }

      if (userAnswer === word.answer) {
        result = 'correct';
        const newGrid = s.grid.map((r) => r.map((c) => ({ ...c })));
        cells.forEach((c) => {
          newGrid[c.row][c.col].isLocked = true;
        });
        const newLocked = new Set(s.lockedWordIds);
        newLocked.add(s.selectedWordId!);
        const isComplete = level.words.every((w) => newLocked.has(w.id));
        return {
          ...s,
          grid: newGrid,
          lockedWordIds: newLocked,
          score: s.score + word.answer.length * 10,
          isComplete,
        };
      }

      result = 'wrong';
      return s;
    });
    return { result, cells: cellResults };
  }, [level.words]);

  const revealHint = useCallback((): boolean => {
    let revealed = false;
    setState((s) => {
      if (!s.selectedWordId) return s;
      const word = wordMap.current.get(s.selectedWordId);
      if (!word || s.lockedWordIds.has(s.selectedWordId)) return s;

      const cells = getWordCells(word);
      const newGrid = s.grid.map((r) => r.map((c) => ({ ...c })));

      // Find first empty or wrong cell
      for (const c of cells) {
        const cell = newGrid[c.row][c.col];
        if (!cell.isLocked && cell.userLetter !== cell.letter) {
          cell.userLetter = cell.letter;
          cell.isRevealed = true;
          revealed = true;
          break;
        }
      }
      return { ...s, grid: newGrid };
    });
    return revealed;
  }, []);

  const getSelectedWordCells = useCallback((): Array<{ row: number; col: number }> => {
    if (!state.selectedWordId) return [];
    const word = wordMap.current.get(state.selectedWordId);
    if (!word) return [];
    return getWordCells(word);
  }, [state.selectedWordId]);

  const getStars = useCallback((): number => {
    // Stars are now computed at completion via rewards.ts
    return 0;
  }, []);

  return {
    state,
    selectCell,
    typeLetter,
    backspace,
    checkWord,
    revealHint,
    getSelectedWordCells,
    getStars,
    wordMap: wordMap.current,
  };
}
