import React, { useState } from 'react';
import { useIntegrations, useConnections } from '@/hooks/useActivepieces';
import { Trash2, Plus, Loader, CheckCircle } from 'lucide-react';

export function IntegrationsBrowser() {
  const { pieces, loading: loadingPieces } = useIntegrations();
  const { connections, createConnection, deleteConnection, loading: loadingConnections } = useConnections();
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Integrations List */}
      <div className="lg:col-span-1 border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 p-4 border-b">
          <h3 className="font-semibold text-gray-900">Available Integrations</h3>
          <p className="text-xs text-gray-600 mt-1">{pieces.length} integrations</p>
        </div>
        <div className="overflow-y-auto max-h-[500px]">
          {loadingPieces ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          ) : pieces.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">No integrations found</div>
          ) : (
            <div className="space-y-1 p-2">
              {pieces.map((piece) => (
                <button
                  key={piece.name}
                  onClick={() => setSelectedPiece(piece.name)}
                  className={`w-full text-left px-3 py-2 rounded transition ${
                    selectedPiece === piece.name
                      ? 'bg-blue-100 text-blue-900'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="font-medium text-sm">{piece.displayName}</div>
                  <div className="text-xs opacity-75">{piece.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Connections Manager */}
      <div className="lg:col-span-2 space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Active Connections</h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Connection
            </button>
          </div>

          {showForm && (
            <ConnectionForm
              selectedPiece={selectedPiece}
              onSuccess={() => setShowForm(false)}
            />
          )}

          {loadingConnections && !connections.length ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          ) : connections.length === 0 ? (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center text-sm text-gray-600">
              No connections yet. Add your first integration.
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map((conn) => (
                <ConnectionItem key={conn.id} connection={conn} onDelete={deleteConnection} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ConnectionFormProps {
  selectedPiece: string | null;
  onSuccess: () => void;
}

function ConnectionForm({ selectedPiece, onSuccess }: ConnectionFormProps) {
  const { createConnection } = useConnections();
  const [name, setName] = useState('');
  const [credentials, setCredentials] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPiece || !name || !credentials) return;

    setLoading(true);
    setError(null);

    try {
      const creds = JSON.parse(credentials);
      await createConnection(name, selectedPiece, creds);
      setName('');
      setCredentials('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Connection Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., My Gmail Account"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Credentials (JSON)
        </label>
        <textarea
          value={credentials}
          onChange={(e) => setCredentials(e.target.value)}
          placeholder='{"apiKey": "...", "email": "..."}'
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          rows={4}
          required
        />
        <p className="text-xs text-gray-600 mt-1">
          Paste your API credentials as JSON. Check integration docs for required fields.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !selectedPiece}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
      >
        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        {loading ? 'Creating...' : 'Create Connection'}
      </button>
    </form>
  );
}

interface ConnectionItemProps {
  connection: any;
  onDelete: (id: string) => Promise<void>;
}

function ConnectionItem({ connection, onDelete }: ConnectionItemProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Delete connection "${connection.name}"?`)) {
      setDeleting(true);
      try {
        await onDelete(connection.id);
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition">
      <div>
        <p className="font-medium text-gray-900">{connection.name}</p>
        <p className="text-xs text-gray-600">{connection.type}</p>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="p-2 text-red-600 hover:bg-red-100 rounded transition disabled:opacity-50"
      >
        {deleting ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
