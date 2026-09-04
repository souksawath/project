import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Mail, Clock, DollarSign, Palette } from 'lucide-react';
import { Resource, Language } from '../types';
import { translations } from '../utils/i18n';

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resource: Resource) => void;
  resource: Resource | null;
  language: Language;
}

const COLOR_OPTIONS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#d946ef', // Fuchsia
  '#ea580c', // Orange
  '#4f46e5', // Indigo
  '#0891b2', // Cyan
  '#e11d48', // Rose
  '#7c3aed', // Purple
];

export const ResourceModal: React.FC<ResourceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  resource,
  language,
}) => {
  const t = translations[language];

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [capacity, setCapacity] = useState(40);
  const [hourlyRate, setHourlyRate] = useState<number | undefined>(undefined);
  const [avatarColor, setAvatarColor] = useState(COLOR_OPTIONS[0]);

  useEffect(() => {
    if (resource) {
      setName(resource.name);
      setRole(resource.role);
      setEmail(resource.email);
      setCapacity(resource.capacityHoursPerWeek);
      setHourlyRate(resource.hourlyRate);
      setAvatarColor(resource.avatarColor);
    } else {
      setName('');
      setRole('');
      setEmail('');
      setCapacity(40);
      setHourlyRate(undefined);
      setAvatarColor(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]);
    }
  }, [resource, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: resource ? resource.id : `res-${Date.now()}`,
      name: name.trim(),
      role: role.trim() || 'Team Member',
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@company.la`,
      capacityHoursPerWeek: capacity || 40,
      hourlyRate,
      avatarColor,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: avatarColor }}
            >
              {name ? name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {resource
                  ? language === 'la' ? 'ແກ້ໄຂຂໍ້ມູນສະມາຊິກ' : 'Edit Resource'
                  : language === 'la' ? 'ເພີ່ມສະມາຊິກ/ຊັບພະຍາກອນໃໝ່' : 'Add New Resource'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'la' ? 'ກຳນົດຊື່, ຕຳແໜ່ງ ແລະ ຄວາມສາມາດ' : 'Team member details'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'la' ? 'ຊື່ ແລະ ນາມສະກຸນ' : 'Full Name'} *
            </label>
            <input
              id="modal-resource-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'la' ? 'ຕົວຢ່າງ: ສົມສັກ ວົງສາ' : 'e.g. John Doe'}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.role} *
            </label>
            <input
              id="modal-resource-role"
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder={language === 'la' ? 'ຕົວຢ່າງ: Project Manager, Lead Developer...' : 'e.g. Frontend Developer'}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.email}
            </label>
            <input
              id="modal-resource-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.la"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Capacity & Hourly Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.capacity}
              </label>
              <input
                id="modal-resource-capacity"
                type="number"
                min="5"
                max="80"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 40)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rate ($/hr)
              </label>
              <input
                id="modal-resource-rate"
                type="number"
                min="0"
                value={hourlyRate || ''}
                onChange={(e) => setHourlyRate(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="40"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Avatar Color */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'la' ? 'ສີປະຈຳຕົວ (Avatar Tag)' : 'Color Badge'}</span>
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setAvatarColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    avatarColor === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
