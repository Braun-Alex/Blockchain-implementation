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
