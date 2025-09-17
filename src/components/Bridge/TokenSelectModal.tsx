import React, { useState, useMemo } from 'react'
import styled from 'styled-components'
import { X } from 'react-feather'
import Modal from '../Modal'
import { useAccount, useReadContracts } from 'wagmi'
import { formatEther } from 'viem'

const ModalContent = styled.div`
  background: #1a1a1a;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 962px;
  max-height: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`

const ModalTitle = styled.h2`
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 0.7;
  }
`

// const SearchContainer = styled.div`
//   position: relative;
//   margin-bottom: 20px;
//   display: flex;
//   gap: 12px;
// `

// const SearchInput = styled.input`
//   flex: 1;
//   background: #2a2a2a;
//   border: 1px solid #3a3a3a;
//   border-radius: 8px;
//   padding: 12px 16px 12px 40px;
//   color: #fff;
//   font-size: 14px;

//   &::placeholder {
//     color: #666;
//   }

//   &:focus {
//     outline: none;
//     border-color: #c1ff72;
//   }
// `

// const SearchIcon = styled(Search)`
//   position: absolute;
//   left: 12px;
//   top: 50%;
//   transform: translateY(-50%);
//   color: #666;
//   width: 16px;
//   height: 16px;
// `

// const AddButton = styled.button`
//   background: #c1ff72;
//   color: #000;
//   border: none;
//   border-radius: 8px;
//   padding: 12px 16px;
//   font-size: 14px;
//   font-weight: 600;
//   cursor: pointer;
//   display: flex;
//   align-items: center;
//   gap: 6px;
//   transition: background 0.2s ease;

//   &:hover {
//     background: #b8f066;
//   }
// `

const SectionTitle = styled.div`
  color: #999;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
`

const TokenList = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
`

const TokenItem = styled.div<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
  background: ${props => (props.selected ? '#2a2a2a' : 'transparent')};

  &:hover {
    background: #2a2a2a;
  }
`

const TokenIcon = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
`

const TokenInfo = styled.div`
  flex: 1;
`

const TokenName = styled.div`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
`

const TokenDescription = styled.div`
  color: #999;
  font-size: 12px;
  line-height: 1.4;
`

const TokenBalance = styled.div`
  color: #fff;
  font-size: 14px;
  font-weight: 500;
`

const ManageLink = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  color: #c1ff72;
  font-size: 14px;
  cursor: pointer;
  border-top: 1px solid #2a2a2a;

  &:hover {
    opacity: 0.8;
  }
`

const TokenFallbackCircle = styled.div`
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
  margin-right: 16px;
`;

function renderTokenAvatar(src?: string, label?: string) {
  if (src && src.trim().length > 0) {
    return <TokenIcon src={src} alt={label || ''} onError={(e) => ((e.currentTarget.style.display = 'none'), void 0)} />;
  }
  const ch = (label || '').trim().charAt(0).toUpperCase() || '?';
  return <TokenFallbackCircle>{ch}</TokenFallbackCircle>;
}

interface Token {
  id: string
  name: string
  symbol: string
  description: string
  icon: string
  balance: string
  address: string
  toChainId?: number
  toToken?: string
}

interface TokenSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (token: Token) => void
  title: string
  networkId: string
  networkName: string
  tokens?: Token[]
  chainId?: number
}

