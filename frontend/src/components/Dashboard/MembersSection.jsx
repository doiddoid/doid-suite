import { useState } from 'react';
import { Users, UserPlus, Loader2, Check, AlertCircle, Trash2, ChevronDown, Shield, Crown, User, Pencil } from 'lucide-react';
import api from '../../services/api';

const ROLE_CONFIG = {
  owner: { label: 'Owner', icon: Crown, avatarCls: 'bg-purple-100 text-purple-600', badgeCls: 'bg-purple-100 text-purple-700', badgeHoverCls: 'hover:bg-purple-200' },
  admin: { label: 'Admin', icon: Shield, avatarCls: 'bg-blue-100 text-blue-600', badgeCls: 'bg-blue-100 text-blue-700', badgeHoverCls: 'hover:bg-blue-200' },
  manager: { label: 'Manager', icon: Users, avatarCls: 'bg-teal-100 text-teal-600', badgeCls: 'bg-teal-100 text-teal-700', badgeHoverCls: 'hover:bg-teal-200' },
  user: { label: 'Utente', icon: User, avatarCls: 'bg-gray-100 text-gray-600', badgeCls: 'bg-gray-100 text-gray-700', badgeHoverCls: 'hover:bg-gray-200' }
};

/**
 * MembersSection — Gestione membri inline (senza modal)
 *
 * Props:
 * - entityType: 'organization' | 'activity'
 * - entityId: string
 * - members: array
 * - onUpdate: () => void — callback per ricaricare i membri
 */
