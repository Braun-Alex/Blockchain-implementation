const {randomBytes} = require('crypto');
const secp256k1 = require('secp256k1');
const SHA3 = require('js-sha3');
const BigInteger = require('big-integer');
class KeyPair
{
    constructor()
    {
        do
        {
            this.#privateKey = randomBytes(32);
        }
        while (!secp256k1.privateKeyVerify(this.#privateKey));
        this.#publicKey = secp256k1.publicKeyCreate(this.#privateKey);
    }
    getPublicKey()
    {
        return this.#publicKey;
    }
    getPrivateKey()
    {
        return this.#privateKey;
    }
    #privateKey;
    #publicKey;
    balance = BigInteger(0);
}
class Signature
{
    static signData(message, privateKey)
    {
        if (!secp256k1.privateKeyVerify(privateKey))
            throw Error("Invalid private key");
        return secp256k1.ecdsaSign(Buffer.from(SHA3.sha3_256(message).substring(32)),
            privateKey).signature;
    }
    static verifySignature(signature, message, publicKey)
    {
        if (!secp256k1.publicKeyVerify(publicKey))
            throw Error("Invalid public key");
        return secp256k1.ecdsaVerify(signature, Buffer.from(SHA3.sha3_256(message).substring(32)),
            publicKey);
    }
}
class Account
{
    constructor()
    {
        this.#wallet.push(new KeyPair());
    }
    addKeyPairToWallet(pair)
    {
        this.#wallet.push(pair);
    }
    updateBalance(balance)
    {
        balance = BigInteger(balance);
        if (balance.isNegative()) throw Error("Balance must not be negative number");
        let countOfPairs = this.#wallet.length;
        let balancePerWallet = balance.divmod(countOfPairs);
        this.#wallet[0].balance = balancePerWallet.quotient;
        for (let i = 1; i < countOfPairs; ++i)
            this.#wallet[i].balance = balancePerWallet.remainder;
        this.#balance = balance;
    }
    getBalance()
    {
        return this.#balance;
    }
    getAddress()
    {
        return this.#address;
    }
    getPublicKeyByIndex(index)
    {
        return this.#wallet[index].getPublicKey();
    }
    printBalance()
    {
        console.log(this.#balance.toString(10));
    }
    signData(message, index)
    {
        return Signature.signData(message, this.#wallet[index].getPrivateKey());
    }
    createOperation(recipient, amount)
    {
        amount = BigInteger(amount);
        if (amount.greater(this.#balance)) throw Error("Amount is greater than account balance");
        let operationData =
            {
                "sender": this.getAddress(),
                "receiver": recipient.getAddress(),
                "amount": amount
            };
        operationData = SHA3.sha3_256(JSON.stringify(operationData));
        let signatures = [], amountCopy = amount;
        for (let i = 0; !amountCopy.isZero(); ++i)
        {
            if (this.#wallet[i].balance.greaterOrEquals(amountCopy))
            {
                this.#wallet[i].balance = this.#wallet[i].balance.minus(amountCopy);
                amountCopy = BigInteger(0);
            }
            else if (!this.#wallet.balance.isZero())
            {
                amountCopy = amountCopy.minus(this.#wallet[i].balance);
                this.#wallet[i].balance = BigInteger(0);
            }
            signatures.push(Signature.signData(operationData, this.#wallet[i].getPrivateKey()));
        }
        this.#balance = this.#balance.minus(amount);
        return new Operation(this, recipient, amount, signatures);
    }
    #address = BigInteger.randBetween(BigInteger(1),
        BigInteger(2).pow(256).minus(1)).toString(16);
    #wallet = [];
    #balance = BigInteger(0);
}
class Operation
{
    constructor(sender, receiver, amount, signatures)
    {
        amount = BigInteger(amount);
        if (amount.isNegative()) throw Error("Amount must not be negative number");
        this.sender = sender;
        this.receiver = receiver;
        this.amount = BigInteger(amount);
        this.signatures = signatures;
    }
    static verifyOperation(operation)
    {
        if (operation.#locked_status) throw Error("Operation has been already verified");
        if (operation.sender.getBalance().lesser(operation.amount)) return false;
        let operationData =
            {
                "sender": operation.sender.getAddress(),
                "receiver": operation.receiver.getAddress(),
                "amount": operation.amount
            };
        operationData = SHA3.sha3_256(JSON.stringify(operationData));
        let check = true, size = operation.signatures.length;
        for (let i = 0; i < size; ++i)
        {
            check = Signature.verifySignature(operation.signatures[i], operationData,
                operation.sender.getPublicKeyByIndex(i));
            if (!check) return false;
        }
        operation.#locked_status = true;
        return true;
    }
    sender;
    receiver;
    amount;
    signatures;
    #locked_status = false;
}
class Transaction
{
    constructor(setOfOperations, nonce)
    {
        let countOfOperations = setOfOperations.length;
        for (let i = 0; i < countOfOperations; ++i)
            if (!Operation.verifyOperation(setOfOperations[i]))
                throw Error("Transaction contains at least one invalid operation");
        this.#setOfOperations = setOfOperations;
        this.#nonce = nonce;
        let transactionData =
            {
                "setOfOperations": setOfOperations,
                "nonce": nonce
            };
        this.#hash = SHA3.sha3_256(JSON.stringify(transactionData));
    }
    getTransactionHash()
    {
        return this.#hash;
    }
    getTransactionOperations()
    {
        return this.#setOfOperations;
    }
    getTransactionNonce()
    {
        return this.#nonce;
    }
    #hash;
    #setOfOperations;
    #nonce;
}
class Block
{
    constructor(prevHash, setOfTransactions)
    {
        if (setOfTransactions.length === 0) throw Error("Set of transactions must not be empty");
        if (prevHash === '0000000000000000000000000000000000000000000000000000000000000000')
            this.#blockHash = SHA3.sha3_256(SHA3.sha3_256((BigInteger.randBetween(BigInteger(1),
                BigInteger(2).pow(256).minus(1)).toString(16))));
        else
        {
        let merkleContainer = [];
        for (let transaction in setOfTransactions) merkleContainer.push(transaction.getTransactionHash());
        while (merkleContainer.length !== 1)
        {
            let currentLength = merkleContainer.length;
            if (currentLength % 2 !== 0) merkleContainer.push(merkleContainer[length - 1]);
            let merkleHashes = [];
            for (let i = 0; i < currentLength; i += 2)
                merkleHashes.push(SHA3.sha3_256(SHA3.sha3_256(
                    merkleContainer[i] + merkleContainer[i + 1])));
            merkleContainer = [];
            for (let merkleHash in merkleHashes) merkleContainer.push(merkleHash);
        }
        this.#blockHash = merkleContainer[0];
        }
        this.#prevHash = prevHash;
        this.#setOfTransactions = setOfTransactions;
    }
    getBlockHash()
    {
        return this.#blockHash;
    }
    getPrevHash()
    {
        return this.#prevHash;
    }
    getSetOfTransactions()
    {
        return this.#setOfTransactions;
    }
    #blockHash;
    #prevHash;
    #setOfTransactions;
}
class Blockchain
{
    constructor()
    {
        let nullHash = '0000000000000000000000000000000000000000000000000000000000000000';
        let genesisBlock = new Block(nullHash, []);
        this.#blockHistory.push(genesisBlock);
    }
    validateBlock(block)
    {
        if (block.getPrevHash() !== this.#blockHistory[this.#blockHistory.length - 1].getBlockHash())
            return false;
        let transactions = block.getSetOfTransactions(),
            temporaryCoinDatabase = new Map();
        for (let accountAddress in this.#coinDatabase)
            temporaryCoinDatabase.set(accountAddress, this.#coinDatabase.get(accountAddress));
        for (let transaction in transactions)
        {
            if (this.#txDatabase.has(transaction.getTransactionHash())) return false;
            let operations = transaction.getTransactionOperations();
            for (let operation in operations)
            {
                if (!Operation.verifyOperation(operation)) return false;
                let senderAddress = operation.sender.getAddress();
                if (!temporaryCoinDatabase.has(senderAddress))
                    temporaryCoinDatabase.set(senderAddress, BigInteger(0));
                if (temporaryCoinDatabase.get(senderAddress).minus(operation.amount).lesser(BigInteger(0)))
                    return false;
                let receiverAddress = operation.receiver.getAddress();
                if (!temporaryCoinDatabase.has(receiverAddress))
                    temporaryCoinDatabase.set(receiverAddress, BigInteger(0));
                temporaryCoinDatabase.set(receiverAddress, this.#coinDatabase.get(receiverAddress).plus(operation.amount));
            }
        }
        for (let transaction in transactions)
        {
            let operations = transaction.getTransactionOperations();
            for (let operation in operations)
            {
                let senderAddress = operation.sender.getAddress();
                if (this.#coinDatabase.has(senderAddress))
                    temporaryCoinDatabase.set(senderAddress, BigInteger(0));
                this.#coinDatabase.set(senderAddress,
                    this.#coinDatabase.get(senderAddress).minus(operation.amount));
                let receiverAddress = operation.receiver.getAddress();
                if (!this.#coinDatabase.has(receiverAddress))
                    this.#coinDatabase.set(receiverAddress, BigInteger(0));
                this.#coinDatabase.set(receiverAddress, this.#coinDatabase.get(receiverAddress).plus(operation.amount));
                operation.receiver.updateBalance(operation.amount);
                this.#txDatabase.set(transaction.getTransactionHash(), transaction);
            }
        }
        this.#blockHistory.push(block);
        return true;
    }
    getCoinsFromFaucet(account, amount)
    {
        amount = BigInteger(amount);
        if (amount.lesserOrEquals(BigInteger(0))) throw Error("Amount to get from faucet must not be lesser or equal zero");
        if (this.#faucetCoins.divide(amount).lesser(BigInteger(2).pow(128).minus(1)))
            throw Error("Too big amount to get from faucet");
        let remainder = this.#faucetCoins.minus(amount);
        if (remainder.lesser(BigInteger(0))) throw Error("Faucet has no coins");
        let accountAddress = account.getAddress();
        if (!this.#coinDatabase.has(accountAddress))
            this.#coinDatabase.set(accountAddress, BigInteger(0));
        this.#coinDatabase.set(accountAddress, this.#coinDatabase.get(accountAddress).plus(amount));
        account.updateBalance(amount);
    }
    getCoinDatabase()
    {
        return this.#coinDatabase;
    }
    getBlockHistory()
    {
        return this.#blockHistory;
    }
    getTxDatabase()
    {
        return this.#txDatabase;
    }
    #coinDatabase = new Map();
    #blockHistory = [];
    #txDatabase = new Map();
    #faucetCoins = BigInteger(2).pow(256).minus(1);
}
