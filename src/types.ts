export interface Card {
  id: string
  title: string
  description?: string
}

export interface Column {
  id: string
  title: string
  cards: Card[]
}

export type ColumnId = string

export interface Todo {
  id: string
  title: string
  completed: boolean
}
