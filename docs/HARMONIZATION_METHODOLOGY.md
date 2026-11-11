# FireDNA — Harmonization Methodology
## NASA Space Apps Challenge 2026

**Version:** 1.0.0  
**Date:** November 10, 2026

> **Scientific Disclaimer**: The FireDNA Harmonized Activity Index (HAI) is an experimental prototype metric developed for educational and demonstration purposes. It is NOT an officially validated NASA product, NOT a calibrated scientific instrument, and NOT peer-reviewed. It should NOT be used for operational fire management decisions. All HAI scores must be interpreted with this limitation in mind. The underlying NASA FIRMS data is real; the harmonization methodology is FireDNA's own experimental approach.

---

## 1. Why Harmonization Is Needed

MODIS and VIIRS satellite instruments provide fundamentally different observations of the same fire events:

| Characteristic | MODIS | VIIRS |
|---|---|---|
| Pixel size (nadir) | ~1 km × 1 km | 375 m × 375 m |
| Detection threshold (FRP) | ~50 MW | ~5 MW |
| Daily overpasses | 2 (Terra) + 2 (Aqua) | 1–2 per platform |
| Active FIRMS platforms | Terra, Aqua | Suomi-NPP, NOAA-20, NOAA-21 |
| Confidence reporting | Categorical: low/nominal/high | Numeric: 0–100% |
| Swath width | 2,330 km | 3,000 km |

**Direct consequence:** For the same fire event, MODIS may report 2 hotspot pixels while VIIRS may report 15, simply because VIIRS pixels are smaller. Comparing raw detection counts as if they represent the same measurement unit would be scientifically misleading.

**FireDNA's approach:** Place both sensors on a common spatial grid (0.1° cells, ~11 km at equator) and within common temporal windows (24-hour UTC days), then compute a composite score that acknowledges sensor differences while enabling comparison.

---

## 2. Spatial Harmonization

### 2.1 Grid Specification

FireDNA uses a **regular latitude-longitude grid** as a pragmatic compromise for the hackathon.

> **Note:** A true equal-area projection (e.g., Equal Earth or sinusoidal projection) would be scientifically preferable because grid cell area changes with latitude in a lat-lon grid. For the Bangladesh demonstration region (20°–27°N), the area distortion is approximately 3–8%, which is acceptable for a prototype system. Post-MVP versions should implement EASE-Grid 2.0 or a similar equal-area system.

**Default grid parameters:**
- Resolution: **0.1° × 0.1°** (approximately 11.1 km × 10.5 km at Bangladesh latitudes)
- Reference datum: WGS84 (EPSG:4326)
- Cell naming: `G_{lat_min:.2f}N_{lon_min:.2f}E_{res:.1f}D`

**Why 0.1°?**
- Coarser than both MODIS (~0.009°) and VIIRS (~0.0034°): ensures multiple pixels from either sensor can aggregate into a single cell.
- Fine enough to show spatial variation within Bangladesh (~1,000 grid cells cover the country).
- Computationally efficient for hackathon scale.

### 2.2 Spatial Join Algorithm

```
For each satellite observation (lat, lon):
    cell_lat = floor(lat / resolution) * resolution
    cell_lon = floor(lon / resolution) * resolution
    grid_cell_id = f"G_{cell_lat:.2f}N_{cell_lon:.2f}E_{resolution:.1f}D"
    Assign observation to this cell
```

This floor-based assignment is deterministic and avoids edge effects. All observations within a cell boundary are assigned to the same cell regardless of sensor.

### 2.3 Cell Aggregation

For each `(grid_cell_id, obs_date)` combination:

