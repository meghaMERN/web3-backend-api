import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const { Schema } = mongoose;
const algorithm = "aes-256-cbc";

if (!process.env.ENCRYPT_KEY) {
    throw new Error('ENCRYPT_KEY environment variable is not set');
}
console.log(process.env.ENCRYPT_KEY)

const encryptionKey = Buffer.from(process.env.ENCRYPT_KEY, "hex");

export function encrypt(text) {
    const iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
    let encrypted = cipher.update(text, "utf-8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text) {
    try {
        const textParts = text.split(":");
        const iv = Buffer.from(textParts.shift(), "hex");
        const encryptedText = Buffer.from(textParts.join(":"), "hex");
        const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString("utf8");
    } catch (err) {
        console.error("Decryption failed:", err.message);
        return null;
    }
}

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        unique: true
    },
    walletAddress: {
        type: String
    },
    privateKey: {
        type: String
    },
    mnemonic: {
        type: String
    },
    tokens: [
        {
            name: String,
            symbol: String,
            contractAddress: String,
            balance: String
        }
    ]
});

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});

userSchema.pre("save", function (next) {
    if (this.isModified("privateKey") && this.privateKey) {
        console.log("Encrypting private key:", this.privateKey);
        this.privateKey = encrypt(this.privateKey.toString());
    }
    next();
});

userSchema.methods.getDecryptedPrivateKey = function () {
    if (!this.privateKey) return null;
    return decrypt(this.privateKey);
};

const User = mongoose.model('User', userSchema);
export default User;