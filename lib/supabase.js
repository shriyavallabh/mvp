/**
 * Supabase Client Configuration
 *
 * Usage:
 * - Use `supabase` for client-side operations (anon key)
 * - Use `supabaseAdmin` for server-side operations (service role key)
 */

import { createClient } from '@supabase/supabase-js'

// Public client (for client-side operations)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Admin client (for server-side operations only)
// ⚠️ WARNING: Only use this in API routes or server components
// Never expose the service role key to the client
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Example Usage in API Route:
 *
 * import { supabaseAdmin } from '@/lib/supabase'
 *
 * export async function POST(request) {
 *   const { data, error } = await supabaseAdmin
 *     .from('advisors')
 *     .insert([{ name: 'John Doe', email: 'john@example.com' }])
 *
 *   if (error) return NextResponse.json({ error: error.message }, { status: 500 })
 *   return NextResponse.json({ data })
 * }
 *
 * Example Usage in Client Component:
 *
 * "use client"
 * import { supabase } from '@/lib/supabase'
 *
 * export default function MyComponent() {
 *   const [data, setData] = useState([])
 *
 *   useEffect(() => {
 *     async function fetchData() {
 *       const { data, error } = await supabase
 *         .from('advisors')
 *         .select('*')
 *
 *       if (!error) setData(data)
 *     }
 *     fetchData()
 *   }, [])
 * }
 */
