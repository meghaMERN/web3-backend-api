import { ethers } from 'ethers';
import fs, { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' })

const provider = new ethers.JsonRpcProvider(process.env.RCP_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const deployement = JSON.parse(fs, readFileSync("deployed-sepolia.json", "utf8"))
const { address, abi } = deployement

async function main() {
    const token = await ethers.Contract(address, abi, wallet)

    const tx = await token.mint(wallet.address, 1000)
    await tx.wait()


    const balance = await token.balanceOf(wallet.address);
    console.log("My balance on Sepolia:", balance.toString());
}

main().catch(console.error);