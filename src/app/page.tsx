"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useWriteContract, useReadContract, useSwitchChain, useChainId, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther, maxUint256 } from "viem";
import styled from "styled-components";
import { AutoColumn } from "../components/Column";
import { AutoRow } from "../components/Row";// Contract info type
import NumericalInput from "../components/NumericalInput";
import { useBridgeParams } from "@/hooks";
import NetworkSelectModal from "@/components/Bridge/NetworkSelectModal";
import TokenSelectModal from "@/components/Bridge/TokenSelectModal";
import BridgeABI from "@/lib/abis/Bridge.json";
import { toast } from 'react-hot-toast'
import ERC20_ABI from "@/lib/abis/ERC20.json";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// ---------------- local types ----------------
type Network = {
	id: string;
	name: string;
	description: string;
	icon: string;
	chainId: number;
	contract?: string;
	explorerUrl?: string;
	rpc?: string;
};

type TokenInfo = {
	id: string;
	name: string;
	symbol: string;
	description: string;
	icon: string;
	balance: string;
	address: string;
	toChainId?: number;
	toToken?: string;
	toTokenSymbol?: string;
};

type HistoryItem = {
	from_chain: string;
	to_chain: string;
	tx_hash: string;
	create_time: number; // seconds epoch
	amount: string; // wei string
	token: string;
	token_symbol: string;
	status: string;
	url_source: string;
	url_target?: string;
	confirm_count: number;
	reject_count: number;
};

type HistoryApiResponse = {
	code: number;
	data?: { pending: HistoryItem[]; finish: HistoryItem[] };
	msg?: string;
};

// 新增：Bridge API 返回的支持 Token 结构类型
type TokenSupport = {
	token_contract: string;
	to_chain_id: number;
	to_token: string;
	to_token_symbol: string;
};

// ---------------- styled-components ----------------
const Page = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 80vh;
  padding: 64px 40px;
  @media (max-width: 768px) {
	padding: 0 16px 32px;
  }
`;

const Grid = styled.section`
	display: grid;
	grid-template-columns: 1fr;
	min-height: calc(100vh - 88px);
`;

const PanelWrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
`;

const Tabs = styled.div`
	display: flex;
	width: 100%;
	max-width: 960px;
	margin: 24px auto 0 auto;
`;

const Tab = styled.button<{ active?: boolean }>`
	appearance: none;
	border: none;
	outline: none;
	cursor: pointer;
	padding: 10px 24px;
	border-radius: 12px 12px 0 0;
	font-size: 14px;
	font-weight: 600;
	transition: all .2s ease;
	background: ${({ active }) => (active ? '#C1FF72' : 'linear-gradient(180deg, #000000 0%, #231F20 100%)')};
	color: ${({ active }) => (active ? '#231F20' : 'rgba(255,255,255,0.9)')};
	box-shadow: ${({ active }) => (active ? '0 2px 0 rgba(0,0,0,0)' : '0 6px 12px rgba(0,0,0,0.35)')};

	&:hover { opacity: 0.85; }
	min-width: 30%;
`;

const Wrapper = styled.div`
	position: relative;
	width: 100%;
	max-width: 960px;
	background: linear-gradient(rgb(0, 0, 0) 0%, rgb(35, 31, 32) 100%);
	border-radius: 0 0 12px 12px;
	padding: 32px 56px;
	box-shadow: rgba(0, 0, 0, 0.25) 0px 10px 9.4px -2px;

	@media (max-width: 960px) {
		padding: 16px;
	}
`

// ---- History styles ----
// const HistoryTopBar = styled.div`
// 	display: grid;
// 	grid-template-columns: 1fr auto;
// 	gap: 12px;
// 	align-items: center;
// 	margin-bottom: 16px;
// `;

// const SearchBox = styled.div`
// 	display: flex;
// 	align-items: center;
// 	gap: 10px;
// 	padding: 10px 12px;
// 	background: #1f1f1f;
// 	border: 1px solid #2a2a2a;
// 	border-radius: 6px;
// `;

// const SearchIcon = styled.span`
// 	display: inline-flex;
// 	width: 16px;
// 	height: 16px;
// 	border-radius: 50%;
// 	box-shadow: inset 0 0 0 2px rgba(255,255,255,0.2);
// `;

// const SearchInput = styled.input`
// 	flex: 1;
// 	background: transparent;
// 	border: none;
// 	outline: none;
// 	color: #ddd;
// 	font-size: 14px;
// 	::placeholder { color: #6c6c6c; }
// `;

// const SearchButton = styled.button`
// 	padding: 8px 16px;
// 	background: #C1FF72;
// 	color: #231F20;
// 	border: none;
// 	border-radius: 6px;
// 	font-weight: 700;
// 	cursor: pointer;
// `;

const HistoryInnerTabs = styled.div`
	display: flex;
	gap: 16px;
	align-items: center;
	margin: 8px 0 12px 0;
	border-bottom: 1px solid #3a3a3a;
`;

