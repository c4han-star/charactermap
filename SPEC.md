# SPEC.md

## Project Title
Character Relationship Tracker

## Client
Youngpyung Lee

## Developer
Finnick Chen

## Agreed Development Fee
10 GIX Bucks

## Project Overview
Character Relationship Tracker is a web application that helps readers and viewers understand how characters in a story are connected. The app is designed for novels, dramas, and other story-based media with large or complicated casts.

The main value of the product is that it gives users a clear, interactive, and spoiler-safe way to understand relationships between characters without needing to search through long summaries or fan wikis.

## Problem Statement
Readers and viewers often lose track of characters and relationships in novels, dramas, and other story-based media with large or complicated casts. Existing summaries are often too long, not interactive, or reveal spoilers too early. As a result, users pause shows, search online, or reread earlier sections just to understand who is connected to whom.

## Goal
Build a spoiler-safe web application that allows users to view an interactive character relationship map and filter the information based on their chapter or episode progress.

## Target Users
- Readers of novels with large casts
- Viewers of dramas, TV series, and films with complex relationships
- Users who want a fast visual explanation of character connections
- Users who want to avoid spoilers while catching up on a story

## Core User Stories
- As a viewer, I want to quickly see how characters are connected so that I do not get confused while watching a show.
- As a reader, I want to limit the relationship map by chapter or episode so that I can avoid spoilers.
- As a user, I want an interactive visual layout so that I can understand relationships faster than by reading long summaries.
- As a user, I want to click on a character and see key relationship details so that I can understand their role in the story.
- As a user, I want a clean and intuitive interface so that I can use the app without needing instructions.

## Must-Have Features
1. A homepage that explains the purpose of the app
2. A searchable or selectable story input area
3. A spoiler-safe progress filter by chapter, episode, or story progress
4. An interactive relationship map showing characters and their connections
5. A character detail view or info panel
6. Clear labels for relationship types where applicable
7. A simple and readable interface that works for first-time users

## Nice-to-Have Features
1. AI-assisted extraction of character names and relationships from pasted text or summaries
2. Upload or paste story text for relationship generation
3. Color coding for different relationship types
4. Save or export a generated map
5. Mobile-friendly layout improvements

## Non-Goals for Initial Version
- Full-scale support for every media franchise
- Advanced user accounts or social features
- Deep fandom wiki functionality
- Perfect automatic extraction for every text source

## Functional Requirements
- The app must allow users to input or select story content
- The app must generate or display a relationship map between characters
- The app must allow users to restrict visible information based on story progress
- The app must present character relationships in a way that is easy to understand visually
- The app must prevent major spoiler exposure in the filtered mode

## Acceptance Criteria
The project will be considered successful if:
- a user can understand the purpose of the app within a few seconds of landing on the page
- a user can view at least one working character relationship map
- a user can apply a spoiler-safe progress filter
- a user can inspect at least one character and understand their relationship to others
- the core value of the app can be demonstrated in 2 to 3 views/pages
- the application is functional enough for a demo and code review

## Proposed Stack
Next.js + Supabase

## AI Use Case
AI can help extract character names, roles, and relationships from pasted text or uploaded story summaries, then organize them into a visual relationship map.

## Timeline and Checkpoints

### Check-in 1: Project Setup and Core Structure
Expected progress:
- set up repository and initial app structure
- decide the data model
- build the basic homepage or landing view
- define how characters and relationships will be stored and displayed

### Check-in 2: Core Relationship Map and Interaction
Expected progress:
- implement the relationship map or core visualization
- support basic character selection or click interaction
- display key character details
- confirm the app can demonstrate the main idea with sample data

### Check-in 3: Spoiler Filter and Demo Polish
Expected progress:
- add chapter or episode progress filtering
- ensure spoiler-safe behavior in the UI
- improve layout, readability, and presentation quality
- prepare a demo-ready version for review

## Review Expectations
The developer will submit work through pull requests. The client will review major architecture and progress pull requests within 48 hours and provide feedback based on whether the implementation matches the agreed scope and required features.
