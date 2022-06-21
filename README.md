# Blockchain implementation

Project will implement blockchain as class for using it to manage cryptocurrency.
The data structure is model of real blockchains such as used blockchains in Bitcoin and Ethereum.

[![MIT License](https://img.shields.io/apm/l/atomic-design-ui.svg)](https://choosealicense.com/licenses/mit/)

## 🚀 Overview

Blockchain will permit to manage cryptocurrency in decentralized manner. It will
achieve by the main class "Blockchain" and additional, but necessary classes "Signature", 
"KeyPair", "Account", "Operation", "Transaction" and "Block".

#### Interfaces

| Interface   | Requirements for interface                                                                    |
| :---------- | :-------------------------------------------------------------------------------------------- |
| Signature   | Should implement **ECDSA**.                                                                   |
| KeyPair     | Must implement convenient way to use **private** and **public** keys.                         |
| Account     | Must implement **the main** entity in blockchain interface. Represents end user of system.    |
| Operation   | Must implement **atomic** transaction.                                                        |
| Transaction | **The main** way to interacting account with blockchain.                                      | 
| Block       | Must implement block of transactions.                                                         |
| Blockchain  | **The main interface**. Must implement block history and databases of coins and transactions. |

## ⚡️ Features

- [x] Using of the blockchain may be possible only with using of pointed interfaces.
- [x] Product does not interact with any internal products and components except used libraries.
- [x] Classes do not provide for all scenarios of its using. User should be careful with them.
- [x] High security standards with using ECDSA and SHA3.
- [x] Blockchain interface may be used by anyone without any restrictions.