const HistoryInnerTab = styled.button<{ active?: boolean }>`
	appearance: none;
	background: transparent;
	border: none;
	outline: none;
	cursor: pointer;
	padding: 6px 0;
	color: ${({ active }) => (active ? '#C1FF72' : '#bdbdbd')};
	font-weight: 600;
	border-bottom: 2px solid ${({ active }) => (active ? '#C1FF72' : 'transparent')};
`;

const HistoryCard = styled.div`
	padding: 16px;
	background: #1b1b1b;
	border: 1px solid #2a2a2a;
	border-radius: 6px;
	color: #bdbdbd;
	min-height: 200px;
	max-height: 720px;
	overflow-y: auto;

	/* Scrollbar styling */
	scrollbar-width: thin;
	scrollbar-color: #555 #222;

	&::-webkit-scrollbar {
		width: 8px;
	}
	&::-webkit-scrollbar-track {
		background: #222;
		border-radius: 8px;
	}
	&::-webkit-scrollbar-thumb {
		background-color: #555;
		border-radius: 8px;
		border: 2px solid #222;
	}
`;

const HistoryList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const HistoryHeader = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr 1.2fr 1fr 1.5fr 1fr auto;
	gap: 8px;
	align-items: center;
	padding: 8px 12px;
	background: #2a2a2a;
	border: 1px solid #3a3a3a;
	border-radius: 6px;
	color: #aaa;
	font-size: 12px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	@media (max-width: 768px) {
		min-width: 500px;
		grid-template-columns: 1fr 1fr 1.2fr 1fr 1fr 1fr auto;
		overflow-x: auto;
	}
`;

const HistoryRow = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr 1.6fr 1fr 1.5fr 1fr auto;
	gap: 8px;
	align-items: center;
	padding: 10px 12px;
	background: #1f1f1f;
	border: 1px solid #2a2a2a;
	border-radius: 6px;
	color: #ddd;
	@media (max-width: 768px) {
		min-width: 500px;
		grid-template-columns: 1fr 1fr 2.2fr 1fr 1fr 1fr auto;
		overflow-x: auto;
	}
`;

const HashMono = styled.a`
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
	font-size: 12px;
	text-decoration: none;
	color: #c1ff72;
	transition: all 0.2s ease;
	cursor: pointer;
	&:hover {
		text-decoration: underline;
		opacity: 0.8;
	}
`;

const StatusTag = styled.span<{ ok?: boolean }>`
	padding: 2px 8px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 700;
	color: ${({ ok }) => (ok ? '#0c0' : '#ffb300')};
	background: ${({ ok }) => (ok ? '#0c0' : '#ffb300')}22;
	border: 1px solid ${({ ok }) => (ok ? '#0c0' : '#ffb300')}55;
`;

const EmptyText = styled.div`
	font-size: 12px;
	color: #9a9a9a;
`;

const SwapIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #c1ff72;
  padding: 10px;
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    transition: all 0.3s ease;

    &:active {
      transform: translateX(-50%) scale(0.95);
    }
  }
`

const SwapIcon = styled.img`
  width: 16px;
  height: 16px;

  @media (max-width: 768px) {
    width: 20px;
    height: 20px;
  }
`

const BridgeSection = styled.div`
  position: relative;
`

const BridgeInputPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 5px;
  background-color: #212121;
  border: 1px solid #2a2a2a;
`

const NetworkRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const InputTokenRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  background: #c1ff721a;
  border-radius: 5px;
  padding: 0 8px;
  border: none;
  gap: 0;
`

const ToInputTokenRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  background: #c1ff721a;
  border-radius: 5px;
  padding: 3px 8px;
  border: none;
  gap: 0;
`

const NetworkSelector = styled.div`
  display: flex;
  align-items: center;
  background: #4a5d23;
  border-radius: 5px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  margin-right: 12px;
  max-width: 50%;
  @media (max-width: 960px) {
    max-width: 70%;
  }

  &:hover {
    background: #5a6d33;
  }
`

const NetworkInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const NetworkName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #fff;
`

const NetworkIcon = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
`

const TokenBalance = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-flow: row nowrap;
  @media (max-width: 960px) {
    flex-direction: column;
    align-items: flex-end;
  }
`

const TokenBalanceIconWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0px;
  flex-flow: row nowrap;
  @media (max-width: 960px) {
    display: none;
  }
`

const TokenSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 0 0.5rem;
  background: transparent;
  border-radius: 0 5px 5px 0;
  transition: all 0.2s ease;
  height: 2.2rem;
  font-size: 20px;
  font-weight: 500;
  margin-left: 0;
`

const TokenIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const TokenSymbol = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
`

const StyledDropDown = styled.img`
  margin: 0 0.25rem 0 0.5rem;
  height: 35%;

  path {
    stroke: #fff;
    stroke-width: 1.5px;
  }
`

const TermsSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 5px;
  margin-top: 30px;
`

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #c1ff72;
`

