import React, { useState } from 'react'
import styled from 'styled-components'
import { X, Search } from 'react-feather'
import Modal from '../Modal'

const ModalContent = styled.div`
  background: linear-gradient(to bottom, #000000, #231f20);
  box-shadow: 0 10px 9.4px -2px rgba(0, 0, 0, 0.25);
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

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`

const SearchInput = styled.input`
  width: 100%;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 12px 16px 12px 40px;
  color: #fff;
  font-size: 14px;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
    border-color: #c1ff72;
  }
`

const SearchIcon = styled(Search)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  width: 16px;
  height: 16px;
`

const SectionTitle = styled.div`
  color: #999;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
`

const NetworkList = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
`

const NetworkItem = styled.div<{ selected?: boolean }>`
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

const NetworkIcon = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
`

const NetworkInfo = styled.div`
  flex: 1;
`

const NetworkName = styled.div`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
`

const NetworkDescription = styled.div`
  color: #999;
  font-size: 12px;
  line-height: 1.4;
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
  text-decoration: none;
  &:hover {
    opacity: 0.8;
  }
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
  margin-right: 16px;
`;

function renderNetworkAvatar(src?: string, label?: string) {
  if (src && src.trim().length > 0) {
    return <NetworkIcon src={src} alt={label || ''} onError={(e) => ((e.currentTarget.style.display = 'none'), void 0)} />;
  }
  const ch = (label || '').trim().charAt(0).toUpperCase() || '?';
  return <NetworkFallbackCircle>{ch}</NetworkFallbackCircle>;
}
interface Network {
  id: string
  name: string
  description: string
  icon: string
  chainId: number
  contract?: string
  explorerUrl?: string
  rpc?: string
}

interface NetworkSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (network: Network) => void
  title: string
  networks?: Network[]
}

export default function NetworkSelectModal({
  isOpen,
  onClose,
  onSelect,
  title,
  networks = []
}: NetworkSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)

  // Default networks if none provided
  const defaultNetworks: Network[] = []

  const networkList = networks.length > 0 ? networks : defaultNetworks

  const filteredNetworks = networkList.filter(network => network.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleSelect = (network: Network) => {
    setSelectedNetwork(network)
    onSelect(network)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onClose} maxWidth="962px">
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <SearchContainer>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Search a network name"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>

        <SectionTitle>Core Chains</SectionTitle>

        <NetworkList>
          {filteredNetworks.map(network => (
            <NetworkItem
              key={network.id}
              selected={selectedNetwork?.id === network.id}
              onClick={() => handleSelect(network)}
            >
              {renderNetworkAvatar(network.icon, network.name)}
              <NetworkInfo>
                <NetworkName>{network.name}</NetworkName>
                <NetworkDescription>
                  {network.description.split('\n').map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </NetworkDescription>
              </NetworkInfo>
            </NetworkItem>
          ))}
        </NetworkList>

        {/* <ManageLink>Manage token lists →</ManageLink> */}
      </ModalContent>
    </Modal>
  )
}
