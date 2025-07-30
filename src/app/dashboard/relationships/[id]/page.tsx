'use client'

import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Relationship {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  requesterRole: { id: string; name: string }
  providerRole: { id: string; name: string }
  dataSchema: { id: string; schemaId: string; description: string }
}

export default function RelationshipDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const { data: session, status } = useSession()
  const [relationship, setRelationship] = useState<Relationship | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchRelationship() {
      try {
        const res = await fetch(`/api/dashboard/relationships/${id}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setRelationship(json.relationship)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchRelationship()
  }, [id])

  const updateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/dashboard/relationships/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Action failed')
      }
      const { relationship: updated } = await res.json()
      setRelationship(updated)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) return <p className="p-8">Loading...</p>
  if (error) return <p className="p-8 text-red-600">Error: {error}</p>
  if (!relationship) return <p className="p-8">No data</p>

  const { status: currentStatus, createdAt, updatedAt, requesterRole, providerRole, dataSchema } = relationship

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Relationship {id}</h1>
      <dl className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <dt className="font-semibold">Status</dt>
          <dd>{currentStatus}</dd>
        </div>
        <div>
          <dt className="font-semibold">Created At</dt>
          <dd>{new Date(createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="font-semibold">Updated At</dt>
          <dd>{new Date(updatedAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="font-semibold">Data Schema</dt>
          <dd>{dataSchema.schemaId} - {dataSchema.description}</dd>
        </div>
        <div>
          <dt className="font-semibold">Requester Role</dt>
          <dd>{requesterRole.name}</dd>
        </div>
        <div>
          <dt className="font-semibold">Provider Role</dt>
          <dd>{providerRole.name}</dd>
        </div>
      </dl>

      <div className="flex space-x-2">
        {currentStatus === 'PENDING' && (
          <>            
            <button
              onClick={() => updateStatus('ACTIVE')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => updateStatus('REJECTED')}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reject
            </button>
          </>
        )}
        {currentStatus !== 'REVOKED' && (
          <button
            onClick={() => updateStatus('REVOKED')}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Revoke
          </button>
        )}
      </div>
    </div>
  )
}
