import React, { useEffect, useState } from "react";
import * as ethers from "ethers";
import abi from "./utils/WavePortal.json";
import metamaskIcon from "./utils/metamask.svg";
import Loader from "./Loader";

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
	console.log(metamaskIcon);
	const [currentAccount, setCurrentAccount] = useState("");
	const [allWaves, setAllWaves] = useState([]);
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(true);
	const contractAddress = process.env.REACT_APP_SMART_CONTRACT_ADDRESS;
	const contractABI = abi.abi;

	const connectWallet = async () => {
		try {
			const ethereum = getEthereumObject();
			if (!ethereum) {
				return alert("Get Metamask!");
			}
			const accounts = await ethereum.request({ method: "eth_requestAccounts" });
			setCurrentAccount(accounts[0]);
			getAllWaves();
		} catch (error) {
			console.log(error);
		}
	};

	const wave = async (e) => {
		e.preventDefault();
		try {
			setLoading(true);
			const ethereum = getEthereumObject();
			if (!ethereum) return console.log("Metamask not found!");
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

			const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });

			await waveTxn.wait();

			setMessage("");
		} catch (error) {
			console.log(error);
		} finally {
			setLoading(false);
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
			setAllWaves(cleanWaves.sort((a, b) => b.timestamp - a.timestamp));
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		setLoading(true);
		findMetamaskAccount().then((account) => {
			if (account) {
				setCurrentAccount(account);
				getAllWaves();
			}
		});
		setLoading(false);
		//eslint-disable-next-line
	}, []);

	useEffect(() => {
		let wavePortalContract;

		const onNewWave = (from, timestamp, message) => {
			console.log("NewWave", from, timestamp, message);
			setAllWaves((prev) => [
				{ address: from, timestamp: new Date(timestamp * 1000), message },
				...prev,
			]);
		};

		if (window.ethereum) {
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();

			wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
			wavePortalContract.on("NewWave", onNewWave);
		}

		return () => {
			if (wavePortalContract) {
				wavePortalContract.off("NewWave", onNewWave);
			}
		};
	}, [contractABI, contractAddress]);

	return !currentAccount ? (
		<div className="unAuth">
			<button className="connectButton" onClick={connectWallet}>
				<img src={metamaskIcon} alt="metamask" />
				<p>Connect Wallet</p>
			</button>
		</div>
	) : (
		<div className="app">
			{loading && <Loader />}
			<div className="intro">
				<p>Hi There,</p>
				<h3>I am Kashish Jain</h3>
				<p>
					Visit me at:{" "}
					<a target="_blank" rel="noopener noreferrer" href="https://kashishjain.tech">
						kashishjain.tech
					</a>
				</p>
			</div>
			<form onSubmit={wave} className="waveButtonParent">
				<input
					required
					type="text"
					name="message"
					placeholder="Write a message..."
					value={message}
					onChange={(e) => setMessage(e.target.value)}
				/>
				<button type="submit" className="waveButton">
					👋🏻 &nbsp; Wave at Me
				</button>
			</form>
			<div className="waveList">
				{allWaves.map((wave, i) => (
					<div key={i} className="waveCard">
						<div className="wave__address">{wave.address}</div>
						<div className="wave__time">{new Date(wave.timestamp).toLocaleString()}</div>
						<div className="wave__message">{wave.message}</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default App;
