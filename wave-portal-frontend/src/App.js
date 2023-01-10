import React, { useEffect, useState } from "react";
import * as ethers from "ethers";
import abi from "./utils/WavePortal.json";

const getEthereumObject = () => window.ethereum;

const findMetamaskAccount = async () => {
	const ethereum = getEthereumObject();
	if (!ethereum) {
		console.log("Make sure you have Metamask!");
		return null;
	}
	const accounts = await ethereum.request({ method: "eth_accounts" });
	if (accounts.length) {
		const account = accounts[0];
		console.log("Found an authorized account:", account);
		return account;
	} else {
		console.log("No authorized account found!");
		return null;
	}
};

const App = () => {
	const [currentAccount, setCurrentAccount] = useState("");
	const [allWaves, setAllWaves] = useState([]);
	const contractAddress = process.env.REACT_APP_SMART_CONTRACT_ADDRESS;
	const contractABI = abi.abi;

	const connectWallet = async () => {
		try {
			const ethereum = getEthereumObject();
			if (!ethereum) {
				return alert("Get Metamask!");
			}
			const accounts = await ethereum.request({ method: "eth_requestAccounts" });
			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error);
		}
	};

	const wave = async () => {
		try {
			const ethereum = getEthereumObject();
			if (!ethereum) return console.log("Metamask not found!");
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

			let count = await wavePortalContract.getTotalWaves();
			console.log("Retrieved total wave count...", count.toNumber());

			const waveTxn = await wavePortalContract.wave("Lorem Ipsum!", { gasLimit: 300000 });
			console.log("Mining...", waveTxn.hash);

			await waveTxn.wait();
			console.log("Mined --", waveTxn.hash);

			count = await wavePortalContract.getTotalWaves();
			console.log("Retrieved total wave count...", count.toNumber());
		} catch (error) {
			console.log(error);
		}
	};

	const getAllWaves = async () => {
		try {
			const ethereum = getEthereumObject();
			if (!ethereum) return console.log("Metamask not found!");

			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

			const waves = await wavePortalContract.getAllWaves();
			console.log(waves);
			const cleanWaves = await waves.map((wave) => {
				return {
					address: wave.waver,
					timestamp: new Date(wave.timestamp * 1000),
					message: wave.message,
				};
			});
			setAllWaves(cleanWaves);
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		findMetamaskAccount().then((account) => {
			if (account) {
				setCurrentAccount(account);
				getAllWaves();
			}
		});
		//eslint-disable-next-line
	}, [])

	useEffect(() => {
		let wavePortalContract;

		const onNewWave = (from, timestamp, message) => {
			console.log("NewWave", from, timestamp, message);
			setAllWaves((prev) => [
				...prev,
				{ address: from, timestamp: new Date(timestamp * 1000), message },
			]);
		};

		if (window.ethereum) {
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();

			wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
			wavePortalContract.on("NewWave", onNewWave);
		}

		return () => {
			if(wavePortalContract){
				wavePortalContract.off("NewWave", onNewWave);
			}
		}
	}, [contractABI]);

	return (
		<div>
			<button className="waveButton" onClick={wave}>
				Wave at Me
			</button>
			{!currentAccount && (
				<button className="waveButton" onClick={connectWallet}>
					Connect Wallet
				</button>
			)}
			{allWaves.map((wave, i) => (
				<div key={i} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
					<div>Address: {wave.address}</div>
					<div>Time: {wave.timestamp.toString()}</div>
					<div>Message: {wave.message}</div>
				</div>
			))}
		</div>
	);
};

export default App;