const getDefaultTokensByNetwork = (networkId: string): Token[] => {
  const tokens: { [key: string]: Token[] } = {
    ethereum: [
      {
        id: 'eth',
        name: 'Ethereum',
        symbol: 'ETH',
        description: 'Native token on Ethereum',
        icon: 'Ξ',
        balance: '0 ETH',
        address: '0x0000000000000000000000000000000000000000'
      },
      {
        id: 'usdc',
        name: 'USD Coin',
        symbol: 'USDC',
        description: 'USD-pegged stablecoin',
        icon: '$',
        balance: '0 USDC',
        address: '0xA0b86a33E6441b8c4C8C0e4b8c4C8C0e4b8c4C8C'
      }
    ],
    mova: [
      {
        id: 'mova',
        name: 'Mova',
        symbol: 'MOVA',
        description: 'Native token on Mova',
        icon: 'M',
        balance: '0 MOVA',
        address: '0x0000000000000000000000000000000000000000'
      },
      {
        id: 'usdc-mova',
        name: 'USD Coin',
        symbol: 'USDC',
        description: 'USD-pegged stablecoin on Mova',
        icon: '$',
        balance: '0 USDC',
        address: '0xB1c86a33E6441b8c4C8C0e4b8c4C8C0e4b8c4C8C'
      }
    ],
    arbitrum: [
      {
        id: 'eth-arb',
        name: 'Ethereum',
        symbol: 'ETH',
        description: 'Native token on Arbitrum One',
        icon: 'Ξ',
        balance: '0 ETH',
        address: '0x0000000000000000000000000000000000000000'
      }
    ],
    polygon: [
      {
        id: 'matic',
        name: 'Polygon',
        symbol: 'MATIC',
        description: 'Native token on Polygon',
        icon: 'P',
        balance: '0 MATIC',
        address: '0x0000000000000000000000000000000000000000'
      }
    ]
  }

  return tokens[networkId] || []
}

const ERC20_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }
] as const

export default function TokenSelectModal({
  isOpen,
  onClose,
  onSelect,
  title,
  networkId,
  networkName,
  tokens,
  chainId
}: TokenSelectModalProps) {
  const [searchTerm] = useState('')
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const { address } = useAccount()

  const tokenList = tokens || getDefaultTokensByNetwork(networkId)

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

  // 仅对符合 ERC20 的 token 构建批量查询（过滤掉零地址/原生币）
  const erc20Tokens = useMemo(
    () => tokenList.filter(t => t.address && t.address.toLowerCase() !== ZERO_ADDRESS),
    [tokenList]
  )

  const { data: balanceResults } = useReadContracts({
    contracts: !address
      ? []
      : erc20Tokens.map(t => ({
          abi: ERC20_ABI,
          address: t.address as `0x${string}`,
          functionName: 'balanceOf',
          args: [address],
          chainId
        })),
    query: { enabled: Boolean(isOpen && address && chainId && erc20Tokens.length > 0) }
  })

  type BalanceItem = { result?: bigint } | undefined

  // 生成 tokenId -> 展示余额 的映射
  const tokenIdToBalance = useMemo(() => {
    const map: Record<string, string> = {}

    // 先为所有 token 设定一个默认显示（避免未命中时报空）
    tokenList.forEach(t => {
      map[t.id] = t.balance
    })

    const results = (balanceResults as BalanceItem[]) || []

    if (results.length === erc20Tokens.length && erc20Tokens.length > 0) {
      erc20Tokens.forEach((t, i) => {
        const val = results[i]?.result ?? BigInt(0)
        map[t.id] = `${Number(parseFloat(formatEther(val)).toFixed(4)).toLocaleString()} ${t.symbol}`
      })
    }

    return map
  }, [balanceResults, erc20Tokens, tokenList])

  const filteredTokens = tokenList.filter(
    token =>
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (token: Token) => {
    setSelectedToken(token)
    onSelect(token)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        {/* <SearchContainer>
          <div style={{ position: 'relative', flex: 1 }}>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search token name"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          <AddButton>
            <Plus size={16} />
            Add
          </AddButton>
        </SearchContainer> */}

        <SectionTitle>Core Chains</SectionTitle>

        <TokenList>
          {filteredTokens.map(token => (
            <TokenItem key={token.id} selected={selectedToken?.id === token.id} onClick={() => handleSelect(token)}>
              {renderTokenAvatar(token.icon, token.name)}
              <TokenInfo>
                <TokenName>{token.name}</TokenName>
                <TokenDescription>Native token on {networkName}</TokenDescription>
              </TokenInfo>
              <TokenBalance>{tokenIdToBalance[token.id]}</TokenBalance>
            </TokenItem>
          ))}
        </TokenList>

        <ManageLink>Manage token lists →</ManageLink>
      </ModalContent>
    </Modal>
  )
}
