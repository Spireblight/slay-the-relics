# Slay the Relics Rewrite

## Overview

This document outlines the architectural redesign of the Slay the Relics extension to address critical maintainability and scalability issues. The rewrite aims to prepare the system for compatibility with both Slay the Spire and Slay the Spire 2.

## Current Problems

The existing system suffers from several architectural flaws that hinder development and maintenance:

### Architecture Issues

**Poor Separation of Concerns**
- The extension heavily relies on the mod to generate compressed and formatted messages
- The backend acts as a simple pass-through to Twitch with no understanding of game state
- This tight coupling makes extending support to Slay the Spire 2 unnecessarily complex

**Inefficient Communication**
- Manual rate limiting and custom compression algorithms
- No optimization for Twitch's message size and rate constraints

### Component-Specific Problems

#### Mod Layer
- **Complex Message Handling**: Uses a convoluted combination of base mod event subscribers, timers, and queues
- **Poor Data Construction**: Messages are built using fragile string manipulation techniques

#### Frontend
- **Lost Source Code**: Based on [STR-Extension](https://github.com/Spireblight/STR-Extension) with custom modifications that are no longer available
- **Maintenance Burden**: Handwritten JavaScript and HTML make adding new features (e.g., map view) extremely difficult
- **Inefficient Data Usage**: Constructs deck views by parsing card descriptions from Twitch messages, wasting bandwidth

#### Backend
- **Stateless Design Flaw**: No awareness of game state or run progression
- **Poorly Defined API**: Accepts unstructured string blobs without validation or type safety
- **Simple Pass-Through**: Only forwards messages to Twitch without adding value

## Proposed Solution

### Architecture Redesign

**State-Aware Backend**
- Backend will maintain and track deck state for each player
- Messages to Twitch will only be sent when state changes occur
- Well-defined API with proper data validation

**Structured Data Flow**
- Mod will generate properly structured JSON representing game state
- Event-driven updates based on game hooks (likely autosave events) instead of timers
- Elimination of string manipulation in favor of structured data

### Implementation Plan

#### Mod Improvements
- **Structured Output**: Generate JSON messages encapsulating complete deck and relic state
- **Event-Driven Updates**: Hook into game autosave or similar events for reliable state synchronization
- **Simplified Architecture**: Remove complex timer and queue systems

#### Backend Enhancements
- **State Management**: Track and maintain the current game state for each player
- **Intelligent Updates**: Only broadcast changes to Twitch when the state actually changes

#### Frontend Modernization
- **React Migration**: Rewrite in React with TypeScript for better maintainability
- **State Management**: Leverage React's state management capabilities
- **Efficient Data Loading**: Initial state load from backend API, then incremental updates via Twitch
- **External Card Database**: Use [Slaytabase](https://github.com/OceanUwU/slaytabase/tree/main/docs/slay%20the%20spire) for card information instead of transmitting descriptions

#### Communication Protocol
- **Optimized Format**: LZMA-compressed Protocol Buffers for space-efficient message exchange
- **Reduced Bandwidth**: Eliminate redundant card description transmissions
- **Better Compression**: Replace hand-rolled compression with industry-standard LZMA

## Benefits

- **Maintainability**: Clean separation of concerns and modern development practices
- **Scalability**: Stateful backend enables complex features and better performance
- **Extensibility**: Structured approach simplifies adding support for new games
- **Efficiency**: Optimized data formats and intelligent update mechanisms
- **Reliability**: Event-driven architecture reduces timing-related bugs
