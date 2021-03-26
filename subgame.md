# SubGame

## Overview

[SubGame](http://www.subgame.org/) fork this project is used to develop research and feed back to the original author. 

Research direction:
- Substrate FRAME framework
- Substrate RPC client
- Substrate application tools

## System Architecture Planning

We plan to build a back-end API microservice architecture using Go programming language.

Go is expressive, concise, clean, and efficient. Its concurrency mechanisms make it easy to write programs that get the most out of multicore and networked machines, while its novel type system enables flexible and modular program construction. Go compiles quickly to machine code yet has the convenience of garbage collection and the power of run-time reflection. It's a fast, statically typed, compiled language that feels like a dynamically typed, interpreted language.

Microservice Architecture structures an application as a collection of services that are

- Highly maintainable and testable
- Loosely coupled
- Independently deployable
- Organized around business capabilities
- architecture enables the rapid, frequent and reliable delivery of large, complex applications.

With the system expansion planning of cluster scaling and message queue application, it can load blockchain high traffic transactions and provide good experience to users.

## Block Explorers UI Design

We will build our own Blockchain explorer and several game interfaces, so that users can have a better experience when using our products.

We plan to use React to build a web page and provide a mobile version, and will launch an APP in the future.

Our current plan is to refer to the official proposed Blockchain explorer and choose the features that best meet the needs of our development project as reference, of course, if we find any problems during the development stage, we will report back to the original author and assist in the first place.

## Project Management

Our team uses agile development, in the pre-project analysis and planning to implementation and testing are related to the specification.

requiring a unified planning of the documentation, such as version control needs to comply with the git message type:

- feat: New/modified feature (feature).
- fix: Patch the bug (bug fix).
- docs: documentation (documentation).
- style: formatting (changes that don't affect how the code runs white-space, formatting, missing semi colons, etc).
- refactor: refactoring (code changes that are neither new features nor bug fixes).
- perf: Improves performance (A code change that improves performance).
- test: When adding missing tests.
- chore: A change in a builder or helper (maintain).
- revert: Undoes a reply to a previous commit

## Vision

We will continue to explore the polkadot ecosystem and provide more useful tools, perhaps participate in the Substrate FRAME framework development. If you have any good suggestions, please feel free to contact us! We are glad to join the polkadot family!