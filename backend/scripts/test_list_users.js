(async ()=>{
  require('dotenv').config();
  const BaseModel = require('../models/BaseModel');
  const User = new BaseModel('users');
  try{
    const users = await User.findAll('', [], 'id');
    console.log('Users count:', users.rows ? users.rows.length : users.length, users.rows ? users.rows.slice(0,3) : users.slice(0,3));
    process.exit(0);
  }catch(e){ console.error('Failed', e && e.message); process.exit(1); }
})();