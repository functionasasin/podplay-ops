---
type: trip
name: New Jersey PodPlay Training
status: booked
dates: [2026-03-02, 2026-03-10]
destinations: [[Jersey City]]
people: [[Stan Wu]], [[Chad]]
related: [[Pod Play]], [[Pod Play SEA]], [[Ping Pod Asia Franchise]], [[Magpie]]
tags: [training, business, podplay, infrastructure]
---

# New Jersey PodPlay Training

Training trip to Jersey City to learn how to configure and deploy PodPlay hardware for Southeast Asia distribution.

## Purpose

Someone on the team needs to be trained on full PodPlay hardware setup so deployments can happen independently in the Philippines/Asia without relying on US-based support. This trip is that training.

## Key Objectives

1. **Learn the full PodPlay hardware configuration process** — unboxing through testing
2. **Understand the complete infrastructure architecture** — every component, how they connect, what's shared vs. locally deployed
3. **Clarify payment integration for Asia** — Stripe won't work in the Philippines; need to understand what [[Magpie]] needs to integrate
4. **Get access to all required accounts and services** — or understand which ones need separate instances for Asia
5. **Document region-specific differences** — PAL vs NTSC, ISP differences, deployment server access from Asia

## Infrastructure Questions to Resolve

See [[PodPlay Asia Infrastructure Analysis]] for the full breakdown of shared vs. local infrastructure and questions to ask during training.

## Dates

- **Travel:** March 2, 2026
- **Training:** March 2–10, 2026
- **Return:** March 10, 2026

## Training Checklist

Before leaving NJ, confirm:

- [ ] Access to all accounts (Mosyle, FreeDNS, 1Password, Unifi, Admin Dashboard, Apple Business Manager, Deployment Server)
- [ ] Complete hardware list with exact model numbers
- [ ] Documentation for region-specific configuration differences (PAL, ISP, etc.)
- [ ] Contact info for technical support (Stan, Chad)
- [ ] Access to deployment server (or own instance)
- [ ] Clear understanding of software licensing model for Asia
- [ ] Ability to train own installers using the config guide
- [ ] Sample BOM template adapted for Asian deployments
- [ ] Clear answer on payment gateway integration path for [[Magpie]]
- [ ] Understanding of what `deploy.py` generates and whether it can run locally
