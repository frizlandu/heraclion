(async ()=>{
  require('dotenv').config();
  const db = require('../config/database');
  try{
    const valSql = `
      SELECT COUNT(*) as nombre_articles,
             SUM(quantite_stock) as quantite_totale,
             SUM(quantite_stock * prix_achat) as valeur_achat,
             SUM(quantite_stock * prix_vente) as valeur_vente
      FROM stocks
    `;
    const valRes = await db.query(valSql);
    const valorisationRow = (valRes && Array.isArray(valRes.rows) && valRes.rows[0]) ? valRes.rows[0] : {};

    const year = parseInt(process.argv[2], 10) || new Date().getFullYear();
    const mouvSql = `
      SELECT EXTRACT(MONTH FROM date_mouvement)::int AS month, COALESCE(SUM(quantite),0) as mouvements
      FROM mouvements_stock
      WHERE EXTRACT(YEAR FROM date_mouvement) = $1
      GROUP BY month
      ORDER BY month
    `;
    let mouvements = Array.from({ length: 12 }).map((_, i) => ({ month: i+1, mouvements: 0 }));
    try{
      const mouvRes = await db.query(mouvSql, [year]);
      mouvRes.rows.forEach(r=>{ const idx = parseInt(r.month,10)-1; if(idx>=0&&idx<12) mouvements[idx].mouvements = Number(r.mouvements)||0; });
    }catch(e){ console.warn('mouvements_stock query failed', e && e.message); }

    const result = {
      valorisation: {
        nombre_articles: Number(valorisationRow.nombre_articles||0),
        quantite_totale: Number(valorisationRow.quantite_totale||0),
        valeur_achat: Number(valorisationRow.valeur_achat||0),
        valeur_vente: Number(valorisationRow.valeur_vente||0)
      },
      mouvements
    };

    console.log(JSON.stringify(result,null,2));
    process.exit(0);
  }catch(e){ console.error('Test failed', e && e.message); process.exit(1); }
})();