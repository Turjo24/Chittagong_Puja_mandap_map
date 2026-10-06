import { useEffect } from 'react'
import { sb } from './supabase'
import Toasts from './Toasts'
import { toast } from './alerts'
export default function Live() {
  useEffect(() => {
    const ch = sb.channel('pub-notices')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices' }, (p) => {
        toast(p.new.title, p.new.body); dispatchEvent(new Event('notice-new'))
      }).subscribe()
    return () => { sb.removeChannel(ch) }
  }, [])
  return <Toasts />
}
