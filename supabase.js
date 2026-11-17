import { createClient } from '@supabase/supabase-js'

// Бұл екі мән ашық (public) мәндер, сайт кодында болуы қалыпты жағдай.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://kfpehtjiicxgrgwadlgk.supabase.co'
const key = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_OKt-CsCK3FTDetM61mecNA_r18PX_-7'

export const supabase = createClient(url, key)
