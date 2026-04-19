import User from "../models/userSchema.js";
import bcrypt from 'bcrypt';
import { decrypt } from "../models/userSchema.js";
import { Wallet, ethers } from 'ethers';
import { generateToken } from "../utils/jwt.js";
import dotenv from 'dotenv';
import { Contract } from "ethers";
dotenv.config({ path: '../.env' })

export const signup = async (req, res) => {
    try {
        const signUp = await User.create(req.body);
        res.status(200).json({ message: 'User Signed-up successfully', data: signUp })
    } catch (error) {
        res.status(400).json({ message: 'Error in signing up user', error: error.message })
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('-mnemonic -privateKey');
        if (!user) {
            return res.status(404).json({ message: 'User not found', error: error.message })
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(403).json({ message: 'Passwords mismatch' });
        }
        const token = generateToken({ id: user._id });
        return res.status(200).json({ message: 'User logged in succesfully', data: user, token });
    } catch (error) {
        return res.status(400).json({ message: 'Error in logging user', error: error.message });
    }
};

export const createWallet = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        if (user.walletAddress) {
            return res.status(400).json({ message: 'User already has a wallet' });
        }
        const wallet = Wallet.createRandom();

        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const connectedWallet = wallet.connect(provider);

        user.walletAddress = connectedWallet.address;
        user.privateKey = connectedWallet.signingKey.privateKey;
        user.mnemonic = connectedWallet.mnemonic?.phrase;
        await user.save();


        res.status(200).json({
            message: 'Wallet created successfully', data: {
                address: connectedWallet.address,
                privateKey: connectedWallet.privateKey,
                mnemonic: wallet.mnemonic.phrase
            }
        });
    } catch (error) {
        res.status(400).json({ mesage: 'Error in creating Wallet', error: error.message })
    }
};

export const getBalance = async (req, res) => {
    try {
        const { account } = req.body;
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const balance = await provider.getBalance(account);
        const balanceEth = ethers.formatEther(balance)
        return res.status(200).json({ message: 'Found balance details successgfully', balance: balance.toString(), data: balanceEth })
    } catch (err) {
        return res.status(400).json({ mesage: 'Error in getting balance', err: err.message });
    }
};

export const sendTransaction = async (req, res) => {
    try {
        const { privateKey, to, value } = req.body
        const key = decrypt(privateKey)
        if (!key) {
            return res.status(400).json({ message: 'Failed to decrypt private key' });
        }
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const signer = new ethers.Wallet(key, provider);

        const tx = await signer.sendTransaction({
            to,
            value: ethers.parseEther(value.toString())
        })

        await tx.wait();
        const hash = tx.hash
        const myBalance = await provider.getBalance(signer.address);
        const recieverBalance = await provider.getBalance(to)

        return res.status(200).json({ message: 'Transaction send succesfully', data: { hash, myBalance: ethers.formatEther(myBalance), recieverBalance: ethers.formatEther(recieverBalance) } });
    } catch (error) {
        return res.status(400).json({ message: 'Error in sending transaction', error: error.message });
    }
};

export const getTokenBalance = async (req, res) => {
    try {
        const { email, tokenAddress } = req.body
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

        const tokenAbi = [
            "function balanceOf(address) view returns (uint256)",
            "function name() view returns (string)",
            "function symbol() view returns (string)"
        ];

        const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);

        const balanceRaw = await tokenContract.balanceOf(user.walletAddress);
        const balance = ethers.formatUnits(balanceRaw);

        const name = await tokenContract.name();
        const symbol = await tokenContract.symbol();

        const existingToken = user.tokens.findIndex(token => token.contractAddress.toLowerCase() === tokenAddress.toLowerCase());
        if (existingToken !== 1) {
            user.tokens[existingToken].balance = balance;
        } else {
            user.tokens.push({
                name,
                symbol,
                contractAddress: tokenAddress,
                balance
            })
        };

        await user.save();

        res.status(200).json({
            message: existingToken !== -1 ? "Token balance updated successfully" : "New token added successfully",
            token: { name, symbol, balance, contractAddress: tokenAddress }
        });
    } catch (err) {
        return res.status(400).json({ message: 'Error in getting token balance', err: err.message })
    }
};

