
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const SUPABASE_URL = 'https://ihknaaoelhwckuecatmz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__GNv7NbP2p-6TVpKqBe2-g_t6wbv6l3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
