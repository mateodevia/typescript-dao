# Typescript - Hardhard DAO

This projects is a basic versión of a DAO that allows users to manage a cripto currency fund by making proposals over how the funds should be spent.

This DAO was developed using Hardhat + Typescript + React as the main tecnological stack.

![image](https://user-images.githubusercontent.com/35933399/210114759-da67dd02-ec15-4bbd-b2a4-58bd24417536.png)

# Table of Contents

- [About the proyect](#about-the-proyect)
- [Main Features](#main-features)
- [Demo](#demo)
- [Architecture and Design](#architecture-and-design)
- [Run the project on your machine](#run-the-project-on-your-machine)
- [Author](#author)
- [License](#license)

# About the proyect
This is a personal proyect created with the goal of exploring and understanding the lastest Ethereum tecnologies, and building a complete fullstack blockchain app from scratch. It was not aim to be a real life solution, although posible extensions will be always welcome. Special thanks to this [__Dapp University video__](https://www.youtube.com/watch?v=LI4Ns77Upug) which served as inspiration for the basic idea.

# Main Features
During deployment a treasury is created with some initial funds (ethers). Those funds are given by the address who deploys the app. The idea is that users of the DAO should get to agreements on how this money should be spent by deciding what addresses should receive payments from the treasury money. These decisions are made through proposals. Each proposal suggests a transaction that should be made with the treasury money and has a description to justify why that transaction should be made. The proposals undergo a voting process to determine if they are approved. In case of approval, the proposed transaction is excecuted.

The app has 2 types of users, voters and participants. 
- Voters are define during deployment and are the addresses that can vote for or against a proposal.
- Participants are any other addresses that want to participate in the DAO by making proposals.


### See the list of created proposals
Any user can see the list of proposals that have been created. Each proposal show the addess that created the proposal, the target address, the proposed amount, the description, the proposal state, and the results of the voting process in real time. The proposal state determines in which fase of the voting process the proposal is currently at.

![image](https://user-images.githubusercontent.com/35933399/210135075-726f0cd5-6fa1-4ad6-86be-514daebe48fb.png)

### See the voters
![image](https://user-images.githubusercontent.com/35933399/210135101-ec3a07d4-5f82-4a53-84d8-7fc49b9f3c2b.png)


### Creating a proposal
Any user can create a proposal. A proposal consist of a target address (address that will receive the money), the amount of money that should be transfered to the target address, and a description of why the money should be transfer. Any user can create a proposal if they have enough ethers to pay the gas fee of creating the proposal.

![image](https://user-images.githubusercontent.com/35933399/210134494-910f0d89-73eb-43af-b1e7-ca13b8393d1b.png)

### Vote for a proposal
![image](https://user-images.githubusercontent.com/35933399/210134765-2d5fcd99-533c-4957-baef-9f99c5e9a6c9.png)

### Enqueue the proposal
![image](https://user-images.githubusercontent.com/35933399/210134935-3d3e2608-4a6a-4dbe-9414-7ed4e59b937c.png)

### Excecute the proposal
![image](https://user-images.githubusercontent.com/35933399/210134955-7291799f-8fe0-4215-b0ab-83a8fc68512b.png)


# Demo

You can try the app [__right here__](https://github.com/mateodevia)

To be able to vote you can import the following addresses in you metamask:
- TODO
- TODO

# Architecture and Design
TODO

# Run the project on your machine

```shell
hardhat run --network ropsten scripts/deploy.ts
```

# Author

[__Mateo Devia__](https://github.com/mateodevia) -> [__Check out my personal web page!__](https://github.com/mateodevia)

# License
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This repository has the standard MIT license. You can find it [here.](https://github.com/mateodevia/homePage/blob/master/LICENSE)
