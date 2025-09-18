const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cedpadbflumqvuwfhxoz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZHBhZGJmbHVtcXZ1d2ZoeG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjIwMzgsImV4cCI6MjA3MjM5ODAzOH0.KpCzOB4YPLYGFyIzjqf4FUTXKbTkONoViUbMzUq-zUA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugInteractions() {
  console.log('🔍 Debugging interactions...');

  // Find Randel Young's client ID
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, first_name, last_name, contacts')
    .ilike('first_name', '%randel%')
    .ilike('last_name', '%young%');

  if (clientError) {
    console.error('❌ Client error:', clientError);
    return;
  }

  console.log('👤 Found clients:', clients);

  if (clients && clients.length > 0) {
    const client = clients[0];
    console.log(`\n🎯 Looking for interactions for ${client.first_name} ${client.last_name} (ID: ${client.id})`);
    console.log(`📊 Client shows ${client.contacts} contacts`);

    // Get interactions for this client
    const { data: interactions, error: intError } = await supabase
      .from('interactions')
      .select('*')
      .eq('client_id', client.id)
      .order('interaction_date', { ascending: false })
      .limit(5);

    if (intError) {
      console.error('❌ Interaction error:', intError);
      return;
    }

    console.log(`\n📝 Found ${interactions?.length || 0} interactions:`);

    if (interactions && interactions.length > 0) {
      interactions.forEach((int, index) => {
        console.log(`\n${index + 1}. Date: ${int.interaction_date}`);
        console.log(`   Type: ${int.log_type || int.interaction_type || 'N/A'}`);
        console.log(`   Worker: ${int.outreach_user || int.worker_name || 'N/A'}`);
        console.log(`   Notes: ${int.notes?.substring(0, 50)}...`);
        console.log(`   Raw fields:`, Object.keys(int));
      });
    } else {
      console.log('❌ No interactions found');
    }
  }
}

debugInteractions().catch(console.error);