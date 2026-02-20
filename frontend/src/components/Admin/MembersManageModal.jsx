import { useState } from 'react';
import { Users, UserPlus, X, Loader2, Check, AlertCircle, Trash2, ChevronDown, Shield, Crown, User } from 'lucide-react';
import api from '../../services/api';

const ROLE_CONFIG = {
  owner: { label: 'Owner', icon: Crown, avatarCls: 'bg-purple-100 text-purple-600', badgeCls: 'bg-purple-100 text-purple-700', badgeHoverCls: 'hover:bg-purple-200' },
  admin: { label: 'Admin', icon: Shield, avatarCls: 'bg-blue-100 text-blue-600', badgeCls: 'bg-blue-100 text-blue-700', badgeHoverCls: 'hover:bg-blue-200' },
  manager: { label: 'Manager', icon: Users, avatarCls: 'bg-teal-100 text-teal-600', badgeCls: 'bg-teal-100 text-teal-700', badgeHoverCls: 'hover:bg-teal-200' },
  user: { label: 'Utente', icon: User, avatarCls: 'bg-gray-100 text-gray-600', badgeCls: 'bg-gray-100 text-gray-700', badgeHoverCls: 'hover:bg-gray-200' }
};

export default function MembersManageModal({
  entityType, // 'organization' | 'activity'
  entityId,
  entityName,
  members: initialMembers,
  onUpdate,
  onClose
}) {
  const [members, setMembers] = useState(initialMembers || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [loading, setLoading] = useState(null); // 'add' | memberId
  const [editingRole, setEditingRole] = useState(null); // memberId
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isOrg = entityType === 'organization';
  const availableRoles = isOrg
    ? ['owner', 'admin', 'manager', 'user']
    : ['owner', 'admin', 'user'];

  const basePath = isOrg
    ? `/admin/organizations/${entityId}/members`
    : `/admin/activities/${entityId}/members`;

  const clearFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setLoading('add');
    clearFeedback();

    try {
      const response = await api.request(basePath, {
        method: 'POST',
        body: JSON.stringify({ email: newEmail.trim(), role: newRole })
      });

      if (response.success) {
        setMembers(prev => [...prev, response.data]);
        setNewEmail('');
        setNewRole('user');
        setShowAddForm(false);
        setSuccess('Membro aggiunto con successo');
        if (onUpdate) onUpdate();
      } else {
        setError(response.error || 'Errore nell\'aggiunta');
      }
    } catch (err) {
      setError(err.message || 'Errore nell\'aggiunta del membro');
    }
    setLoading(null);
  };

  const handleChangeRole = async (memberId, newRole) => {
    setLoading(memberId);
    clearFeedback();

    try {
      const response = await api.request(`${basePath}/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });

      if (response.success) {
        setMembers(prev => prev.map(m =>
          m.id === memberId ? { ...m, role: newRole } : m
        ));
        setEditingRole(null);
        setSuccess('Ruolo aggiornato');
        if (onUpdate) onUpdate();
      } else {
        setError(response.error || 'Errore nell\'aggiornamento');
      }
    } catch (err) {
      setError(err.message || 'Errore nell\'aggiornamento del ruolo');
    }
    setLoading(null);
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Rimuovere ${memberName || 'questo membro'}?`)) return;

    setLoading(memberId);
    clearFeedback();

    try {
      const response = await api.request(`${basePath}/${memberId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        setSuccess('Membro rimosso');
        if (onUpdate) onUpdate();
      } else {
        setError(response.error || 'Errore nella rimozione');
      }
    } catch (err) {
      setError(err.message || 'Errore nella rimozione del membro');
    }
    setLoading(null);
  };

  const ownerCount = members.filter(m => m.role === 'owner').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Gestione Membri</h3>
              <p className="text-sm text-gray-500">{entityName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
          {members.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6 italic">Nessun membro</p>
          ) : (
            members.map((member) => {
              const roleConf = ROLE_CONFIG[member.role] || ROLE_CONFIG.user;
              const RoleIcon = roleConf.icon;
              const isOwner = member.role === 'owner';
              const isLastOwner = isOwner && ownerCount <= 1;
              const isEditing = editingRole === member.id;
              const isLoading = loading === member.id;

              return (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${roleConf.avatarCls}`}>
                    {(member.fullName || member.email || '?').charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{member.fullName || 'Nome non impostato'}</p>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  </div>

                  {/* Role badge / edit */}
                  {isEditing ? (
                    <div className="relative">
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                        onBlur={() => setEditingRole(null)}
                        autoFocus
                        disabled={isLoading}
                        className="text-xs px-2 py-1 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none pr-6"
                      >
                        {availableRoles.map(r => (
                          <option key={r} value={r} disabled={r === 'owner' && !isOwner}>
                            {ROLE_CONFIG[r]?.label || r}
                          </option>
                        ))}
                      </select>
                      {isLoading && <Loader2 className="w-3 h-3 animate-spin text-indigo-500 absolute right-1.5 top-1.5" />}
                    </div>
                  ) : (
                    <button
                      onClick={() => !isLastOwner && setEditingRole(member.id)}
                      disabled={isLastOwner}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${roleConf.badgeCls} ${
                        isLastOwner ? 'cursor-default' : `${roleConf.badgeHoverCls} cursor-pointer`
                      }`}
                      title={isLastOwner ? 'Unico proprietario' : 'Clicca per cambiare ruolo'}
                    >
                      <RoleIcon className="w-3 h-3" />
                      {roleConf.label}
                      {!isLastOwner && <ChevronDown className="w-3 h-3 opacity-50" />}
                    </button>
                  )}

                  {/* Remove button */}
                  {!isLastOwner && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.fullName || member.email)}
                      disabled={isLoading}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Rimuovi membro"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add Member Form */}
        {showAddForm ? (
          <form onSubmit={handleAddMember} className="p-4 border-t bg-indigo-50/50 space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email utente..."
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {availableRoles.filter(r => r !== 'owner').map(r => (
                  <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">L'utente deve già avere un account</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setNewEmail(''); clearFeedback(); }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading === 'add' || !newEmail.trim()}
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  {loading === 'add' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  Aggiungi
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-4 border-t">
            <button
              onClick={() => { setShowAddForm(true); clearFeedback(); }}
              className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Aggiungi membro
            </button>
          </div>
        )}

        {/* Feedback */}
        {(error || success) && (
          <div className={`mx-4 mb-4 p-3 rounded-xl flex items-center gap-2 ${
            success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {success ? (
              <Check className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <p className={`text-sm ${success ? 'text-green-700' : 'text-red-700'}`}>
              {success || error}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
