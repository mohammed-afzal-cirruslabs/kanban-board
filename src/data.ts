import { Column } from './types'

export const INITIAL_COLUMNS: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      { id: 'card-1', title: 'Research competitors', description: 'Look at Trello, Linear, and Notion board views for inspiration.' },
      { id: 'card-2', title: 'Define colour palette', description: 'Pick accessible primary and neutral tokens.' },
    ],
  },
  {
    id: 'inprogress',
    title: 'In Progress',
    cards: [
      { id: 'card-3', title: 'Build kanban board UI', description: 'React + dnd-kit implementation with drag-and-drop support.' },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [
      { id: 'card-4', title: 'Set up repo scaffold', description: 'Vite, TypeScript, Vitest, ESLint all wired up.' },
    ],
  },
]
