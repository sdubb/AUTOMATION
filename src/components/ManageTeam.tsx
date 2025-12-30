import { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Shield, AlertCircle, Users } from 'lucide-react';
import { backendService } from '../lib/backendService';
import { EmptyState } from './EmptyState';
import { SkeletonLoader } from './SkeletonLoader';

interface TeamMember {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'member';
  joinedAt: string;
  status: 'active' | 'invited' | 'pending';
}

interface ManageTeamProps {
  onClose: () => void;
  currentUserRole?: 'admin' | 'member';
}

export function ManageTeam({ onClose, currentUserRole = 'admin' }: ManageTeamProps) {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: '1',
      email: 'you@example.com',
      name: 'You',
      role: 'admin',
      joinedAt: new Date().toISOString(),
      status: 'active',
    },
  ]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const isAdmin = currentUserRole === 'admin';

  // Load team members on mount
  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      // Activepieces teams API available
      const team = await backendService.teams.getCurrent();
      if (team && team.members) {
        setMembers(team.members);
      }
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!isAdmin) {
      setError('Only admins can invite members');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call backendService teams API
      await backendService.teams.inviteMember(inviteEmail, inviteRole);
      
      const newMember: TeamMember = {
        id: `user_${Date.now()}`,
        email: inviteEmail,
        role: inviteRole,
        joinedAt: new Date().toISOString(),
        status: 'invited',
      };

      setMembers([...members, newMember]);
      setInviteEmail('');
      setInviteRole('member');
      
      // Reload to get latest
      await loadTeamMembers();
    } catch (err) {
      setError(`Failed to send invite: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'member') => {
    if (!isAdmin) {
      setError('Only admins can change roles');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call backendService to update member role
      await backendService.teams.updateMemberRole(memberId, newRole);

      setMembers(
        members.map((m) =>
          m.id === memberId
            ? { ...m, role: newRole }
            : m
        )
      );

      // Reload to ensure sync
      await loadTeamMembers();
    } catch (err) {
      setError(`Failed to change role: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isAdmin) {
      setError('Only admins can remove members');
      return;
    }

    if (members.length === 1) {
      setError('Cannot remove the last member');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call backendService to remove member
      await backendService.teams.removeMember(memberId);
      
      setMembers(members.filter((m) => m.id !== memberId));

      // Reload to ensure sync
      await loadTeamMembers();
    } catch (err) {
      setError(`Failed to remove member: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Manage Team</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Invite Form */}
          {isAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Invite Team Member
              </h3>

              <form onSubmit={handleInvite} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Invite'}
                </button>
              </form>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 items-start p-3 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members ({members.length})
            </h3>
            {loading && <SkeletonLoader count={3} />}
            {!loading && members.length === 0 ? (
              <EmptyState
                icon={<Users className="w-8 h-8 text-gray-400" />}
                title="No team members yet"
                description="Invite team members to collaborate on automations"
                action={{ label: 'Invite Member', onClick: () => {} }}
              />
            ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{member.email}</p>
                      <p className="text-xs text-gray-600">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          member.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {member.role === 'admin' && <Shield className="w-3 h-3 inline mr-1" />}
                        {member.role}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          member.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {member.status}
                      </span>
                    </div>
                  </div>

                  {/* Expand Member Actions */}
                  {isAdmin && (
                    <button
                      onClick={() =>
                        setExpandedMember(expandedMember === member.id ? null : member.id)
                      }
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {expandedMember === member.id ? 'Hide' : 'Show'} Options
                    </button>
                  )}

                  {expandedMember === member.id && isAdmin && (
                    <div className="mt-2 flex gap-2">
                      {member.role !== 'admin' ? (
                        <button
                          onClick={() => handleChangeRole(member.id, 'admin')}
                          className="flex-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Make Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => handleChangeRole(member.id, 'member')}
                          className="flex-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Make Member
                        </button>
                      )}
                      {members.length > 1 && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            )}
          </div>

          {!isAdmin && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              Only admins can manage team members. Contact an admin to invite or remove users.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
