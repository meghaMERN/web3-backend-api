import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const contractJson = JSON.parse(fs.readFileSync("./artifacts/contracts/Contract.sol/MeghaToken.json", "utf8"));

let privateKey = process.env.PRIVATE_KEY;
if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
}

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(privateKey, provider);
console.log("Deployer address:", wallet.address);

console.log(privateKey)

async function main() {

    const factory = new ethers.ContractFactory(
        contractJson.abi,
        contractJson.bytecode,
        wallet
    );

    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log('Contract deloyed at:', address);


    fs.writeFileSync('deploay.json', JSON.stringify({
        address,
        abi: contractJson.abi
    }, null, 2))
}

main().catch(console.error);

// 0xe13A7FcE5c009130E2a678BDcDE9B3B2160c4260