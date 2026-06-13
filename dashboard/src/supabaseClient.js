import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://micgachwnhoqqnnlesrj.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pY2dhY2h3bmhvcXFubmxlc3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjU0NjgsImV4cCI6MjA5Njc0MTQ2OH0.qGPuGJ0XH6ZClnd4wwNbp0sZkEAiT0H2zxdbT-m6hIA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
