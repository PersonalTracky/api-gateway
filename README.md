# Tracky - api gateway

<Flex>
<img alt="GraphQL" src="https://img.shields.io/badge/-GraphQL-E10098?style=for-the-badge&logo=graphql"/>
<img alt="NodeJS" src="https://img.shields.io/badge/node.js%20-%2343853D.svg?&style=for-the-badge&logo=node.js&logoColor=white"/>
<img alt="TypeScript" src="https://img.shields.io/badge/typescript%20-%23007ACC.svg?&style=for-the-badge&logo=typescript&logoColor=white"/>
</Flex>

This repository contains the API gateway for [Tracky](https://github.com/PersonalTracky/web).

The two main functions of the gateway are:

* Authentication and session management
* Re-routing of requests to appropriate services, collecting responses and sending them to the client application

## Running

Install dependencies via `yarn`.

You can find the needed env vars in `env.d.ts`.

The recommended way of running is to use `yarn watch` in one terminal window and then run via `yarn dev` in another. Alternatively you can use just `yarn dev2`.

In order to make requests against the schema open `http://localhost/graphql` in your browser.
