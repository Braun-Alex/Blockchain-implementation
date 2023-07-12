# Blockchain implementation

The project implements a blockchain as a class for managing cryptocurrency.
The data structure serves as a model of real blockchains, such as those used in Bitcoin and Ethereum.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

## 🚀 Overview

The blockchain enables the decentralized management of cryptocurrency. Is is accomplished using the main class "Blockchain" and additional, but essential, classes 
including "Signature", "KeyPair", "Account", "Operation", "Transaction", and "Block".

#### Interfaces

| Interface   | Requirements for interface                                                                                  |
| :---------- | :---------------------------------------------------------------------------------------------------------- |
| Signature   | Must implement **ECDSA**.                                                                                   |
| KeyPair     | Must implement convenient way to use the **private** and **public** keys.                                   |
| Account     | The main entity in the blockchain interface must be implemented. It represents the end user of the system.  |
| Operation   | Must implement the **atomic** transaction.                                                                  |
| Transaction | **The main** way to interact with an account on the blockchain.                                             | 
| Block       | Must implement the block of transactions.                                                                   |
| Blockchain  | **The main interface** must implement the block history, as well as the database of coins and transactions. |

## ⚡️ Features

- [x] The use of the blockchain may only be possible when utilizing the specified interfaces.
- [x] The product does not interact with any internal products and components except used libraries.
- [x] The classes do not provide for all scenarios of its using. User should be careful with them.
- [x] High security standards using ECDSA and SHA3.
- [x] The blockchain interface may be used by anyone without any restrictions.
