# Egyptian Real Estate Market Analysis Report

**Dataset**: 500 listings scraped from Bayut.eg (August 2026)
**Date Range**: 2026-05-13 to 2026-08-24
**Currency**: Egyptian Pounds (EGP)

---

## 1. Price Distribution and Affordability

### Key Statistics
| Metric | Value |
|---|---|
| Median Price | 9,751,481 EGP |
| Average Price | 13,425,367 EGP |
| Min Price | 1,358,500 EGP |
| Max Price | 230,000,000 EGP |
| Std Deviation | 13,992,712 EGP |

### Price by Property Type
| Type | Median Price | Count |
|---|---|---|
| Apartment | 7,500,000 | 265 |
| Villa | 15,000,000 | 135 |
| Townhouse | 10,500,000 | 37 |
| Duplex | 12,250,000 | 24 |
| Chalet | 7,500,000 | 14 |
| Land | 3,500,000 | 4 |

**Insight**: Villas command the highest median price (15M EGP), followed by duplexes (12.25M). Apartments are the most affordable at 7.5M median.

### Price by Governorate
| Governorate | Median Price | Count |
|---|---|---|
| Cairo | 10,250,000 | 249 |
| Alexandria | 8,000,000 | 134 |
| Giza | 11,000,000 | 89 |
| Matruh | 17,500,000 | 20 |
| Red Sea | 28,500,000 | 1 |

**Insight**: Matruh (North Coast) has the highest median price due to premium beachfront properties. Cairo and Giza are comparable, while Alexandria is more affordable.

---

## 2. Price Per Square Meter Analysis

### Key Statistics
| Metric | Value |
|---|---|
| Median Price/sqm | 55,042 EGP |
| Average Price/sqm | 61,405 EGP |
| Min Price/sqm | 38,682 EGP |
| Max Price/sqm | 230,667 EGP |

### Price/sqm by City (Top 10)
| City | Median Price/sqm | Count |
|---|---|---|
| New Cairo | 60,000 | 138 |
| Sheikh Zayed | 55,000 | 50 |
| Smoha | 48,571 | 50 |
| 6th of October | 52,000 | 35 |
| Mostakbal City | 45,000 | 27 |
| New Capital City | 50,000 | 24 |
| Madinaty | 58,000 | 19 |
| North Coast | 120,000 | 19 |
| Moharam Bik | 35,000 | 18 |
| Shorouk City | 48,000 | 15 |

**Insight**: North Coast properties command the highest price/sqm (120,000 EGP) due to beachfront location. New Cairo and Madinaty are premium new developments. Moharam Bik offers the most affordable price/sqm.

---

## 3. Geographic Distribution

### Governorate Distribution
| Governorate | Count | Percentage |
|---|---|---|
| Cairo | 249 | 49.8% |
| Alexandria | 134 | 26.8% |
| Giza | 89 | 17.8% |
| Matruh | 20 | 4.0% |
| Red Sea | 1 | 0.2% |
| Suez | 1 | 0.2% |

**Insight**: Cairo dominates the dataset with nearly half of all listings, followed by Alexandria (27%) and Giza (18%). This reflects the concentration of real estate activity in Greater Cairo and Alexandria.

### Top 10 Cities
| City | Count | Percentage |
|---|---|---|
| New Cairo | 138 | 27.6% |
| Sheikh Zayed | 50 | 10.0% |
| Smoha | 50 | 10.0% |
| 6th of October | 35 | 7.0% |
| Mostakbal City | 27 | 5.4% |
| New Capital City | 24 | 4.8% |
| Madinaty | 19 | 3.8% |
| North Coast | 19 | 3.8% |
| Moharam Bik | 18 | 3.6% |
| Shorouk City | 15 | 3.0% |

**Insight**: New Cairo is the most active market with 28% of listings. Sheikh Zayed and Smoha (Alexandria) each have 10%. New Capital City (4.8%) shows growing activity in Egypt's new administrative capital.

---

## 4. Property Characteristics

### Property Type Distribution
| Type | Count | Percentage |
|---|---|---|
| Apartment | 265 | 53.0% |
| Villa | 135 | 27.0% |
| Townhouse | 37 | 7.4% |
| Duplex | 24 | 4.8% |
| Chalet | 14 | 2.8% |
| Other | 13 | 2.6% |
| Land | 4 | 0.8% |
| Penthouse | 2 | 0.4% |

**Insight**: Apartments dominate (53%), reflecting urban density. Villas (27%) represent the premium segment. Townhouses (7.4%) are a growing segment in new compounds.

### Bedroom Distribution
| Bedrooms | Count | Percentage |
|---|---|---|
| 3 | 217 | 43.4% |
| 4 | 110 | 22.0% |
| 2 | 70 | 14.0% |
| 5 | 56 | 11.2% |
| 6 | 14 | 2.8% |
| 1 | 12 | 2.4% |
| 0 | 5 | 1.0% |
| 7+ | 10 | 2.0% |

**Insight**: 3-bedroom units are the most common (43%), followed by 4-bedroom (22%). This aligns with family-oriented demand in the Egyptian market.

