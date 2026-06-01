# Service: economics

## Purpose

Turn yield + consumption + storage + price assumptions into the numbers the
charts show: CapEx, subsidy (static stub in MVP), self-consumption split,
amortization/payback, and a 25-year cashflow. Consumed by the economics
wizard step and the export/report service.

## Public surface (planned, Sprint 1)

- `evaluate(system, consumption, tariff, subsidy) -> EconomicsResult`