const TermsText = styled.div`
  font-size: 14px;
  color: #999;
  line-height: 1.4;

  a {
    color: #c1ff72;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`

const BottomGrouping = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const ActionButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  padding: 10px 24px;
  background: ${({ disabled }) => (disabled ? '#666' : '#C1FF72')};
  color: ${({ disabled }) => (disabled ? '#999' : '#231F20')};
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;

  &:hover {
    opacity: ${({ disabled }) => (disabled ? 1 : 0.9)};
  }
`;

const BalanceText = styled.div`
  margin-left: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0.85;
`

const ToNetworkInfo = styled.div`
  display: flex;
  align-items: center;
  background: #4a5d23;
  border-radius: 5px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  margin-right: 12px;
  max-width: 50%;
  font-size: 15px;
  font-weight: 600;
  @media (max-width: 960px) {
    max-width: 70%;
  }
`

const ToTokenInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0.5rem;
  background: transparent;
  border-radius: 0 5px 5px 0;
  height: 2.2rem;
  font-size: 20px;
  font-weight: 500;
  color: #fff;
`

const NetworkFallbackCircle = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #2f2f2f;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c1ff72;
  font-size: 16px;
  font-weight: 700;
`;

const TokenFallbackCircle = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #2f2f2f;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c1ff72;
  font-size: 12px;
  font-weight: 700;
`;

function renderNetworkAvatar(src?: string, label?: string) {
	if (src && src.trim().length > 0) {
		return <NetworkIcon src={src} alt={label || ''} onError={(e) => ((e.currentTarget.style.display = 'none'), void 0)} />;
	}
	const ch = (label || '').trim().charAt(0).toUpperCase() || '?';
	return <NetworkFallbackCircle>{ch}</NetworkFallbackCircle>;
}

function renderTokenAvatar(src?: string, label?: string) {
	if (src && src.trim().length > 0) {
		return <TokenIcon src={src} alt={label || ''} onError={(e) => ((e.currentTarget.style.display = 'none'), void 0)} />;
	}
	const ch = (label || '').trim().charAt(0).toUpperCase() || '?';
	return <TokenFallbackCircle>{ch}</TokenFallbackCircle>;
}