export default function MembersSection({ entityType, entityId, members: initialMembers, onUpdate }) {
  const [members, setMembers] = useState(initialMembers || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [loading, setLoading] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Sync members when prop changes
  useState(() => {
    setMembers(initialMembers || []);
  });

  const isOrg = entityType === 'organization';
  const availableRoles = isOrg ? ['owner', 'admin', 'manager', 'user'] : ['owner', 'admin', 'user'];
  const basePath = isOrg
    ? `/admin/organizations/${entityId}/members`
    : `/admin/activities/${entityId}/members`;

  const clearFeedback = () => { setError(null); setSuccess(null); };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setLoading('add');
    clearFeedback();
    try {
      const payload = { email: newEmail.trim(), role: newRole };
      if (newName.trim()) payload.fullName = newName.trim();
      const response = await api.request(basePath, { method: 'POST', body: JSON.stringify(payload) });
      if (response.success) {
        setMembers(prev => [...prev, response.data]);
        setNewEmail(''); setNewName(''); setNewRole('user'); setShowAddForm(false);
        setSuccess('Membro aggiunto con successo');
        onUpdate?.();
      } else {
        setError(response.error || 'Errore nell\'aggiunta');
      }
    } catch (err) {
      setError(err.message || 'Errore nell\'aggiunta del membro');
    }
    setLoading(null);
  };

  const handleEditMember = async (memberId) => {
    if (!editingMember) return;
    setLoading(memberId);
    clearFeedback();
    try {
      const response = await api.request(`${basePath}/${memberId}`, {
        method: 'PUT', body: JSON.stringify({ role: editingMember.role, fullName: editingMember.fullName })
      });
      if (response.success) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: editingMember.role, fullName: editingMember.fullName } : m));
        setEditingMember(null);
        setSuccess('Membro aggiornato');
        onUpdate?.();
      } else { setError(response.error || 'Errore nell\'aggiornamento'); }
    } catch (err) { setError(err.message || 'Errore nell\'aggiornamento'); }
    setLoading(null);
  };

  const handleChangeRole = async (memberId, role) => {
    setLoading(memberId);
    clearFeedback();
    try {
      const response = await api.request(`${basePath}/${memberId}`, { method: 'PUT', body: JSON.stringify({ role }) });
      if (response.success) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
        setEditingRole(null);
        setSuccess('Ruolo aggiornato');
        onUpdate?.();
      } else { setError(response.error || 'Errore'); }
    } catch (err) { setError(err.message || 'Errore'); }
    setLoading(null);
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Rimuovere ${memberName || 'questo membro'}?`)) return;
    setLoading(memberId);
    clearFeedback();
    try {
      const response = await api.request(`${basePath}/${memberId}`, { method: 'DELETE' });
      if (response.success) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        setSuccess('Membro rimosso');
        onUpdate?.();
      } else { setError(response.error || 'Errore'); }
    } catch (err) { setError(err.message || 'Errore'); }
    setLoading(null);
  };

  const ownerCount = members.filter(m => m.role === 'owner').length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Membri</h2>
          <span className="text-sm text-gray-400">({members.length})</span>
        </div>
      </div>

      {/* Feedback */}
      {(error || success) && (
        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${
          success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {success ? <Check className="w-4 h-4 text-green-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
          <p className={`text-sm ${success ? 'text-green-700' : 'text-red-700'}`}>{success || error}</p>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-2 mb-4">
        {members.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4 italic">Nessun membro</p>
        ) : (
          members.map((member) => {
            const roleConf = ROLE_CONFIG[member.role] || ROLE_CONFIG.user;
            const RoleIcon = roleConf.icon;
            const isOwner = member.role === 'owner';
            const isLastOwner = isOwner && ownerCount <= 1;
            const isEditingR = editingRole === member.id;
            const isEditingM = editingMember?.id === member.id;
            const isLoading = loading === member.id;

            if (isEditingM) {
              return (
                <div key={member.id} className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={editingMember.fullName}
                      onChange={(e) => setEditingMember({ ...editingMember, fullName: e.target.value })}
                      placeholder="Nome completo"
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      autoFocus
                    />
                    <select
                      value={editingMember.role}
                      onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                      disabled={isLastOwner}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                    >
                      {availableRoles.map(r => (
                        <option key={r} value={r} disabled={r === 'owner' && !isOwner}>{ROLE_CONFIG[r]?.label || r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{member.email}</p>
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditingMember(null)} className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">Annulla</button>
                      <button onClick={() => handleEditMember(member.id)} disabled={isLoading}
                        className="px-2.5 py-1 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1">
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Salva
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${roleConf.avatarCls}`}>
                  {(member.fullName || member.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{member.fullName || 'Nome non impostato'}</p>
                  <p className="text-xs text-gray-500 truncate">{member.email}</p>
                </div>
                {isEditingR ? (
                  <select value={member.role} onChange={(e) => handleChangeRole(member.id, e.target.value)}
                    onBlur={() => setEditingRole(null)} autoFocus disabled={isLoading}
                    className="text-xs px-2 py-1 border rounded-lg bg-white appearance-none pr-6">
                    {availableRoles.map(r => (
                      <option key={r} value={r} disabled={r === 'owner' && !isOwner}>{ROLE_CONFIG[r]?.label || r}</option>
                    ))}
                  </select>
                ) : (
                  <button onClick={() => !isLastOwner && setEditingRole(member.id)} disabled={isLastOwner}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${roleConf.badgeCls} ${isLastOwner ? 'cursor-default' : `${roleConf.badgeHoverCls} cursor-pointer`}`}>
                    <RoleIcon className="w-3 h-3" />{roleConf.label}{!isLastOwner && <ChevronDown className="w-3 h-3 opacity-50" />}
                  </button>
                )}
                <button onClick={() => setEditingMember({ id: member.id, fullName: member.fullName || '', role: member.role })}
                  disabled={isLoading}
                  className="p-1.5 text-gray-400 hover:text-teal-500 hover:bg-teal-50 rounded-lg opacity-0 group-hover:opacity-100">
                  <Pencil className="w-4 h-4" />
                </button>
                {!isLastOwner && (
                  <button onClick={() => handleRemoveMember(member.id, member.fullName || member.email)}
                    disabled={isLoading}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Member */}
      {showAddForm ? (
        <form onSubmit={handleAddMember} className="p-4 bg-gray-50 rounded-xl space-y-3">
          <div className="flex gap-2">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome completo" autoFocus
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {availableRoles.filter(r => r !== 'owner').map(r => (
                <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>
              ))}
            </select>
          </div>
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email utente..." required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">L'utente deve già avere un account</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowAddForm(false); setNewEmail(''); setNewName(''); clearFeedback(); }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annulla</button>
              <button type="submit" disabled={loading === 'add' || !newEmail.trim()}
                className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1.5">
                {loading === 'add' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                Aggiungi
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button onClick={() => { setShowAddForm(true); clearFeedback(); }}
          className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/50 transition-all flex items-center justify-center gap-2">
          <UserPlus className="w-4 h-4" />
          Aggiungi membro
        </button>
      )}
    </div>
  );
}