```python
cell_aggregate = {
    "modis_count":        count of MODIS observations in cell,
    "viirs_snpp_count":   count of VIIRS Suomi-NPP observations in cell,
    "viirs_noaa20_count": count of VIIRS NOAA-20 observations in cell,
    "viirs_noaa21_count": count of VIIRS NOAA-21 observations in cell,
    "total_frp_modis":    sum of MODIS FRP values (MW),
    "total_frp_viirs":    sum of VIIRS FRP values, all platforms (MW),
    "mean_frp_modis":     mean MODIS FRP,
    "mean_frp_viirs":     mean VIIRS FRP,
    "mean_confidence_modis": mean normalized MODIS confidence,
    "mean_confidence_viirs": mean normalized VIIRS confidence,
    "day_count":          count of daytime detections (all sensors),
    "night_count":        count of nighttime detections (all sensors),
}
```

**Important:** All count fields are preserved separately per sensor. The harmonization does NOT replace them with a single merged count. This allows users to compare sensor-specific values directly.

---

## 3. Temporal Harmonization

### 3.1 Temporal Window

Default window: **24-hour UTC day** (i.e., obs_date = acq_date in UTC).

This window is intentionally simple for the MVP. All observations acquired between UTC 00:00:00 and UTC 23:59:59 on a given date are grouped together, regardless of which satellite overpassed at which time.

### 3.2 Known Limitation

Different satellites overpass Bangladesh at different local times:
- MODIS Terra descending: approximately 10:30 IST (04:30 UTC)
- MODIS Aqua ascending: approximately 13:30 IST (07:30 UTC)
- VIIRS Suomi-NPP: approximately 13:30 IST (07:30 UTC)

For agricultural burning and daytime fires, most detections occur during the day overpass. The 24-hour window captures all overpasses from one day, which is appropriate for daily aggregation but loses sub-daily temporal information.

**FireDNA transparency requirement:** All UI displays of harmonized data include the note: *"Temporal window: 24-hour UTC day. Overpass time differences between MODIS and VIIRS platforms are not corrected in this prototype."*

---

## 4. Sensor Normalization

### 4.1 FRP Normalization

FRP (Fire Radiative Power) is the most physically meaningful fire intensity metric available from FIRMS. However, MODIS and VIIRS FRP values are **not directly comparable** because:
1. Different pixel sizes mean different areas are summed.
2. Different spectral channels are used for retrieval.
3. Different minimum detection thresholds exist.

**FireDNA approach:** Independently normalize FRP for each sensor using log-min-max transformation.

```python
def normalize_frp(series: pd.Series) -> pd.Series:
    """
    Step 1: Log-transform to compress dynamic range
        frp_log = log(1 + frp)  [log1p handles frp=0 gracefully]

    Step 2: Min-max normalize within the series
        frp_norm = (frp_log - frp_log.min()) / (frp_log.max() - frp_log.min())

    If max == min (all zeros or single value):
        return 0.0 for all entries

    Result: values in [0.0, 1.0], relative to this dataset.
    NOT comparable across different time periods or regions without re-normalization.
    """
    log_transformed = np.log1p(series.fillna(0).clip(lower=0))
    min_val, max_val = log_transformed.min(), log_transformed.max()
    if max_val == min_val:
        return pd.Series(0.0, index=series.index)
    return (log_transformed - min_val) / (max_val - min_val)
```

### 4.2 Count Normalization

Detection counts are normalized per sensor independently using the **95th-percentile method** to prevent extreme outliers from compressing the scale:

```python
def normalize_count(series: pd.Series) -> pd.Series:
    """
    Divide each count by the 95th percentile of counts in the series.
    Values above the 95th percentile are clipped to 1.0.
    Zero counts map to 0.0.

    Rationale: The 95th percentile avoids outlier compression while
    representing a 'very high' activity level as 1.0.
    """
    p95 = series.quantile(0.95)
    if p95 == 0:
        return pd.Series(0.0, index=series.index)
    return (series / p95).clip(upper=1.0)
```

### 4.3 Confidence Normalization

Confidence values are normalized per sensor:
- **MODIS:** `'low' → 0.33`, `'nominal' → 0.66`, `'high' → 1.00`
- **VIIRS:** `integer_value / 100.0`

For cell aggregation, the mean normalized confidence is used.

---

## 5. Harmonized Activity Index (HAI)

