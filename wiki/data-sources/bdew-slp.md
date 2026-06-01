# BDEW Standard Load Profiles (SLP)

BDEW (German energy industry association) publishes **standard load
profiles** that describe how a typical consumer's electricity demand is
distributed across the year/day. Used by the consumption wizard (Sprint 1,
M1.6) to turn a headline annual kWh into an hourly/seasonal load shape.

## Profile of interest

- **H0** — households. The consumption wizard scales H0 to the user's
  estimated annual consumption (persons + e-car + heat pump → kWh/year),
  giving a realistic demand curve to compute self-consumption and autarky.

## How we use it

1. Estimate annual demand from the wizard inputs.
2. Scale the H0 profile to that annual total.
3. Overlay PV production (from PVGIS) to derive self-consumption,
   grid feed-in, and the storage sizing recommendation.

## Pitfalls

- H0 is a *statistical average*, not a specific household — present results
  as estimates with the disclaimer.
- Heat pumps and EVs have their own load shapes; in MVP we approximate by
  scaling annual H0. Dedicated HP/EV profiles are Phase 2.
- BDEW profiles use a day-type/season structure and a dynamic scaling
  function for H0 — document the exact variant when implemented.
