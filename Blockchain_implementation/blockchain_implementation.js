const {randomBytes} = require('crypto');
const secp256k1 = require('secp256k1');
const SHA3 = require('js-sha3');
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