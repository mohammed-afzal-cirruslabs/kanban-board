import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '../types'
import styles from './KanbanCard.module.css'

interface Props {
  card: Card
  columnId: string
}

export function KanbanCard({ card }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={styles.card}
      aria-label={`Card: ${card.title}`}
      {...attributes}
      {...listeners}
    >
      <p className={styles.title}>{card.title}</p>
      {card.description && (
        <p className={styles.description}>{card.description}</p>
      )}
    </article>
  )
}