export default function Home() {
	const { address, isConnected } = useAccount();
	// const { data: balance } = useBalance({ address });
	const { switchChain } = useSwitchChain();
	const currentChainId = useChainId();

	const { data: bridgeParams, loading: bridgeLoading } = useBridgeParams()

	// Bridge state
	const [fromAmount, setFromAmount] = useState('')
	// const [toAmount, setToAmount] = useState('')
	const [fromNetwork, setFromNetwork] = useState<Network | null>(null)
	const [toNetwork, setToNetwork] = useState<Network | null>(null)
	const [fromToken, setFromToken] = useState<TokenInfo | null>(null)
	const [toToken, setToToken] = useState<TokenInfo | null>(null)
	const [termsAccepted, setTermsAccepted] = useState(false)
	const [activeTab, setActiveTab] = useState<'bridge' | 'history'>('bridge')

	// History state
	// const [historyAddress, setHistoryAddress] = useState('')
	const [historyTab, setHistoryTab] = useState<'pending' | 'settled'>('pending')
	const [historyLoading, setHistoryLoading] = useState(false)
	const [historyError, setHistoryError] = useState<string | null>(null)
	const [historyPending, setHistoryPending] = useState<HistoryItem[]>([])
	const [historyFinish, setHistoryFinish] = useState<HistoryItem[]>([])

	// Modal states
	const [showFromNetworkModal, setShowFromNetworkModal] = useState(false)
	const [showFromTokenModal, setShowFromTokenModal] = useState(false)

	// 简化的按钮状态控制
	const [buttonText, setButtonText] = useState('Connect Wallet')
	const [buttonDisabled, setButtonDisabled] = useState(false)
	const [buttonAction, setButtonAction] = useState<'connect' | 'approve' | 'bridge' | 'none'>('connect')
	const [bridgeTxHash, setBridgeTxHash] = useState<`0x${string}` | undefined>(undefined)
	// 跟踪已处理的授权哈希，避免重复触发
	const [processedApproveHash, setProcessedApproveHash] = useState<string | null>(null)

	// Token balance and allowance queries
	const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
		address: fromToken?.address as `0x${string}`,
		abi: ERC20_ABI,
		functionName: 'balanceOf',
		args: address ? [address] : undefined,
		query: {
			enabled: !!fromToken?.address && !!address && fromToken.address !== '0x0000000000000000000000000000000000000000'
		}
	});

	const { data: tokenAllowance, refetch: refetchTokenAllowance } = useReadContract({
		address: fromToken?.address as `0x${string}`,
		abi: ERC20_ABI,
		functionName: 'allowance',
		args: address && fromNetwork?.contract ? [address, fromNetwork.contract as `0x${string}`] : undefined,
		query: {
			enabled: !!fromToken?.address && !!address && !!fromNetwork?.contract && fromToken.address !== '0x0000000000000000000000000000000000000000'
		}
	});

	// Write contract for approval
	const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending } = useWriteContract();
	const { writeContractAsync: writeBridgeAsync, isPending: isBridgePending } = useWriteContract()
	const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed, isError: isApproveError } =
		useWaitForTransactionReceipt({ hash: approveHash })
	const { isLoading: isBridgeConfirming, isSuccess: isBridgeConfirmed, isError: isBridgeError } =
		useWaitForTransactionReceipt({ hash: bridgeTxHash })

	// 更新按钮状态
	const updateButtonState = useCallback(() => {
		if (!isConnected) {
			setButtonText('Connect Wallet')
			setButtonDisabled(false)
			setButtonAction('connect')
			return
		}

		if (!termsAccepted) {
			setButtonText('Accept Terms')
			setButtonDisabled(true)
			setButtonAction('none')
			return
		}

		if (!fromToken) {
			setButtonText('Select Token')
			setButtonDisabled(true)
			setButtonAction('none')
			return
		}

		if (!fromAmount || parseFloat(fromAmount) <= 0) {
			setButtonText('Enter Amount')
			setButtonDisabled(true)
			setButtonAction('none')
			return
		}

		const amountWei = parseEther(fromAmount || '0')
		const balanceWei = tokenBalance || BigInt(0)
		const allowanceWei = tokenAllowance || BigInt(0)

		if (Number(balanceWei) < amountWei) {
			setButtonText('Insufficient Balance')
			setButtonDisabled(true)
			setButtonAction('none')
			return
		}

		// 检查是否需要Approve
		if (Number(allowanceWei) < amountWei) {
			if (isApprovePending || isApproveConfirming) {
				setButtonText('Approving...')
				setButtonDisabled(true)
				setButtonAction('approve')
			} else {
				setButtonText('Approve')
				setButtonDisabled(false)
				setButtonAction('approve')
			}
			return
		}

		// 可以跨链
		if (isBridgePending || isBridgeConfirming) {
			setButtonText('Bridging...')
			setButtonDisabled(true)
			setButtonAction('bridge')
		} else {
			setButtonText('Bridge')
			setButtonDisabled(false)
			setButtonAction('bridge')
		}
	}, [isConnected, termsAccepted, fromToken, fromAmount, tokenBalance, tokenAllowance, isApprovePending, isApproveConfirming, isBridgePending, isBridgeConfirming])

	// 监听状态变化，更新按钮
	useEffect(() => {
		updateButtonState()
	}, [updateButtonState])

	// const handleSwap = useCallback(() => {
	// 	// 交换网络和token
	// 	const tempNetwork = fromNetwork
	// 	const tempToken = fromToken
	// 	const tempAmount = fromAmount

	// 	console.log('toToken', toToken)

	// 	setFromNetwork(toNetwork)
	// 	setToNetwork(tempNetwork)
	// 	setFromToken(toToken)
	// 	setToToken(tempToken)
	// 	setFromAmount(toAmount)
	// 	setToAmount(tempAmount)
	// 		// 	setBridgeTxHash(undefined) // 清理
	// 	switchChain({ chainId: toNetwork?.chainId as number })
	// }, [fromNetwork, toNetwork, fromToken, toToken, fromAmount, toAmount, setAwaitingBridgeAfterApprove, switchChain])

	const handleTypeInput = useCallback((value: string) => {
		setFromAmount(value)
		// 这里可以添加计算逻辑
		// setToAmount(value) // 简化处理，实际应该有汇率计算
	}, [])

	// const handleTypeOutput = useCallback((value: string) => {
	// 	setToAmount(value)
	// }, [])

	const handleBridge = useCallback(async () => {
		console.log('handleBridge', fromNetwork, fromToken, fromAmount, address)
		if (!fromNetwork?.contract || !fromToken?.address || !fromToken?.toChainId || !address) return
		try {
			const hash = await writeBridgeAsync({
				address: fromNetwork.contract as `0x${string}`,
				abi: BridgeABI.abi,
				functionName: 'outTransfer',
				args: [
					fromToken.address as `0x${string}`,
					parseEther(fromAmount || '0'),
					BigInt(fromToken.toChainId),
					address,
				],
			})
			setBridgeTxHash(hash as `0x${string}`)
		} catch (e) {
			console.error('outTransfer error', e)
		}
	}, [fromNetwork, fromToken, fromAmount, address, writeBridgeAsync])

	const handleApprove = useCallback(() => {
		if (fromToken?.address && fromNetwork?.contract) {
			try {
				writeApprove({
					address: fromToken.address as `0x${string}`,
					abi: ERC20_ABI,
					functionName: 'approve',
					args: [fromNetwork.contract as `0x${string}`, maxUint256]
				});
			} catch (error) {
				console.error('approve error', error)
			}

		}
	}, [fromToken, fromNetwork, writeApprove]);

	// 监听授权确认，避免重复触发
	useEffect(() => {
		if (isApproveConfirmed && approveHash && approveHash !== processedApproveHash) {
			toast.success('Approve confirmed')
			refetchTokenAllowance?.()
			setProcessedApproveHash(approveHash)
			updateButtonState()
		}
	}, [isApproveConfirmed, approveHash, processedApproveHash, refetchTokenAllowance, updateButtonState])

	// 网络或代币变化时重置已处理哈希
	useEffect(() => {
		setProcessedApproveHash(null)
	}, [fromNetwork?.id, fromToken?.address])

	// Bridge 成功提示 + 刷新余额
	useEffect(() => {
		if (isBridgeConfirmed && bridgeTxHash) {
			toast.success('Bridge submitted')
			setBridgeTxHash(undefined)
			// 清空输入框并在短暂延迟后刷新页面
			setFromAmount('')
			if (typeof window !== 'undefined') {
				setTimeout(() => {
					refetchTokenBalance()
					updateButtonState()
				}, 1500)
			}
		}
	}, [isBridgeConfirmed, bridgeTxHash, refetchTokenBalance, updateButtonState])

	// 监听失败
	useEffect(() => {
		if (isApproveError) {
			toast.error('Approve失败')
			updateButtonState()
		}
	}, [isApproveError, updateButtonState])

	useEffect(() => {
		if (isBridgeError && bridgeTxHash) {
			toast.error('Bridge failed')
			setBridgeTxHash(undefined)
			updateButtonState()
		}
	}, [isBridgeError, bridgeTxHash, updateButtonState])

	const handleButtonClick = useCallback(() => {
		switch (buttonAction) {
			case 'approve':
				handleApprove();
				break;
			case 'bridge':
				handleBridge();
				break;
		}
	}, [buttonAction, handleApprove, handleBridge]);

	const handleFromNetworkSelect = useCallback((network: Network) => {
		setFromNetwork(network)
		// 清空token选择，因为网络变了
		setFromToken(null)
		setToToken(null)
		setToNetwork(null)
		setBridgeTxHash(undefined) // 清理
		// 切换钱包网络到所选 From 网络
		try {
			if (network.chainId && currentChainId !== network.chainId) {
				switchChain({ chainId: network.chainId })
			}
		} catch (e) {
			console.warn('switch chain failed', e)
		}
	}, [currentChainId, switchChain])

	const handleFromTokenSelect = useCallback((token: TokenInfo) => {
		setFromToken(token)

		console.log(token)

		// 根据选择的token自动设置目标网络和token
		if (token.toChainId && bridgeParams?.chains) {
			// 找到目标网络
			const targetChainEntry = Object.entries(bridgeParams.chains).find(([, chainData]) =>
				chainData.chain_id === token.toChainId
			);

			if (targetChainEntry) {
				const [targetChainKey, targetChainData] = targetChainEntry;
				setToNetwork({
					id: targetChainKey,
					name: targetChainData.chain,
					description: `${targetChainData.chain} network`,
					icon: targetChainKey && targetChainKey.includes('Mova') ? '/images/mova-logo.png' : targetChainKey && (targetChainKey.includes('BSC') || targetChainKey.includes('Binance')) ? '/images/bnb-logo.png' : '',
					chainId: targetChainData.chain_id,
					contract: targetChainData.contract,
					explorerUrl: targetChainData.explorer_url,
					rpc: targetChainData.rpc
				});
				console.log({
					id: token.toToken?.toLowerCase() || '',
					name: token.toTokenSymbol || token.symbol,
					symbol: token.toTokenSymbol || token.symbol,
					description: `${token.toTokenSymbol || token.symbol} token`,
					// icon: '/images/mars-logo.png',
					balance: '0',
					address: token.toToken || '',
					toChainId: token.toChainId,
					toToken: token.toToken
				})
				// 设置目标token
				setToToken({
					id: token.toToken?.toLowerCase() || '',
					name: token.toTokenSymbol || token.symbol,
					symbol: token.toTokenSymbol || token.symbol,
					description: `${token.toTokenSymbol || token.symbol} token`,
					icon: '',
					balance: '0',
					address: token.toToken || '',
					toChainId: token.toChainId,
					toToken: token.toToken
				});
			}
		}
	}, [bridgeParams])

	const fetchHistory = useCallback(async (addr: string) => {
		if (!addr) return;
		try {
			setHistoryLoading(true)
			setHistoryError(null)
			const res = await fetch(`https://bridge.marsapi.movachain.com/api/v1/user/history?address=${addr}`)
			const json: HistoryApiResponse = await res.json()
			if (json.code === 0 && json.data) {
				setHistoryPending(json.data.pending || [])
				setHistoryFinish(json.data.finish || [])
			} else {
				setHistoryError(json.msg || 'Failed to load history')
			}
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : 'Network error'
			setHistoryError(message)
		} finally {
			setHistoryLoading(false)
		}
	}, [])

	// const displayAddr = useMemo(() => historyAddress || address || '', [historyAddress, address])
	const displayAddr = useMemo(() => address || '', [address])


	useEffect(() => {
		if (activeTab === 'history' && displayAddr) {
			fetchHistory(displayAddr)
		}
	}, [activeTab, displayAddr, fetchHistory])

	// const handleSearchHistory = useCallback(() => {
	// 	if (historyAddress) fetchHistory(historyAddress)
	// }, [historyAddress, fetchHistory])

	const shortHash = (h: string) => (h && h.length > 10 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h)
	const formatTime = (sec: number) => new Date(sec * 1000).toLocaleString()
	const formatAmount = (wei: string, symbol: string) => `${Number(parseFloat(formatEther(BigInt(wei))).toFixed(4)).toLocaleString()} ${symbol}`

	// Format token balance for display
	const formatTokenBalance = () => {
		if (!tokenBalance || !fromToken) return '--';
		const formatted = formatEther(tokenBalance as bigint);
		return `${Number(parseFloat(formatted).toFixed(4)).toLocaleString()} ${fromToken.symbol}`;
	};

	// 获取可用的网络列表
	const getAvailableNetworks = () => {
		console.log(bridgeParams?.chains)
		if (!bridgeParams?.chains) return [];
		return Object.entries(bridgeParams.chains).map(([key, chainData]) => ({
			id: key,
			name: chainData.chain,
			description: `${chainData.chain} network`,
			icon: key && key.includes('Mova') ? '/images/mars-logo.png' : key && (key.includes('BSC') || key.includes('Binance')) ? '/images/bnb-logo.png' : '',
			chainId: chainData.chain_id,
			contract: chainData.contract,
			explorerUrl: chainData.explorer_url,
			rpc: chainData.rpc
		}));
	};

	// 获取当前网络下可用的token列表
	const getAvailableTokens = () => {
		if (!fromNetwork || !bridgeParams?.chains) return [];
		const chainData = bridgeParams.chains[fromNetwork.id];
		if (!chainData) return [];

		const supportTokens = (chainData.support_tokens || {}) as Record<string, TokenSupport>;
		return Object.entries(supportTokens).map(([symbol, info]) => ({
			id: info.token_contract.toLowerCase(),
			name: symbol,
			symbol,
			description: `${symbol} token`,
			icon: '',
			balance: '0',
			address: info.token_contract,
			toChainId: info.to_chain_id,
			toToken: info.to_token,
			toTokenSymbol: info.to_token_symbol
		}));
	};

	useEffect(() => {
		if (bridgeParams && bridgeParams.chains) {
			const chains = Object.entries(bridgeParams.chains)

			if (chains.length >= 2) {
				// Set first chain as from network
				const [firstChainKey, firstChain] = chains[0]
				setFromNetwork({
					id: firstChainKey,
					name: firstChain.chain,
					description: `${firstChain.chain} network`,
					icon: firstChainKey && firstChainKey.includes('Mova') ? '/images/mars-logo.png' : firstChainKey && (firstChainKey.includes('BSC') || firstChainKey.includes('Binance')) ? '/images/bnb-logo.png' : '',
					chainId: firstChain.chain_id,
					contract: firstChain.contract,
					explorerUrl: firstChain.explorer_url,
					rpc: firstChain.rpc
				})

				switchChain({ chainId: firstChain.chain_id })

				// Set second chain as to network
				const [secondChainKey, secondChain] = chains[1]
				setToNetwork({
					id: secondChainKey,
					name: secondChain.chain,
					description: `${secondChain.chain} network`,
					icon: secondChainKey && secondChainKey.includes('Mova') ? '/images/mars-logo.png' : secondChainKey && (secondChainKey.includes('BSC') || secondChainKey.includes('Binance')) ? '/images/bnb-logo.png' : '',
					chainId: secondChain.chain_id,
					contract: secondChain.contract,
					explorerUrl: secondChain.explorer_url,
					rpc: secondChain.rpc
				})

				// Set default tokens
				const firstTokenSymbols = Object.keys(firstChain.support_tokens)
				if (firstTokenSymbols.length > 0) {
					const firstSymbol = firstTokenSymbols[0]
					const info = firstChain.support_tokens[firstSymbol] as TokenSupport
					setFromToken({
						id: info.token_contract.toLowerCase(),
						name: firstSymbol,
						symbol: firstSymbol,
						description: `${firstSymbol} token`,
						icon: '',
						balance: '0',
						address: info.token_contract,
						toChainId: info.to_chain_id,
						toToken: info.to_token,
						toTokenSymbol: info.to_token_symbol
					})

					// 自动设置目标token
					const targetChainEntry = Object.entries(bridgeParams.chains).find(([, chainData]) =>
						chainData.chain_id === info.to_chain_id
					);

					if (targetChainEntry) {
						const [targetChainKey, targetChainData] = targetChainEntry;
						setToNetwork({
							id: targetChainKey,
							name: targetChainData.chain,
							description: `${targetChainData.chain} network`,
							icon: targetChainKey && targetChainKey.includes('Mova') ? '/images/mars-logo.png' : targetChainKey && (targetChainKey.includes('BSC') || targetChainKey.includes('Binance')) ? '/images/bnb-logo.png' : '',
							chainId: targetChainData.chain_id,
							contract: targetChainData.contract,
							explorerUrl: targetChainData.explorer_url,
							rpc: targetChainData.rpc
						});

						setToToken({
							id: info.to_token?.toLowerCase() || '',
							name: info.to_token_symbol || firstSymbol,
							symbol: info.to_token_symbol || firstSymbol,
							description: `${info.to_token_symbol || firstSymbol} token`,
							icon: '',
							balance: '0',
							address: info.to_token || '',
							toChainId: info.to_chain_id,
							toToken: info.to_token
						});
					}
				}
			}
		}
	}, [bridgeParams, switchChain])

	// Show loading state while contract data is being fetched
	if (isConnected && bridgeLoading) {
		return (
			<Page>
				<Grid>
					<PanelWrapper>
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C1FF72] mx-auto mb-4"></div>
							<div className="text-white text-lg">Loading contract data...</div>
						</div>
					</PanelWrapper>
				</Grid>
			</Page>
		);
	}

	return (
		<Page>
			<Tabs>
				<Tab active={activeTab === 'bridge'} onClick={() => setActiveTab('bridge')}>Bridge</Tab>
				<Tab active={activeTab === 'history'} onClick={() => setActiveTab('history')}>Txn History</Tab>
			</Tabs>
			<Wrapper id="bridge-page">
				{activeTab === 'bridge' ? (
					<AutoColumn gap={'sm'}>
						<BridgeSection>
							{/* From Section */}
							<BridgeInputPanel>
								<NetworkRow>
									<NetworkSelector onClick={() => setShowFromNetworkModal(true)}>
										<NetworkInfo>
											<NetworkName>From: {fromNetwork?.name}</NetworkName>
											<StyledDropDown src={'/images/dropdown.svg'} alt="dropdown" />
										</NetworkInfo>
									</NetworkSelector>
									<TokenBalance>
										<TokenBalanceIconWrapper>
											<SwapIcon src={'/images/wallet_icon.svg'} alt="wallet" style={{ width: '22px', height: '22px' }} />
											<BalanceText>
												{formatTokenBalance()}
											</BalanceText>
										</TokenBalanceIconWrapper>
										{renderNetworkAvatar(fromNetwork?.icon, fromNetwork?.name)}
									</TokenBalance>
								</NetworkRow>

								<InputTokenRow>
									<NumericalInput
										value={fromAmount}
										onUserInput={handleTypeInput}
										placeholder="0"
										style={{
											textAlign: 'left',
											fontSize: '24px',
											fontWeight: 500,
											flex: 1,
											background: 'transparent',
											border: 'none',
											outline: 'none',
											color: '#fff'
										}}
									/>
									<TokenSelector onClick={() => setShowFromTokenModal(true)}>
										{renderTokenAvatar(fromToken?.icon, fromToken?.name)}
										<TokenSymbol>{fromToken?.symbol || 'Select token first'}</TokenSymbol>
										<StyledDropDown src={'/images/dropdown.svg'} alt="dropdown" />
									</TokenSelector>
								</InputTokenRow>
							</BridgeInputPanel>

							<AutoColumn justify="space-between">
								<AutoRow justify={'center'} style={{ padding: '0 1rem', position: 'relative' }}>
									<SwapIconWrapper>
										<SwapIcon src={`/images/swap_icon.svg`} alt="arrow-down" />
									</SwapIconWrapper>
								</AutoRow>
							</AutoColumn>

							{/* To Section - 只显示信息，不可选择 */}
							<BridgeInputPanel>
								<NetworkRow>
									<ToNetworkInfo>
										To: {toNetwork?.name || 'Select token first'}
									</ToNetworkInfo>
									{renderNetworkAvatar(toNetwork?.icon, toNetwork?.name)}
								</NetworkRow>

								<ToInputTokenRow>
									{/* <NumericalInput
										value={toAmount}
										onUserInput={handleTypeOutput}
										placeholder="0"
										style={{
											textAlign: 'left',
											fontSize: '24px',
											fontWeight: 500,
											flex: 1,
											background: 'transparent',
											border: 'none',
											outline: 'none',
											color: '#fff'
										}}
									/> */}
									<ToTokenInfo>
										{renderTokenAvatar(toToken?.icon, toToken?.name)}
										<TokenSymbol>{toToken?.symbol || 'Select token first'}</TokenSymbol>
									</ToTokenInfo>
								</ToInputTokenRow>
							</BridgeInputPanel>
						</BridgeSection>

						<TermsSection>
							<Checkbox
								type="checkbox"
								checked={termsAccepted}
								onChange={e => setTermsAccepted(e.target.checked)}
							/>
							{/* <TermsText>
								I have read and agree to the{' '}
								<a href="#" target="_blank" rel="noopener noreferrer">
									Terms and Conditions
								</a>
								.
							</TermsText> */}
							<TermsText>
								I have read and agree to the Terms and Conditions.
							</TermsText>
						</TermsSection>

						{address ? (
							<BottomGrouping>
								<ActionButton
									disabled={buttonDisabled}
									onClick={handleButtonClick}
								>
									{buttonText}
								</ActionButton>
							</BottomGrouping>
						) : (
							<div style={{ width: '100%' }}>
								<ConnectButton.Custom>
									{({ openConnectModal }) => (
										<ActionButton onClick={openConnectModal}>Connect Wallet</ActionButton>
									)}
								</ConnectButton.Custom>
							</div>
						)}
					</AutoColumn>
				) : (
					<AutoColumn gap={'sm'}>
						{/* <HistoryTopBar>
							<SearchBox>
								<SearchIcon />
								<SearchInput
									placeholder="Search any wallet address"
									value={historyAddress}
									onChange={(e) => setHistoryAddress(e.target.value)}
								/>
							</SearchBox>
							<SearchButton onClick={handleSearchHistory}>Search</SearchButton>
						</HistoryTopBar> */}

						<HistoryInnerTabs>
							<HistoryInnerTab active={historyTab === 'pending'} onClick={() => setHistoryTab('pending')}>Pending Transactions</HistoryInnerTab>
							<HistoryInnerTab active={historyTab === 'settled'} onClick={() => setHistoryTab('settled')}>Settled Transactions</HistoryInnerTab>
						</HistoryInnerTabs>

						<HistoryCard>
							{historyLoading ? (
								<div className="text-center">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C1FF72] mx-auto mb-3"></div>
									<div className="text-white text-sm">Loading history...</div>
								</div>
							) : historyError ? (
								<EmptyText>{historyError}</EmptyText>
							) : (historyTab === 'pending' ? (
								<HistoryList>
									{historyPending.length === 0 ? (
										<EmptyText>No pending transactions</EmptyText>
									) : (
										<>
											<HistoryHeader>
												<div>From</div>
												<div>To</div>
												<div>Tx Hash</div>
												<div>Amount</div>
												<div>Confirmation</div>
												<div>Create Time</div>
												<div>Status</div>
											</HistoryHeader>
											{historyPending.map((it) => (
												<HistoryRow key={it.tx_hash}>
													<div>{it.from_chain}</div>
													<div>{it.to_chain}</div>
													<HashMono href={`${it.url_source}`} target="_blank" rel="noopener noreferrer">{it.tx_hash ? shortHash(it.tx_hash) : '-'}</HashMono>
													<div>{formatAmount(it.amount, it.token_symbol)}</div>
													<div>{Number(it.confirm_count / (it.confirm_count + it.reject_count)).toFixed(2)}</div>
													<div>{formatTime(it.create_time)}</div>
													<StatusTag ok={false}>{it.status || 'Pending'}</StatusTag>
												</HistoryRow>
											))}
										</>
									)}
								</HistoryList>
							) : (
								<HistoryList>
									{historyFinish.length === 0 ? (
										<EmptyText>No settled transactions</EmptyText>
									) : (
										<>
											<HistoryHeader>
												<div>From</div>
												<div>To</div>
												<div>Tx Hash</div>
												<div>Amount</div>
												<div>Confirmation</div>
												<div>Create Time</div>
												<div>Status</div>
											</HistoryHeader>
											{historyFinish.map((it) => (
												<HistoryRow key={it.tx_hash}>
													<div>{it.from_chain}</div>
													<div>{it.to_chain}</div>
													<HashMono href={`${it.url_source}`} target="_blank" rel="noopener noreferrer">{it.tx_hash ? shortHash(it.tx_hash) : '-'}</HashMono>
													<div>{formatAmount(it.amount, it.token_symbol)}</div>
													<div>{Number(it.confirm_count / (it.confirm_count + it.reject_count)).toFixed(2)}</div>
													<div>{formatTime(it.create_time)}</div>
													<HashMono href={`${it.url_target}`} target="_blank" rel="noopener noreferrer">
														<StatusTag ok>{it.status || 'Executed'}</StatusTag>
													</HashMono>
												</HistoryRow>
											))}
										</>
									)}
								</HistoryList>
							))}
						</HistoryCard>
					</AutoColumn>
				)}
			</Wrapper>

			{/* Network Selection Modal */}
			<NetworkSelectModal
				isOpen={showFromNetworkModal}
				onClose={() => setShowFromNetworkModal(false)}
				onSelect={handleFromNetworkSelect}
				title="Select Source Network"
				networks={getAvailableNetworks()}
			/>

			{/* Token Selection Modal */}
			<TokenSelectModal
				isOpen={showFromTokenModal}
				onClose={() => setShowFromTokenModal(false)}
				onSelect={handleFromTokenSelect}
				title="Select Token"
				networkId={fromNetwork?.id || ''}
				chainId={fromNetwork?.chainId}
				tokens={getAvailableTokens()}
				networkName={fromNetwork?.name || ''}
			/>
		</Page>
	);
}