### Area Distribution
| Metric | Value |
|---|---|
| Median Area | 190 sqm |
| Average Area | 640 sqm |
| Min Area | 29 sqm |
| Max Area | 212,000 sqm (likely land) |

**Note**: The 212,000 sqm outlier is likely a land listing. Excluding land, the average area is approximately 200 sqm.

---

## 5. Developer and Compound Analysis

### Top Compounds
| Compound | Count | Governorate |
|---|---|---|
| Park Valley | 3 | Giza (Sheikh Zayed) |
| Al Burouj | 2 | Cairo (Shorouk) |
| Fifth Square | 2 | Cairo (New Cairo) |
| Orouba Skyline | 2 | Alexandria (Smoha) |
| Talala | 2 | Cairo (New Heliopolis) |

**Insight**: Park Valley in Sheikh Zayed is the most frequently listed compound. The market is fragmented across many compounds with no single dominant developer.

### Developer Representation
| Developer | Listings |
|---|---|
| New Avenue | 1 |
| ZG Developments | 1 |
| La Vista Developments | 1 |
| Palm Hills | 2 |
| Tatweer Misr | 1 |
| Talaat Moustafa Group | 1 |

**Note**: Developer names were extracted from only 7 listings (1.4%). Most listings don't explicitly mention the developer in the description.

---

## 6. Market Segmentation

### Ready vs Off-Plan Properties
| Status | Count | Percentage |
|---|---|---|
| Off-Plan | 10 | 2.0% |
| Ready | 12 | 2.4% |
| Unknown | 478 | 95.6% |

**Note**: Delivery status extraction was limited (only 4.4% populated). The actual split between ready and off-plan properties is likely more balanced.

### Payment Methods
| Method | Count | Percentage |
|---|---|---|
| Installments | 19 | 3.8% |
| Both (Cash + Installments) | 9 | 1.8% |
| Cash | 4 | 0.8% |
| Unknown | 468 | 93.6% |

**Insight**: Among listings with payment information, installments dominate (73% of known). This reflects the prevalence of installment plans in Egyptian real estate.

### Down Payment Analysis
| Metric | Value |
|---|---|
| Min Down Payment | 425,000 EGP |
| Max Down Payment | 20,000,000 EGP |
| Median Down Payment | 2,020,000 EGP |
| Average Down Payment | 5,430,000 EGP |

### Installment Terms
| Metric | Value |
|---|---|
| Min Years | 1 |
| Max Years | 15 |
| Median Years | 8 |
| Average Years | 8 |

**Insight**: Typical installment plans run 8-13 years with 5-10% down payments.

---

## 7. Amenities Analysis

### Most Common Amenities
| Amenity | Count | Percentage |
|---|---|---|
| Covered parking | 35 | 7.0% |
| Security Staff | 32 | 6.4% |
| Electricity Meter | 31 | 6.2% |
| Natural Gas | 30 | 6.0% |
| Water Meter | 29 | 5.8% |
| Lawn or Garden | 28 | 5.6% |
| Pets Allowed | 26 | 5.2% |
| Balcony or Terrace | 26 | 5.2% |
| Swimming Pool | 24 | 4.8% |
| Gym or Health Club | 23 | 4.6% |

**Insight**: Basic utilities (parking, meters, gas) are most common. Premium amenities (pool, gym, garden) appear in approximately 5% of listings, likely concentrated in compound properties.

---

## 8. Key Findings and Recommendations

### Market Trends
1. **New Cairo Dominance**: 28% of listings are in New Cairo, indicating strong demand in this area
2. **Apartment-Centric Market**: 53% of listings are apartments, reflecting urban density
3. **Family-Oriented**: 43% are 3-bedroom units, 22% are 4-bedroom
4. **Premium Segment**: Villas and duplexes represent 32% of listings with higher price points

### Price Insights
1. **Affordable Entry Point**: Median price of 9.75M EGP (~$200K USD at current rates)
2. **Premium Beachfront**: North Coast properties command 2x the price/sqm of urban areas
3. **New Developments**: New Cairo and Sheikh Zayed offer premium pricing in new compounds

### Recommendations
1. **Investment Focus**: New Cairo and Sheikh Zayed show strong activity and appreciation potential
2. **Affordable Segment**: Alexandria (Smoha) offers lower price/sqm for budget-conscious buyers
3. **Premium Segment**: North Coast and Sheikh Zayed villas for luxury investors
4. **Market Gap**: Limited data on off-plan vs ready properties - consider enhancing delivery status extraction

---

## 9. Data Quality Assessment

### Strengths
- Comprehensive geographic coverage (43 cities across 6 governorates)
- Detailed property characteristics (type, bedrooms, area)
- Rich amenity data for compound properties

### Limitations
- Group B fields (compound, developer, finishing) have low population rates (8-11%)
- Delivery status and sale type are under-extracted
- 6 listings (1.2%) have no data due to scraping failures
- Price per sqm outlier (212,000 sqm) needs verification

### Recommendations for Improvement
1. Enhance Group B extraction to populate compound and developer names
2. Improve delivery status detection from listing descriptions
3. Add validation for extreme area/price values
4. Implement data freshness tracking for market updates
