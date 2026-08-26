const { Workbook } = require('exceljs');
const fs = require('fs');
const path = require('path');

async function main() {
  const wb = new Workbook();
  await wb.xlsx.readFile('dataset.xlsx');
  const ws = wb.getWorksheet('Dataset');

  if (!ws || ws.rowCount < 2) {
    console.log('No data in worksheet');
    return;
  }

  // Read headers
  const headers = {};
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[cell.value] = colNumber;
  });

  // Read all rows
  const rows = [];
  for (let i = 2; i <= ws.rowCount; i++) {
    const row = ws.getRow(i);
    const obj = {};
    for (const [key, colNum] of Object.entries(headers)) {
      let val = row.getCell(colNum).value;
      if (val && typeof val === 'object' && 'result' in val) val = val.result;
      obj[key] = val;
    }
    // Skip empty rows
    if (obj.listing_id) rows.push(obj);
  }

  console.log(`\n========== DATASET OVERVIEW ==========`);
  console.log(`Total rows in xlsx: ${ws.rowCount - 1}`);
  console.log(`Rows with listing_id: ${rows.length}`);
  console.log(`Columns: ${Object.keys(headers).length}`);
  console.log(`Column names: ${Object.keys(headers).join(', ')}`);

  // ========== 1. COUNT BY PROPERTY TYPE ==========
  console.log(`\n========== COUNT BY PROPERTY TYPE ==========`);
  const propTypeCounts = {};
  for (const r of rows) {
    const pt = r.property_type || 'NULL';
    propTypeCounts[pt] = (propTypeCounts[pt] || 0) + 1;
  }
  for (const [k, v] of Object.entries(propTypeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v} (${(v / rows.length * 100).toFixed(1)}%)`);
  }

  // ========== 2. COUNT BY PURPOSE ==========
  console.log(`\n========== COUNT BY PURPOSE ==========`);
  const purposeCounts = {};
  for (const r of rows) {
    const p = r.purpose || 'NULL';
    purposeCounts[p] = (purposeCounts[p] || 0) + 1;
  }
  for (const [k, v] of Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v} (${(v / rows.length * 100).toFixed(1)}%)`);
  }

  // ========== 3. COUNT BY GOVERNORATE ==========
  console.log(`\n========== COUNT BY GOVERNORATE ==========`);
  const govCounts = {};
  for (const r of rows) {
    const g = r.governorate || 'NULL';
    govCounts[g] = (govCounts[g] || 0) + 1;
  }
  for (const [k, v] of Object.entries(govCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v} (${(v / rows.length * 100).toFixed(1)}%)`);
  }

  // ========== 4. PRICE DISTRIBUTION BY PROPERTY TYPE ==========
  console.log(`\n========== PRICE DISTRIBUTION BY PROPERTY TYPE ==========`);
  const priceByType = {};
  for (const r of rows) {
    const pt = r.property_type || 'NULL';
    const price = typeof r.price === 'number' ? r.price : null;
    if (price !== null && price > 0) {
      if (!priceByType[pt]) priceByType[pt] = [];
      priceByType[pt].push(price);
    }
  }
  for (const [type, prices] of Object.entries(priceByType).sort((a, b) => b[1].length - a[1].length)) {
    prices.sort((a, b) => a - b);
    const n = prices.length;
    const min = prices[0];
    const max = prices[n - 1];
    const median = n % 2 === 0 ? (prices[n / 2 - 1] + prices[n / 2]) / 2 : prices[Math.floor(n / 2)];
    const mean = prices.reduce((a, b) => a + b, 0) / n;
    console.log(`  ${type} (n=${n}):`);
    console.log(`    Min: EGP ${min.toLocaleString()}`);
    console.log(`    Max: EGP ${max.toLocaleString()}`);
    console.log(`    Median: EGP ${median.toLocaleString()}`);
    console.log(`    Mean: EGP ${Math.round(mean).toLocaleString()}`);
  }

  // ========== 5. PRICE DISTRIBUTION OVERALL ==========
  console.log(`\n========== PRICE DISTRIBUTION (ALL) ==========`);
  const allPrices = rows.map(r => r.price).filter(p => typeof p === 'number' && p > 0).sort((a, b) => a - b);
  console.log(`  Listings with valid price: ${allPrices.length} / ${rows.length}`);
  if (allPrices.length > 0) {
    const n = allPrices.length;
    console.log(`  Min: EGP ${allPrices[0].toLocaleString()}`);
    console.log(`  Max: EGP ${allPrices[n - 1].toLocaleString()}`);
    console.log(`  Median: EGP ${(n % 2 === 0 ? (allPrices[n / 2 - 1] + allPrices[n / 2]) / 2 : allPrices[Math.floor(n / 2)]).toLocaleString()}`);
    console.log(`  Mean: EGP ${Math.round(allPrices.reduce((a, b) => a + b, 0) / n).toLocaleString()}`);
    // Percentiles
    const p25 = allPrices[Math.floor(n * 0.25)];
    const p75 = allPrices[Math.floor(n * 0.75)];
    console.log(`  25th percentile: EGP ${p25.toLocaleString()}`);
    console.log(`  75th percentile: EGP ${p75.toLocaleString()}`);
  }

  // ========== 6. GROUP B DATA POPULATED ==========
  console.log(`\n========== GROUP B DATA COMPLETENESS ==========`);
  const groupBFields = ['compound_name', 'developer_name', 'finishing_level', 'delivery_status', 'payment_type', 'amenities'];
  const groupBCounts = {};
  let allGroupBPopulated = 0;
  for (const field of groupBFields) {
    let count = 0;
    for (const r of rows) {
      const val = r[field];
      if (val !== null && val !== undefined && val !== '' && val !== 'null') {
        count++;
      }
    }
    groupBCounts[field] = count;
    console.log(`  ${field}: ${count} / ${rows.length} (${(count / rows.length * 100).toFixed(1)}%)`);
  }
  // Count rows where ALL group B fields are populated
  for (const r of rows) {
    const allPopulated = groupBFields.every(f => {
      const val = r[f];
      return val !== null && val !== undefined && val !== '' && val !== 'null';
    });
    if (allPopulated) allGroupBPopulated++;
  }
  console.log(`  ALL Group B fields populated: ${allGroupBPopulated} / ${rows.length} (${(allGroupBPopulated / rows.length * 100).toFixed(1)}%)`);

  // ========== 7. PRICE PER SQM BY GOVERNORATE ==========
  console.log(`\n========== PRICE PER SQM BY GOVERNORATE ==========`);
  const ppsByGov = {};
  for (const r of rows) {
    const gov = r.governorate || 'NULL';
    const price = typeof r.price === 'number' ? r.price : null;
    const area = typeof r.area_sqm === 'number' ? r.area_sqm : null;
    if (price && area && area > 0) {
      const pps = price / area;
      if (!ppsByGov[gov]) ppsByGov[gov] = [];
      ppsByGov[gov].push(pps);
    }
  }
  for (const [gov, values] of Object.entries(ppsByGov).sort((a, b) => b[1].length - a[1].length)) {
    values.sort((a, b) => a - b);
    const n = values.length;
    const median = n % 2 === 0 ? (values[n / 2 - 1] + values[n / 2]) / 2 : values[Math.floor(n / 2)];
    const mean = values.reduce((a, b) => a + b, 0) / n;
    console.log(`  ${gov} (n=${n}):`);
    console.log(`    Min: EGP ${Math.round(values[0]).toLocaleString()}/sqm`);
    console.log(`    Max: EGP ${Math.round(values[n - 1]).toLocaleString()}/sqm`);
    console.log(`    Median: EGP ${Math.round(median).toLocaleString()}/sqm`);
    console.log(`    Mean: EGP ${Math.round(mean).toLocaleString()}/sqm`);
  }

  // ========== 8. INSTALLMENTS VS CASH ==========
  console.log(`\n========== PAYMENT TYPE (INSTALLMENTS VS CASH) ==========`);
  const paymentCounts = {};
  for (const r of rows) {
    const pt = r.payment_type || 'NULL';
    paymentCounts[pt] = (paymentCounts[pt] || 0) + 1;
  }
  for (const [k, v] of Object.entries(paymentCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v} (${(v / rows.length * 100).toFixed(1)}%)`);
  }

  // ========== 9. CORRELATION: PROPERTY TYPE & PRICE ==========
  console.log(`\n========== PROPERTY TYPE vs PRICE CORRELATION ==========`);
  // Use point-biserial-like: compare mean prices across property types
  for (const [type, prices] of Object.entries(priceByType).sort((a, b) => b[1].length - a[1].length)) {
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    // Standard deviation
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    console.log(`  ${type}: mean=EGP ${Math.round(mean).toLocaleString()}, stdDev=EGP ${Math.round(stdDev).toLocaleString()}, n=${prices.length}`);
  }

  // ========== 10. ADDITIONAL INSIGHTS ==========
  console.log(`\n========== ADDITIONAL INSIGHTS ==========`);

  // Bedroom distribution
  console.log(`\n--- Bedroom Distribution ---`);
  const bedCounts = {};
  for (const r of rows) {
    const b = r.bedrooms !== null && r.bedrooms !== undefined ? r.bedrooms : 'NULL';
    bedCounts[b] = (bedCounts[b] || 0) + 1;
  }
  for (const [k, v] of Object.entries(bedCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k} bedrooms: ${v} (${(v / rows.length * 100).toFixed(1)}%)`);
  }

  // Area sqm distribution
  console.log(`\n--- Area Distribution ---`);
  const areas = rows.map(r => r.area_sqm).filter(a => typeof a === 'number' && a > 0).sort((a, b) => a - b);
  if (areas.length > 0) {
    console.log(`  Listings with valid area: ${areas.length} / ${rows.length}`);
    console.log(`  Min: ${areas[0]} sqm`);
    console.log(`  Max: ${areas[areas.length - 1]} sqm`);
    const n = areas.length;
    console.log(`  Median: ${n % 2 === 0 ? (areas[n / 2 - 1] + areas[n / 2]) / 2 : areas[Math.floor(n / 2)]} sqm`);
    console.log(`  Mean: ${Math.round(areas.reduce((a, b) => a + b, 0) / n)} sqm`);
  }

  // Finishing level distribution
  console.log(`\n--- Finishing Level Distribution ---`);
  const finishCounts = {};
  for (const r of rows) {
    const f = r.finishing_level || 'NULL';
    finishCounts[f] = (finishCounts[f] || 0) + 1;
  }
  for (const [k, v] of Object.entries(finishCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v} (${(v / rows.length * 100).toFixed(1)}%)`);
  }

  // Delivery status distribution
  console.log(`\n--- Delivery Status Distribution ---`);
  const deliveryCounts = {};
  for (const r of rows) {
    const d = r.delivery_status || 'NULL';
    deliveryCounts[d] = (deliveryCounts[d] || 0) + 1;
  }
  for (const [k, v] of Object.entries(deliveryCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v} (${(v / rows.length * 100).toFixed(1)}%)`);
  }

  // Sale type distribution
  console.log(`\n--- Sale Type Distribution ---`);
  const saleTypeCounts = {};
  for (const r of rows) {
    const s = r.sale_type || 'NULL';
    saleTypeCounts[s] = (saleTypeCounts[s] || 0) + 1;
  }
  for (const [k, v] of Object.entries(saleTypeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v} (${(v / rows.length * 100).toFixed(1)}%)`);
  }

  // Agency distribution (top 15)
  console.log(`\n--- Top 15 Agencies ---`);
  const agencyCounts = {};
  for (const r of rows) {
    const a = r.agency_name || 'NULL';
    agencyCounts[a] = (agencyCounts[a] || 0) + 1;
  }
  const sortedAgencies = Object.entries(agencyCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [k, v] of sortedAgencies) {
    console.log(`  ${k}: ${v}`);
  }

  // Compound name distribution (top 15)
  console.log(`\n--- Top 15 Compounds ---`);
  const compoundCounts = {};
  for (const r of rows) {
    const c = r.compound_name || 'NULL';
    compoundCounts[c] = (compoundCounts[c] || 0) + 1;
  }
  const sortedCompounds = Object.entries(compoundCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [k, v] of sortedCompounds) {
    console.log(`  ${k}: ${v}`);
  }

  // City distribution (top 15)
  console.log(`\n--- Top 15 Cities ---`);
  const cityCounts = {};
  for (const r of rows) {
    const c = r.city || 'NULL';
    cityCounts[c] = (cityCounts[c] || 0) + 1;
  }
  const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [k, v] of sortedCities) {
    console.log(`  ${k}: ${v}`);
  }

  // Price period distribution
  console.log(`\n--- Price Period Distribution ---`);
  const periodCounts = {};
  for (const r of rows) {
    const p = r.price_period || 'NULL';
    periodCounts[p] = (periodCounts[p] || 0) + 1;
  }
  for (const [k, v] of Object.entries(periodCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v} (${(v / rows.length * 100).toFixed(1)}%)`);
  }

  // Currency distribution
  console.log(`\n--- Currency Distribution ---`);
  const currCounts = {};
  for (const r of rows) {
    const c = r.currency || 'NULL';
    currCounts[c] = (currCounts[c] || 0) + 1;
  }
  for (const [k, v] of Object.entries(currCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v} (${(v / rows.length * 100).toFixed(1)}%)`);
  }

  // Verified vs not
  console.log(`\n--- Verified Listings ---`);
  const verifiedCounts = { true: 0, false: 0, null: 0 };
  for (const r of rows) {
    if (r.is_verified === true) verifiedCounts.true++;
    else if (r.is_verified === false) verifiedCounts.false++;
    else verifiedCounts.null++;
  }
  console.log(`  Verified (true): ${verifiedCounts.true} (${(verifiedCounts.true / rows.length * 100).toFixed(1)}%)`);
  console.log(`  Not verified (false): ${verifiedCounts.false} (${(verifiedCounts.false / rows.length * 100).toFixed(1)}%)`);
  console.log(`  Unknown (null): ${verifiedCounts.null} (${(verifiedCounts.null / rows.length * 100).toFixed(1)}%)`);

  // Description population
  console.log(`\n--- Description Populated ---`);
  let descCount = 0;
  for (const r of rows) {
    if (r.description_raw && typeof r.description_raw === 'string' && r.description_raw.length > 0) descCount++;
  }
  console.log(`  Has description: ${descCount} / ${rows.length} (${(descCount / rows.length * 100).toFixed(1)}%)`);

  // Down payment stats
  // console.log(`\n--- Down Payment Analysis ---`);
  // const downPaymentPcts = rows.map(r => r.down_payment_pct).filter(v => typeof v === 'number');
  // const downPaymentAmts = rows.map(r => r.down_payment_amount).filter(v => typeof v === 'number');
  // console.log(`  Listings with down_payment_pct: ${downPaymentPcts.length}`);
  // if (downPaymentPcts.length > 0) {
  //   console.log(`    Min: ${Math.min(...downPaymentPcts)}%`);
  //   console.log(`    Max: ${Math.max(...downPaymentPcts)}%`);
  //   console.log(`    Mean: ${(downPaymentPcts.reduce((a, b) => a + b, 0) / downPaymentPcts.length).toFixed(1)}%`);
  // }
  // console.log(`  Listings with down_payment_amount: ${downPaymentAmts.length}`);
  // if (downPaymentAmts.length > 0) {
  //   console.log(`    Min: EGP ${Math.min(...downPaymentAmts).toLocaleString()}`);
  //   console.log(`    Max: EGP ${Math.max(...downPaymentAmts).toLocaleString()}`);
  // }

  // Installment years
  console.log(`\n--- Installment Years Analysis ---`);
  const instYears = rows.map(r => r.installment_years).filter(v => typeof v === 'number');
  console.log(`  Listings with installment_years: ${instYears.length}`);
  if (instYears.length > 0) {
    console.log(`    Min: ${Math.min(...instYears)} years`);
    console.log(`    Max: ${Math.max(...instYears)} years`);
    console.log(`    Mean: ${(instYears.reduce((a, b) => a + b, 0) / instYears.length).toFixed(1)} years`);
  }

  // District distribution (top 15)
  console.log(`\n--- Top 15 Districts ---`);
  const districtCounts = {};
  for (const r of rows) {
    const d = r.district || 'NULL';
    districtCounts[d] = (districtCounts[d] || 0) + 1;
  }
  const sortedDistricts = Object.entries(districtCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [k, v] of sortedDistricts) {
    console.log(`  ${k}: ${v}`);
  }

  // Amenities frequency (top 20)
  console.log(`\n--- Top 20 Amenities ---`);
  const amenityCounts = {};
  for (const r of rows) {
    if (r.amenities && typeof r.amenities === 'string') {
      const items = r.amenities.split(',').map(s => s.trim()).filter(Boolean);
      for (const item of items) {
        amenityCounts[item] = (amenityCounts[item] || 0) + 1;
      }
    }
  }
  const sortedAmenities = Object.entries(amenityCounts).sort((a, b) => b[1] - a[1]).slice(0, 20);
  for (const [k, v] of sortedAmenities) {
    console.log(`  ${k}: ${v}`);
  }

  // Price by purpose
  console.log(`\n--- Price by Purpose ---`);
  const priceByPurpose = {};
  for (const r of rows) {
    const purpose = r.purpose || 'NULL';
    const price = typeof r.price === 'number' ? r.price : null;
    if (price && price > 0) {
      if (!priceByPurpose[purpose]) priceByPurpose[purpose] = [];
      priceByPurpose[purpose].push(price);
    }
  }
  for (const [purpose, prices] of Object.entries(priceByPurpose)) {
    prices.sort((a, b) => a - b);
    const n = prices.length;
    const median = n % 2 === 0 ? (prices[n / 2 - 1] + prices[n / 2]) / 2 : prices[Math.floor(n / 2)];
    const mean = prices.reduce((a, b) => a + b, 0) / n;
    console.log(`  ${purpose} (n=${n}):`);
    console.log(`    Min: EGP ${prices[0].toLocaleString()}`);
    console.log(`    Max: EGP ${prices[n - 1].toLocaleString()}`);
    console.log(`    Median: EGP ${median.toLocaleString()}`);
    console.log(`    Mean: EGP ${Math.round(mean).toLocaleString()}`);
  }

  console.log(`\n========== ANALYSIS COMPLETE ==========`);
}

main().catch(console.error);