export const transferToken = async (req, res) => {
    try {
        const { privateKey, toAddress, amount, walletAddress, contractAddress } = req.body;
        const key = decrypt(privateKey)
        const user = await User.findOne({ walletAddress });
        if (!user) {
            return res.status(404).json({ message: 'wallet do not exist' });
        }
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(key, provider);

        const tokenAddress = contractAddress;
        const tokenAbi = [
            "function transfer(address to , uint amount) returns (bool)",
            "function decimals() view returns (uint8)",
            "function name() view returns (string)",
            "function symbol() view returns(string)"
        ];
        const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, wallet);

        const decimals = await tokenContract.decimals();

        const amountInWei = ethers.parseUnits(amount.toString(), decimals);
        const tokenName = await tokenContract.name();
        const tokenSymbol = await tokenContract.symbol();

        const feeData = await provider.getFeeData();
        console.log('current  gas price:', ethers.formatUnits(feeData.gasPrice, 'gwei'));

        const gasLimit = await tokenContract.transfer.estimateGas(toAddress, amountInWei);
        console.log('Estimated gas limit:', gasLimit.toString());

        const customGasPrice = ethers.parseUnits('15', 'gwei')

        const estimatedCost = gasLimit * customGasPrice;
        console.log('Estimated transaction cost:', ethers.formatEther(estimatedCost), 'ETH')
        console.log('Gas price set:', ethers.formatUnits(customGasPrice, 'gwei'), 'gwei');
        console.log('Gas limit set:', gasLimit.toString());


        const tx = await tokenContract.transfer(toAddress, amountInWei, { gasLimit: gasLimit, gasPrice: customGasPrice });
        const receipt = await tx.wait();

        const transferEvents = receipt.logs.map(log => {
            try {
                return tokenContract.interface.parseLog(log);
            } catch {
                return null;
            }
        }).filter(e => e && e.name === "Transfer")[0];

        if (transferEvents) {
            console.log('Transfer Events', {
                from: transferEvents.args.from,
                to: transferEvents.args.to,
                amount: ethers.formatUnits(transferEvents.args.amount, decimals)
            })
        }

        const senderToken = user.tokens.find(t => t.contractAddress === tokenAddress);
        senderToken.balance = (parseFloat(senderToken.balance) - parseFloat(amount)).toString();

        await user.save();

        let recipient = await User.findOne({ walletAddress: toAddress });
        if (!recipient) {
            recipient = new User({ walletAddress: toAddress, tokens: [] });
        }

        const recipientToken = recipient.tokens.find(t => t.contractAddress === tokenAddress);
        if (recipientToken) {
            recipientToken.balance = (parseFloat(recipientToken.balance) + parseFloat(amount)).toString();
        } else {
            recipient.tokens.push({
                name: tokenName,
                symbol: tokenSymbol,
                contractAddress: tokenAddress,
                balance: amount.toString()
            });
        }

        await recipient.save();

        res.status(200).json({
            message: "Token sent successfully",
            transactionHash: tx.hash,
            transferEvent: transferEvents ? {
                from: transferEvents.args.from,
                to: transferEvents.args.to,
                amount: ethers.formatUnits(transferEvent.args.amount, decimals)
            } : null,
            gasResults: {
                gasUsed: receipt.gasUsed.toString(),
                gasPrice: ethers.formatUnits(receipt.gasPrice, 'gwei') + ' gwei',
                totalGasCost: ethers.formatEther(receipt.gasUsed * receipt.gasPrice) + ' ETH',
                estimatedGas: gasLimit.toString(),
                status: receipt.status === 1 ? 'Success' : 'Failed'
            }
        });
    } catch (err) {
        return res.status(400).json({ message: 'Error in transferring tokens', err: err.message })
    }
};