> **EXPERIMENTAL DISCLAIMER**: The HAI is a FireDNA prototype composite metric. The weights below were chosen to give FRP the highest importance (as the most physically meaningful fire property). These weights have NOT been validated against ground truth fire measurements, NOT peer-reviewed, and NOT endorsed by NASA. HAI values should be treated as an index of "general fire activity" rather than a physical measurement.

### 5.1 HAI Formula

```
HAI = w₁ × S_count + w₂ × S_frp + w₃ × S_confidence

Where:
    S_count      = normalized combined detection count score
    S_frp        = normalized combined FRP score
    S_confidence = mean confidence score across sensors

Default weights:
    w₁ = 0.40  (count component)
    w₂ = 0.45  (FRP component — highest because FRP is most physically meaningful)
    w₃ = 0.15  (confidence component)

    Constraint: w₁ + w₂ + w₃ = 1.0
```

### 5.2 Count Score Calculation

```
total_count = modis_count + viirs_snpp_count + viirs_noaa20_count + viirs_noaa21_count

S_count = normalize_count(total_count)
        = min(total_count / P95_total_count, 1.0)
```

Note: We sum all detections across sensors before normalization. This creates a combined signal that reflects total observed activity. The individual sensor counts are still stored separately for transparency.

### 5.3 FRP Score Calculation

```
combined_frp = max(total_frp_modis, total_frp_viirs)
              [Taking max rather than sum to avoid double-counting the same fire]
              [When only one sensor has data, that value is used]
              [When both have data, the larger value is used as the best estimate]

S_frp = normalize_frp(combined_frp)
```

> **Why max(MODIS_FRP, VIIRS_FRP)?**
> Since MODIS and VIIRS may detect the same fire from different viewing angles on the same day, summing their FRP would overestimate the actual fire radiative power. Using `max()` provides a conservative estimate. This is a simplification; more rigorous approaches would use temporal separation to identify unique detections.

### 5.4 Confidence Score Calculation

```
S_confidence = weighted_mean_confidence

If both sensors present in cell:
    S_confidence = (mean_confidence_modis * modis_count +
                   mean_confidence_viirs * viirs_count) /
                   (modis_count + viirs_count)

If only one sensor present:
    S_confidence = mean_confidence_[present_sensor]
```

### 5.5 HAI Interpretation Guide

| HAI Range | Interpretation | Display Color |
|---|---|---|
| 0.00 – 0.10 | Very low or no fire activity detected | #2D8A64 (green) |
| 0.10 – 0.30 | Low fire activity | #67B7E1 (blue) |
| 0.30 – 0.55 | Moderate fire activity | #FF9F43 (orange) |
| 0.55 – 0.80 | High fire activity | #E85D5D (red) |
| 0.80 – 1.00+ | Very high fire activity | #8B0000 (dark red) |

> **Warning displayed in UI:** "HAI values above 0.55 indicate high satellite-detected fire activity in this grid cell. This does NOT confirm that a large dangerous wildfire is burning. Satellite fire detections include agricultural burning, land clearing, industrial fires, and other thermal sources."

---

## 6. Anomaly Detection

### 6.1 Historical Baseline

For each `(grid_cell_id, instrument, month_of_year)` combination:

```
baseline_mean = mean(daily_counts for all years in baseline period, same month)
baseline_std  = std(daily_counts for all years in baseline period, same month)
baseline_p10  = 10th percentile
baseline_p90  = 90th percentile
sample_years  = count of distinct years with data for this cell-instrument-month
```

**Minimum data requirement:** `sample_years >= 3`
If fewer than 3 years of data exist, `is_sufficient = FALSE` and anomaly scores for this cell are marked `has_sufficient_baseline = FALSE`.

### 6.2 Z-Score Calculation

```
z_score = (observed_count - baseline_mean) / baseline_std

Edge cases:
- If baseline_std == 0 AND observed_count > 0:
    set anomaly_level = 'insufficient_data', z_score = NULL
- If baseline_std == 0 AND observed_count == 0:
    set anomaly_level = 'normal', z_score = 0.0
- If has_sufficient_baseline == FALSE:
    z_score = NULL, anomaly_level = 'insufficient_data'
```

