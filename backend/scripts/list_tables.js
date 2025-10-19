(async ()=>{
  const db = require('../config/database');
  try{
    const res = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    console.log('Tables:', res.rows.map(r=>r.table_name).join(', '));
    process.exit(0);
  }catch(e){
    console.error('List tables failed', e && e.message);
    process.exit(1);
  }
})();