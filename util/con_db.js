const supabase = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASEURL;
const supabaseKey = process.env.SECRETKEY;

const database = supabase.createClient(supabaseUrl, supabaseKey);

module.exports = database;