'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function InstitutionProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [institution, setInstitution] = useState({
    id: '',
    name: '',
    apiEndpoint: '',
    publicKey: '',
    createdAt: '',
    updatedAt: '',
  })
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ apiEndpoint: '', publicKey: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch('/api/dashboard/institution', { cache: 'no-store' })
      if (!res.ok) {
        setError('Failed to load institution')
        return
      }
      const { institution } = await res.json()
      setInstitution(institution)
      setForm({ apiEndpoint: institution.apiEndpoint, publicKey: institution.publicKey })
    }
    fetchProfile()
  }, [])

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setError('')
    setMessage('')
    const res = await fetch('/api/dashboard/institution', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Update failed')
    } else {
      const { institution: updated } = await res.json()
      setInstitution(updated)
      setMessage('Profile updated successfully')
      setEditMode(false)
    }
  }

  if (!session) return null

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Institution Profile</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {message && <p className="text-green-600 mb-2">{message}</p>}
      <div className="mb-6">
        <p><strong>Name:</strong> {institution.name}</p>
        <p><strong>Created At:</strong> {new Date(institution.createdAt).toLocaleString()}</p>
        <p><strong>Updated At:</strong> {new Date(institution.updatedAt).toLocaleString()}</p>
      </div>
      {session.user.institutionRole === 'ADMIN' ? (
        <>
          <button
            onClick={() => setEditMode(!editMode)}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
          {editMode && (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
              <div>
                <label className="block font-medium mb-1">API Endpoint</label>
                <input
                  type="text"
                  value={form.apiEndpoint}
                  onChange={(e) => setForm({ ...form, apiEndpoint: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Public Key</label>
                <textarea
                  value={form.publicKey}
                  onChange={(e) => setForm({ ...form, publicKey: e.target.value })}
                  className="w-full border px-3 py-2 rounded h-32"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Changes
              </button>
            </form>
          )}
        </>
      ) : (
        <div className="space-y-4 max-w-lg">
          <p><strong>API Endpoint:</strong> {institution.apiEndpoint}</p>
          <p><strong>Public Key:</strong></p>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">{institution.publicKey}</pre>
        </div>
      )}
    </div>
  )
}