### 6.3 Historical Percentile

```
percentile = scipy.stats.percentileofscore(historical_values_for_month, observed_count)
```

Where `historical_values_for_month` is the list of all daily counts for the same calendar month across all baseline years.

### 6.4 Anomaly Classification Thresholds

| Z-Score Range | Anomaly Level | Label |
|---|---|---|
| z < 1.5 | normal | "Within normal variation" |
| 1.5 ≤ z < 2.5 | elevated | "Elevated fire activity" |
| 2.5 ≤ z < 3.5 | high | "Unusually high fire activity" |
| z ≥ 3.5 | extreme | "Extremely unusual fire activity" |
| NULL | insufficient_data | "Insufficient historical data" |

**Thresholds rationale:** These are conventional statistical thresholds based on standard deviation multiples. They are not calibrated against specific fire event types. A z-score of 3.5 corresponds to roughly 99.98% probability of exceedance under a normal distribution, but fire activity is not normally distributed — it is typically right-skewed and seasonally variable.

**UI Warning (always shown):** *"Anomaly classification is based on statistical deviation from historical satellite observations. It does NOT confirm a dangerous wildfire. High anomaly scores may reflect seasonal agricultural burning, land clearing, or unusual weather enabling fire spread. Always consult official fire management authorities for verified fire information."*

---

## 7. Methodology Version Control

Every processing run stores its full methodology version and parameters:

```json
{
  "methodology_version": "1.0.0",
  "parameters": {
    "grid_resolution_deg": 0.1,
    "temporal_window_hours": 24,
    "hai_weights": { "count": 0.40, "frp": 0.45, "confidence": 0.15 },
    "frp_combination_method": "max",
    "count_normalization": "p95_clip",
    "frp_normalization": "log_minmax",
    "anomaly_z_thresholds": { "elevated": 1.5, "high": 2.5, "extreme": 3.5 },
    "min_baseline_years": 3
  }
}
```

This ensures that any derived metric can be traced to the exact processing parameters used.

---

## 8. Known Limitations and Uncertainties

| Limitation | Impact | Mitigation |
|---|---|---|
| Lat-lon grid is not equal-area | Cells at different latitudes have different areas | Minor at Bangladesh latitudes; noted in docs |
| FRP not cross-calibrated between sensors | MODIS FRP ≠ VIIRS FRP for same fire | Use separate FRP fields; HAI uses max() heuristic |
| Cloud cover blocks detections | Fires under clouds are missed | Display cloud-gap uncertainty in UI (future) |
| Short historical archive for NRT products | Baselines may be statistically weak | Flag insufficient baselines; use demo data |
| HAI weights are subjective | Different weight choices change HAI values | Store weights with each run; display in UI |
| Agricultural fire classification not done | HAI includes all thermal anomalies | Note in UI; FIRMS type field used for VIIRS |
| No atmospheric correction | FRP values are top-of-atmosphere | Inherent FIRMS limitation; documented |

---

## 9. References

1. Giglio, L., Schroeder, W., & Justice, C. O. (2016). The collection 6 MODIS active fire detection algorithm and fire products. *Remote Sensing of Environment*, 178, 31–41.
2. Schroeder, W., Oliva, P., Giglio, L., & Csiszar, I. A. (2014). The New VIIRS 375 m active fire detection data product: Algorithm description and initial assessment. *Remote Sensing of Environment*, 143, 85–96.
3. NASA FIRMS. (2026). Fire Information for Resource Management System. Retrieved from https://firms.modaps.eosdis.nasa.gov/
4. Csiszar, I., et al. (2014). Active fires from the Suomi NPP Visible Infrared Imaging Radiometer Suite: Product status and first evaluation of the VIIRS 375 m fire detection algorithm. *Remote Sensing of Environment*, 143, 104–116.

---

*Document version 1.0.0 — FireDNA Harmonization Methodology*
*All HAI scores produced by FireDNA are experimental prototype metrics. Not an official NASA product.*

