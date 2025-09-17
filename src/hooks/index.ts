import { useEffect, useState } from 'react'


interface BridgeToken {
    to_chain_id: number
    to_token: string
  }
  
  interface BridgeChain {
    chain: string
    chain_id: number
    contract: string
    support_tokens: { [tokenSymbol: string]: BridgeToken }
    explorer_url: string
    rpc: string
  }

interface BridgeParams {
    chains: { [chainKey: string]: BridgeChain }
  }
  
  interface BridgeApiResponse {
    code: number
    msg: string
    data: BridgeParams
  }

export function useBridgeParams() {
    const [data, setData] = useState<BridgeParams | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
  
    useEffect(() => {
      const fetchBridgeParams = async () => {
        try {
          setLoading(true)
          setError(null)
  
          const response = await fetch('http://15.206.56.79:38005/api/v1/params')
  
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
  
          const result: BridgeApiResponse = await response.json()
  
          if (result.code === 0) {
            setData(result.data)
          } else {
            throw new Error(result.msg || 'API returned error')
          }
        } catch (err) {
          console.error('Failed to fetch bridge params:', err)
          setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
          setLoading(false)
        }
      }
  
      fetchBridgeParams()
    }, [])
  
    return { data, loading, error }
  }