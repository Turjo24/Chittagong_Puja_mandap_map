export default function Flame({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 1.5c.9 3.2 5.2 5.2 5.2 10a5.2 5.2 0 0 1-10.4 0c0-2 1-3.4 2-4.6.9-1 1.9-2.3 3.2-5.4z" />
      <path d="M5 20.5h14c-.6 1.6-2.2 2.5-4 2.5H9c-1.8 0-3.4-.9-4-2.5z" opacity=".7" />
    </svg>
  )
}
